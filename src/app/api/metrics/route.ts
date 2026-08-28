import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const totalPayments = await prisma.payment.count()
    const failedPayments = await prisma.payment.count({ where: { status: { not: "success" } } })
    const successfulPayments = await prisma.payment.count({ where: { status: "success" } })
    
    const revenueData = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "failed", recoverable: true }
    })
    
    const recoveredData = await prisma.auditLog.aggregate({
      _sum: { revenueRecovered: true }
    })

    return NextResponse.json({
      totalPayments,
      failedPayments,
      successfulPayments,
      revenueAtRisk: revenueData._sum.amount || 0,
      revenueRecovered: recoveredData._sum.revenueRecovered || 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
