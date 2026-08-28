import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const latest = await prisma.evaluationRun.findFirst({
      orderBy: { timestamp: "desc" }
    })
    return NextResponse.json(latest || null)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
