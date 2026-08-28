import { getPaymentDetails, getCustomerHistory, retryPayment, createPaymentLink, sendRecoveryNotification, escalateCase } from "../tools"
import { getAgentDecision } from "../ai/decision-agent"
import { getReviewerDecision } from "../ai/reviewer"
import { evaluatePolicy, MAX_RECOVERY_AMOUNT, MAX_RISK_SCORE, MAX_RETRIES } from "../policy/recovery-policy"
import { prisma } from "../db/prisma"

export async function runRecoveryAgent(paymentId: string) {
  const payment = await getPaymentDetails(paymentId)
  const customer = await getCustomerHistory(payment.customerId)

  const paymentContext = {
    payment_id: payment.id,
    order_id: payment.orderId,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    failure_reason: payment.failureReason,
    payment_method: payment.paymentMethod,
    retry_count: payment.retryCount,
    customer: {
      previous_transactions: customer.previousTransactions,
      successful_transactions: customer.successfulTransactions,
      success_rate: customer.successRate
    },
    risk_score: payment.riskScore,
    policy_constraints: {
      max_recovery_amount: MAX_RECOVERY_AMOUNT,
      max_risk_score: MAX_RISK_SCORE,
      max_retries: MAX_RETRIES
    }
  }

  const decision = await getAgentDecision(paymentContext)

  const policyResult = evaluatePolicy(payment, decision.action, decision.confidence)

  let paymentStatus = payment.status
  let recoveryStatus = "UNRESOLVED"
  let revenueRecovered = 0
  let toolCalled = ""
  let toolResult = ""
  let toolSuccess = false
  let reviewerDecisionStr = "NOT_REQUIRED"

  const originalAction = decision.action

  if (!policyResult.allowed) {
    decision.action = "ESCALATE"
    recoveryStatus = "BLOCKED"
    toolCalled = "escalateCase"
    try {
      const res = await escalateCase(payment.id, `Policy blocked: ${policyResult.reason}`)
      toolResult = JSON.stringify(res)
      toolSuccess = true
    } catch(e: any) {
      toolResult = JSON.stringify({ error: e.message })
      toolSuccess = false
    }
  } else {
    if (decision.action !== "DO_NOTHING" && decision.action !== "ESCALATE") {
      const reviewer = await getReviewerDecision(paymentContext, decision.action, decision.explanation, policyResult)
      reviewerDecisionStr = reviewer.decision

      if (reviewer.decision === "APPROVE") {
        try {
          if (decision.action === "RETRY_PAYMENT") {
            toolCalled = "retryPayment"
            const res = await retryPayment(payment.id)
            toolResult = JSON.stringify(res)
            toolSuccess = true
            paymentStatus = res.status
            if (paymentStatus === "success") {
              recoveryStatus = "RECOVERED"
              revenueRecovered = payment.amount
            } else {
              recoveryStatus = "UNRESOLVED"
            }
          } else if (decision.action === "CREATE_PAYMENT_LINK") {
            toolCalled = "createPaymentLink"
            const res = await createPaymentLink(payment.orderId)
            toolResult = JSON.stringify(res)
            toolSuccess = true
            recoveryStatus = "PENDING"
          } else if (decision.action === "SEND_NOTIFICATION") {
            toolCalled = "sendRecoveryNotification"
            const res = await sendRecoveryNotification(customer.id, payment.id)
            toolResult = JSON.stringify(res)
            toolSuccess = true
            recoveryStatus = "PENDING"
          }
        } catch (e: any) {
          toolResult = JSON.stringify({ error: e.message })
          toolSuccess = false
          recoveryStatus = "UNRESOLVED"
        }
      } else {
        decision.action = "ESCALATE"
        toolResult = reviewer.explanation
        recoveryStatus = "ESCALATED"
        toolSuccess = true
      }
    } 
    
    if (decision.action === "ESCALATE" && policyResult.allowed) {
      toolCalled = "escalateCase"
      try {
        const res = await escalateCase(payment.id, "Agent requested escalation")
        toolResult = JSON.stringify(res)
        toolSuccess = true
        recoveryStatus = "ESCALATED"
      } catch (e: any) {
        toolResult = JSON.stringify({ error: e.message })
        toolSuccess = false
        recoveryStatus = "UNRESOLVED"
      }
    } else if (decision.action === "DO_NOTHING" && policyResult.allowed) {
      recoveryStatus = paymentStatus === "success" ? "RECOVERED" : "NOT_RECOVERABLE"
      toolSuccess = true
    }
  }

  await prisma.auditLog.create({
    data: {
      paymentId: payment.id,
      agentAction: originalAction,
      reason: decision.explanation,
      model: process.env.DECISION_MODEL || "gpt-4o-mini",
      confidence: decision.confidence,
      policyResult: policyResult.action,
      toolCalled,
      toolArguments: JSON.stringify({ paymentId: payment.id }),
      toolResult,
      toolSuccess,
      reviewerDecision: reviewerDecisionStr,
      paymentStatus,
      recoveryStatus,
      revenueRecovered
    }
  })

  return {
    paymentId: payment.id,
    agentAction: originalAction,
    policy: policyResult,
    reviewer: reviewerDecisionStr,
    toolExecution: {
      success: toolSuccess,
      tool: toolCalled
    },
    payment: {
      status: paymentStatus
    },
    recovery: {
      status: recoveryStatus,
      recovered: recoveryStatus === "RECOVERED",
      amountRecovered: revenueRecovered
    }
  }
}
