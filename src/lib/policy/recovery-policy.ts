import { Payment } from "@prisma/client"

export type PolicyResult = {
  allowed: boolean
  reason: string
  action: string
}

export const MAX_RECOVERY_AMOUNT = 1000000
export const MAX_RISK_SCORE = 0.80
export const MAX_RETRIES = 2

export function evaluatePolicy(
  payment: Payment,
  proposedAction: string,
  modelConfidence: number
): PolicyResult {
  if (payment.status === "success" && proposedAction !== "DO_NOTHING") {
    return { allowed: false, reason: "Payment already successful", action: "BLOCKED" }
  }

  if (modelConfidence < 0.6) {
    return { allowed: false, reason: "Model confidence too low", action: "ESCALATE" }
  }

  if (proposedAction === "RETRY_PAYMENT") {
    if (payment.riskScore >= MAX_RISK_SCORE) {
      return { allowed: false, reason: "High risk score", action: "BLOCKED" }
    }

    if (payment.amount > MAX_RECOVERY_AMOUNT) {
      return { allowed: false, reason: "Amount exceeds automatic recovery limit", action: "BLOCKED" }
    }

    if (payment.retryCount >= MAX_RETRIES) {
      return { allowed: false, reason: "Maximum retry limit exceeded", action: "BLOCKED" }
    }
  }

  return { allowed: true, reason: "Policy rules passed", action: "ALLOWED" }
}
