import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { runRecoveryAgent } from "@/lib/agent/orchestrator"

export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json()
    if (!paymentId) return NextResponse.json({ error: "Missing paymentId" }, { status: 400 })

    const result = await runRecoveryAgent(paymentId)
    revalidatePath('/')
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
