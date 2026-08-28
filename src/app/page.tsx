import Link from "next/link"
import { TransactionTable } from "@/components/TransactionTable"
import { prisma } from "@/lib/db/prisma"

export const dynamic = 'force-dynamic'

async function getMetrics() {
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

    return {
      totalPayments,
      failedPayments,
      successfulPayments,
      revenueAtRisk: revenueData._sum.amount || 0,
      revenueRecovered: recoveredData._sum.revenueRecovered || 0
    }
  } catch (error: any) {
    console.error("Failed to fetch metrics:", error)
    return { error: error.message || String(error) }
  }
}

async function getPayments() {
  try {
    return await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { 
        customer: true,
        auditLogs: { orderBy: { timestamp: 'desc' }, take: 1 }
      }
    })
  } catch (error) {
    console.error("Failed to fetch payments:", error)
    return []
  }
}

function formatCurrency(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100)
}

export default async function Dashboard() {
  const metrics = await getMetrics()
  const payments = await getPayments()

  if (metrics && 'error' in metrics) {
    return (
      <div className="p-12 max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-red-500">Database Connection Failed</h2>
        <p className="text-[#a8a8a8]">Vercel is unable to connect to Supabase. This is usually caused by Supabase's IPv4 deprecation or an incorrect connection string.</p>
        <div className="bg-[#111111] p-6 rounded-lg border border-red-500/30 text-red-400 font-mono text-sm whitespace-pre-wrap">
          {metrics.error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-24">
      <div className="text-center max-w-[800px] mx-auto space-y-6">
        <h1 className="text-[56px] leading-[1.05] tracking-[-1.68px] text-white font-medium">
          Revenue Recovery Agent
        </h1>
        <p className="text-[18px] text-[#a8a8a8] font-normal leading-[1.5]">
          Detects abandoned payments, evaluates deterministic policies, and executes safe recovery actions at scale.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href="/evaluation" className="btn-primary">
            Run Batch Evaluation
          </Link>
          <a href="#transactions" className="bg-[#222222] text-white font-medium text-[14px] px-[18px] py-[10px] h-[40px] rounded-[8px] hover:bg-[#2a2a2a] transition-colors inline-flex items-center justify-center">
            View Transactions
          </a>
        </div>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-[#111111] border border-[#222222] rounded-[16px] p-8 flex flex-col justify-between group hover:border-[#444444] transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff4d4d] opacity-[0.03] blur-2xl group-hover:opacity-[0.06] transition-opacity pointer-events-none"></div>
            <p className="text-[12px] font-semibold tracking-[1px] uppercase text-[#888888] mb-12 relative z-10">Revenue at Risk</p>
            <p className="text-[40px] font-medium tracking-[-1.2px] text-white leading-none relative z-10">
              {metrics ? formatCurrency(metrics.revenueAtRisk) : "₹0"}
            </p>
          </div>

          <div className="bg-[#111111] border border-[#222222] rounded-[16px] p-8 flex flex-col justify-between group hover:border-[#0007cd] transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0007cd] opacity-[0.1] blur-2xl group-hover:opacity-[0.2] transition-opacity pointer-events-none"></div>
            <p className="text-[12px] font-semibold tracking-[1px] uppercase text-[#00d4ff] mb-12 relative z-10">Revenue Recovered</p>
            <p className="text-[40px] font-medium tracking-[-1.2px] text-white leading-none relative z-10">
              {metrics ? formatCurrency(metrics.revenueRecovered) : "₹0"}
            </p>
          </div>

          <div className="bg-[#111111] border border-[#222222] rounded-[16px] p-8 flex flex-col justify-between group hover:border-[#444444] transition-colors relative overflow-hidden">
            <p className="text-[12px] font-semibold tracking-[1px] uppercase text-[#888888] mb-12 relative z-10">Failed Transactions</p>
            <p className="text-[40px] font-medium tracking-[-1.2px] text-white leading-none relative z-10">
              {metrics?.failedPayments || 0}
            </p>
          </div>

          <div className="bg-[#111111] border border-[#222222] rounded-[16px] p-8 flex flex-col justify-between group hover:border-[#33d17a]/50 transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#33d17a] opacity-[0.03] blur-2xl group-hover:opacity-[0.08] transition-opacity pointer-events-none"></div>
            <p className="text-[12px] font-semibold tracking-[1px] uppercase text-[#33d17a] mb-12 relative z-10">Successful Recoveries</p>
            <p className="text-[40px] font-medium tracking-[-1.2px] text-white leading-none relative z-10">
              {metrics?.successfulPayments || 0}
            </p>
          </div>

        </div>
      </div>

      <TransactionTable payments={payments} />
    </div>
  )
}
