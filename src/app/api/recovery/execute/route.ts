import { NextResponse } from "next/server"
import { runRecoveryAgent } from "@/lib/agent/orchestrator"

export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json()
    if (!paymentId) return NextResponse.json({ error: "Missing paymentId" }, { status: 400 })

    const result = await runRecoveryAgent(paymentId)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
