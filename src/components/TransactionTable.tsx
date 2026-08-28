"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

function formatCurrency(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100)
}

function StatusBadge({ status }: { status: string }) {
  if (status === "success") return <span className="bg-[#181818] border border-[#33d17a]/30 text-[#33d17a] px-[10px] py-[4px] rounded-full text-[11px] font-semibold tracking-[0.88px] uppercase">Success</span>
  if (status === "failed") return <span className="bg-[#181818] border border-[#ff4d4d]/30 text-[#ff4d4d] px-[10px] py-[4px] rounded-full text-[11px] font-semibold tracking-[0.88px] uppercase">Failed</span>
  if (status === "escalated") return <span className="bg-[#181818] border border-[#00d4ff]/30 text-[#00d4ff] px-[10px] py-[4px] rounded-full text-[11px] font-semibold tracking-[0.88px] uppercase">Escalated</span>
  return <span className="bg-[#181818] border border-[#333333] text-[#888888] px-[10px] py-[4px] rounded-full text-[11px] font-semibold tracking-[0.88px] uppercase">{status}</span>
}

export function TransactionTable({ payments }: { payments: any[] }) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(payments.length / itemsPerPage)
  
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentPayments = payments.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div id="transactions" className="surface-card p-7">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[24px] font-medium tracking-[-0.5px] text-white">Recent Transactions</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="text-[13px] font-medium px-3 py-1.5 rounded-[6px] bg-[#222222] text-[#ffffff] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a2a2a] transition-colors border border-[#333333]"
          >
            Prev
          </button>
          <span className="text-[13px] font-medium text-[#888888]">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="text-[13px] font-medium px-3 py-1.5 rounded-[6px] bg-[#222222] text-[#ffffff] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a2a2a] transition-colors border border-[#333333]"
          >
            Next
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[14px] text-left">
          <thead className="text-[11px] font-semibold tracking-[0.88px] uppercase text-[#888888] border-b border-[#222222]">
            <tr>
              <th className="pb-4 pr-6 font-semibold">Payment ID</th>
              <th className="pb-4 px-6 font-semibold">Amount</th>
              <th className="pb-4 px-6 font-semibold">Status</th>
              <th className="pb-4 px-6 font-semibold">Reason</th>
              <th className="pb-4 px-6 font-semibold">Risk</th>
              <th className="pb-4 pl-6 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222222]">
            {currentPayments.map((payment: any) => (
              <tr 
                key={payment.id} 
                onClick={() => router.push(`/payment/${payment.id}`)}
                className="group hover:bg-[#222222]/30 transition-colors cursor-pointer"
              >
                <td className="py-4 pr-6 font-mono text-[13px] text-[#888888]">{payment.id}</td>
                <td className="py-4 px-6 text-white font-medium">{formatCurrency(payment.amount)}</td>
                <td className="py-4 px-6"><StatusBadge status={payment.status} /></td>
                <td className="py-4 px-6 text-[#a8a8a8]">{payment.status === "success" ? "-" : (payment.failureReason || "-")}</td>
                <td className="py-4 px-6 font-mono text-[13px] text-[#888888]">
                  {payment.riskScore.toFixed(2)}
                </td>
                <td className="py-4 pl-6 text-right">
                  <span className="text-[#a8a8a8] group-hover:text-[#00d4ff] font-medium transition-colors text-[14px]">
                    Inspect →
                  </span>
                </td>
              </tr>
            ))}
            {currentPayments.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#888888] text-[13px]">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
