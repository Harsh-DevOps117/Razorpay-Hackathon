"use client"
import { useEffect, useState, use } from "react"
import Link from "next/link"

function formatCurrency(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100)
}

export default function PaymentDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [payment, setPayment] = useState<any>(null)
  const [audits, setAudits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  const fetchData = async () => {
    try {
      const pRes = await fetch(`/api/payments`)
      if (pRes.ok) {
        const payments = await pRes.json()
        const p = payments.find((x: any) => x.id === resolvedParams.id)
        if (p) setPayment(p)
      }
      const aRes = await fetch(`/api/audit/${resolvedParams.id}`)
      if (aRes.ok) {
        setAudits(await aRes.json())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id])

  const handleRunRecovery = async () => {
    setRunning(true)
    try {
      await fetch('/api/recovery/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: resolvedParams.id })
      })
      await fetchData()
    } finally {
      setRunning(false)
    }
  }

  if (loading) return <div className="py-24 text-center text-[#888888] text-[14px]">Loading...</div>
  if (!payment) return <div className="py-24 text-center text-[#ff4d4d] text-[14px]">Payment not found</div>

  return (
    <div className="space-y-12">
      <div>
        <Link href="/" className="inline-block mb-8 text-[14px] font-medium text-[#888888] hover:text-white transition-colors">
          ← Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-[56px] font-medium tracking-[-1.68px] text-[#ffffff] leading-[1.05]">
              Payment Context
            </h1>
            <p className="text-[18px] text-[#a8a8a8] font-medium">
              ID: {payment.id} / Order: {payment.orderId}
            </p>
          </div>
          <button 
            onClick={handleRunRecovery}
            disabled={running || payment.status === "success"}
            className="btn-primary"
          >
            {running ? "Analyzing Context..." : payment.status === "success" ? "Recovered" : "Run AI Agent"}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="bg-[#000000] p-8 rounded-[16px] grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="bg-[#222222] rounded-[12px] p-6 h-[340px] flex flex-col">
            <h3 className="text-[16px] font-semibold text-[#ffffff] mb-6 tracking-[-0.5px]">Payment Core</h3>
            <div className="space-y-5 font-mono text-[13px] text-[#a8a8a8] flex-1 overflow-y-auto">
              <div><span className="text-[#888888]">Status</span><br/><span className={payment.status === 'success' ? 'text-[#33d17a]' : payment.status === 'failed' ? 'text-[#ff4d4d]' : 'text-[#ffffff]'}>{payment.status.toUpperCase()}</span></div>
              <div><span className="text-[#888888]">Amount</span><br/><span className="text-[#ffffff]">{formatCurrency(payment.amount)}</span></div>
              <div><span className="text-[#888888]">Reason</span><br/><span className="text-[#ff4d4d]">{payment.failureReason || "NONE"}</span></div>
              <div><span className="text-[#888888]">Method</span><br/><span className="text-[#ffffff]">{payment.paymentMethod?.toUpperCase()}</span></div>
            </div>
          </div>

          <div className="bg-[#222222] rounded-[12px] p-6 h-[340px] flex flex-col">
            <h3 className="text-[16px] font-semibold text-[#ffffff] mb-6 tracking-[-0.5px]">Risk Profile</h3>
            <div className="space-y-5 font-mono text-[13px] text-[#a8a8a8] flex-1 overflow-y-auto">
              <div><span className="text-[#888888]">Customer ID</span><br/><span className="text-[#ffffff]">{payment.customerId}</span></div>
              <div>
                <span className="text-[#888888]">Risk Score</span><br/>
                <span className={payment.riskScore > 0.8 ? 'text-[#ff4d4d]' : 'text-[#33d17a]'}>{payment.riskScore.toFixed(2)}</span>
              </div>
              <div><span className="text-[#888888]">Total Transactions</span><br/><span className="text-[#ffffff]">{payment.customer.previousTransactions}</span></div>
              <div><span className="text-[#888888]">Historical Success Rate</span><br/><span className="text-[#ffffff]">{(payment.customer.successRate * 100).toFixed(0)}%</span></div>
            </div>
          </div>

          <div className="bg-[#222222] rounded-[12px] p-6 h-[340px] flex flex-col">
            <h3 className="text-[16px] font-semibold text-[#ffffff] mb-6 tracking-[-0.5px]">Policy Engine Limits</h3>
            <div className="space-y-5 font-mono text-[13px] text-[#a8a8a8] flex-1 overflow-y-auto">
              <div><span className="text-[#888888]">Max Recovery Amount</span><br/><span className="text-[#ffffff]">₹10,000</span></div>
              <div><span className="text-[#888888]">Max Risk Score</span><br/><span className="text-[#ffffff]">0.80</span></div>
              <div><span className="text-[#888888]">Max Retries</span><br/><span className="text-[#ffffff]">2</span></div>
              <div className="pt-2 border-t border-[#333333]">
                <span className="text-[#888888]">Current Payment Retries</span><br/><span className="text-[#ffffff]">{payment.retryCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#222222] rounded-[12px] p-6 h-[340px] flex flex-col">
            <h3 className="text-[16px] font-semibold text-[#ffffff] mb-6 tracking-[-0.5px]">Agent Terminal</h3>
            <div className="font-mono text-[13px] text-[#a8a8a8] flex-1 overflow-y-auto bg-[#0f0f0f] p-4 rounded-[8px] border border-[#333333]">
              {audits.length === 0 ? (
                <div className="text-[#666666] italic">Awaiting execution...</div>
              ) : (
                <div className="space-y-4">
                  {audits.map((audit: any, i: number) => (
                    <div key={audit.id} className="space-y-1 pb-4 border-b border-[#222222] last:border-0">
                      <div className="text-[#666666]">[{new Date(audit.timestamp).toLocaleTimeString()}]</div>
                      
                      <div><span className="text-[#7b3aed]">agent.action:</span> <span className="text-[#ffffff]">{audit.agentAction}</span></div>
                      
                      <div className="text-[#888888]">
                        <span className="text-[#7b3aed]">agent.reason:</span> {audit.reason}
                      </div>

                      {audit.policyResult && (
                        <div>
                          <span className="text-[#00d4ff]">policy.result:</span> 
                          <span className={audit.policyResult === 'ALLOWED' ? 'text-[#33d17a]' : 'text-[#ff4d4d]'}> {audit.policyResult}</span>
                        </div>
                      )}
                      
                      {audit.reviewerDecision && audit.reviewerDecision !== "NOT_REQUIRED" && (
                        <div>
                          <span className="text-[#00d4ff]">reviewer.decision:</span> <span className="text-[#ffffff]">{audit.reviewerDecision}</span>
                        </div>
                      )}

                      {audit.toolCalled && (
                        <div className="mt-2 text-[#ffffff]">
                          <span className="text-[#33d17a]">➜</span> {audit.toolCalled}()
                          <div className="mt-1 pl-4 text-[#666666] whitespace-pre-wrap">{audit.toolResult}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {audits.length > 0 && (
        <div className="bg-[#181818] border border-[#222222] rounded-[16px] p-8 mt-8">
          <h2 className="text-[18px] font-medium tracking-[-0.5px] text-[#ffffff] mb-8">RECOVERY RESULT</h2>
          {audits.map((audit: any, i: number) => {
            if (i !== audits.length - 1) return null
            return (
              <div key="result" className="grid grid-cols-2 md:grid-cols-6 gap-6 font-mono text-[13px]">
                <div>
                  <span className="text-[#888888] block mb-2">Payment</span>
                  <span className={audit.paymentStatus === 'success' ? 'text-[#33d17a]' : 'text-[#ff4d4d]'}>{audit.paymentStatus?.toUpperCase() || payment.status.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-[#888888] block mb-2">Agent Action</span>
                  <span className="text-[#ffffff]">{audit.agentAction}</span>
                </div>
                <div>
                  <span className="text-[#888888] block mb-2">Policy</span>
                  <span className={audit.policyResult === 'ALLOWED' ? 'text-[#33d17a]' : 'text-[#ff4d4d]'}>{audit.policyResult}</span>
                </div>
                <div>
                  <span className="text-[#888888] block mb-2">Tool Execution</span>
                  <span className={audit.toolSuccess ? 'text-[#33d17a]' : 'text-[#ff4d4d]'}>{audit.toolSuccess ? "SUCCESS" : audit.toolSuccess === false ? "FAILED" : "N/A"}</span>
                </div>
                <div>
                  <span className="text-[#888888] block mb-2">Final Outcome</span>
                  <span className="text-[#00d4ff]">{audit.recoveryStatus}</span>
                </div>
                <div>
                  <span className="text-[#888888] block mb-2">Revenue Recovered</span>
                  <span className="text-[#ffffff]">{formatCurrency(audit.revenueRecovered)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
