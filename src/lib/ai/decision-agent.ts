import OpenAI from "openai"
import { z } from "zod"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const decisionSchema = z.object({
  action: z.enum(["RETRY_PAYMENT", "CREATE_PAYMENT_LINK", "SEND_NOTIFICATION", "ESCALATE", "DO_NOTHING"]),
  explanation: z.string(),
  confidence: z.number().min(0).max(1)
})

export type DecisionOutput = z.infer<typeof decisionSchema>

export async function getAgentDecision(paymentContext: any): Promise<DecisionOutput> {
  const response = await openai.chat.completions.create({
    model: process.env.DECISION_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an AI Revenue Recovery Agent. Analyze the payment context and determine the best recovery action.
CRITICAL POLICY CONSTRAINTS (YOU MUST NOT VIOLATE THESE):
You will receive 'policy_constraints' in the context.
1. If amount > max_recovery_amount, you MUST NOT propose RETRY_PAYMENT.
2. If risk_score >= max_risk_score, you MUST NOT propose RETRY_PAYMENT.
3. If retry_count >= max_retries, you MUST NOT propose RETRY_PAYMENT.
If a payment violates any of the above for a retry, you MUST choose an alternative like CREATE_PAYMENT_LINK, SEND_NOTIFICATION, or ESCALATE.
If no safe recovery action exists, return ESCALATE.
Do not attempt to circumvent these limits. You must reason about eligibility before proposing an action.
Possible actions: RETRY_PAYMENT, CREATE_PAYMENT_LINK, SEND_NOTIFICATION, ESCALATE, DO_NOTHING.
Respond with JSON matching the following schema: { action: string, explanation: string, confidence: number }`
      },
      {
        role: "user",
        content: JSON.stringify(paymentContext)
      }
    ],
    response_format: { type: "json_object" }
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error("No response from model")
  }

  const parsed = JSON.parse(content)
  return decisionSchema.parse(parsed)
}
