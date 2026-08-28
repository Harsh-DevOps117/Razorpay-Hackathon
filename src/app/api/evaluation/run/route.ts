import { NextResponse } from "next/server"
import { runBatchEvaluation } from "@/lib/evaluation/evaluator"

export async function POST() {
  try {
    const run = await runBatchEvaluation()
    return NextResponse.json(run)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
