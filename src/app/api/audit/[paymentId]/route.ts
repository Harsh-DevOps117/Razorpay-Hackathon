import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    const { paymentId } = await params
    const audits = await prisma.auditLog.findMany({
      where: { paymentId },
      orderBy: { timestamp: "asc" }
    })
    return NextResponse.json(audits)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
