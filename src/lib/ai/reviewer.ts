import OpenAI from "openai"
import { z } from "zod"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const reviewerSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "ESCALATE"]),
  explanation: z.string()
})

export type ReviewerOutput = z.infer<typeof reviewerSchema>

export async function getReviewerDecision(
  paymentContext: any,
  proposedAction: string,
  agentExplanation: string,
  policyResult: any
): Promise<ReviewerOutput> {
  const payload = {
    paymentContext,
    proposedAction,
    agentExplanation,
    policyResult
  }

  const response = await openai.chat.completions.create({
    model: process.env.REVIEWER_MODEL || "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are the Reviewer for an AI Revenue Recovery system. Review the payment context, the proposed action, the agent's explanation, and the deterministic policy result.
Determine if the action is appropriate.
Respond with JSON matching this schema: { decision: "APPROVE" | "REJECT" | "ESCALATE", explanation: string }`
      },
      {
        role: "user",
        content: JSON.stringify(payload)
      }
    ],
    response_format: { type: "json_object" }
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error("No response from model")
  }

  const parsed = JSON.parse(content)
  return reviewerSchema.parse(parsed)
}
