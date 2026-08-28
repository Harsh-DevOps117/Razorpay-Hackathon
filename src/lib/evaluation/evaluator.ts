import { prisma } from "../db/prisma"
import { runRecoveryAgent } from "../agent/orchestrator"

export async function runBatchEvaluation() {
  const payments = await prisma.payment.findMany({
    where: { status: "failed" },
    include: { customer: true }
  })

  let transactionsProcessed = 0
  let revenueAtRisk = 0
  let recoverableRevenue = 0
  let revenueRecovered = 0
  let blockedActions = 0
  let escalatedCases = 0
  let unresolvedCases = 0
  let correctDecisions = 0
  let truePositives = 0
  let falsePositives = 0
  
  const startTime = Date.now()

  for (const payment of payments) {
    revenueAtRisk += payment.amount
    if (payment.recoverable) {
      recoverableRevenue += payment.amount
    }

    try {
      const result = await runRecoveryAgent(payment.id)
      transactionsProcessed++

      if (result.recovery.status === "BLOCKED") {
        blockedActions++
      }

      if (result.recovery.status === "ESCALATED") {
        escalatedCases++
      }

      if (result.recovery.status === "UNRESOLVED") {
        unresolvedCases++
      }

      revenueRecovered += result.recovery.amountRecovered

      if (result.agentAction === payment.groundTruthAction) {
        correctDecisions++
        if (payment.recoverable && result.agentAction !== "DO_NOTHING" && result.agentAction !== "ESCALATE") {
          truePositives++
        }
      } else {
        if (!payment.recoverable && (result.agentAction === "RETRY_PAYMENT" || result.agentAction === "CREATE_PAYMENT_LINK")) {
          falsePositives++
        }
      }

    } catch (e) {
      unresolvedCases++
    }
  }

  const endTime = Date.now()
  const averageProcessingTime = transactionsProcessed > 0 ? (endTime - startTime) / transactionsProcessed : 0
  
  const recoveryRate = recoverableRevenue > 0 ? revenueRecovered / recoverableRevenue : 0
  const decisionAccuracy = transactionsProcessed > 0 ? correctDecisions / transactionsProcessed : 0
  const precision = (truePositives + falsePositives) > 0 ? truePositives / (truePositives + falsePositives) : 0
  
  const unrecoverableCount = payments.filter(p => !p.recoverable).length
  const falsePositiveRate = unrecoverableCount > 0 ? falsePositives / unrecoverableCount : 0

  const evaluationRun = await prisma.evaluationRun.create({
    data: {
      transactionsProcessed,
      revenueAtRisk,
      recoverableRevenue,
      revenueRecovered,
      recoveryRate,
      decisionAccuracy,
      precision,
      falsePositiveRate,
      blockedActions,
      escalatedCases,
      unresolvedCases,
      averageProcessingTime
    }
  })

  return evaluationRun
}
