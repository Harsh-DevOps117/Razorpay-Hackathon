"use client"
import { useEffect, useState } from "react"

function formatCurrency(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100)
}

function formatPct(val: number) {
  return `${(val * 100).toFixed(1)}%`
}

export default function EvaluationPage() {
  const [run, setRun] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  const fetchLatest = async () => {
    try {
      const res = await fetch('/api/evaluation/latest')
      if (res.ok) setRun(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLatest()
  }, [])

  const handleRunEvaluation = async () => {
    setRunning(true)
    try {
      const res = await fetch('/api/evaluation/run', { method: 'POST' })
      if (res.ok) {
        setRun(await res.json())
      }
    } finally {
      setRunning(false)
    }
  }

  if (loading) return <div className="py-24 text-center text-[#888888] text-[14px]">Loading...</div>

  return (
    <div className="space-y-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-[600px]">
          <h1 className="text-[44px] font-medium tracking-[-1.32px] text-white">Batch Evaluation</h1>
          <p className="text-[16px] text-[#a8a8a8] mt-2">Execute orchestrator across 500 records to prove deterministic safety and recovery throughput.</p>
        </div>
        <button 
          onClick={handleRunEvaluation}
          disabled={running}
          className="btn-primary"
        >
          {running ? "Processing Batch..." : "Run Batch Evaluation"}
        </button>
      </div>

      {!run && !running && (
        <div className="surface-card py-24 text-center">
          <p className="text-[16px] text-[#888888]">No evaluation run found.</p>
        </div>
      )}

      {run && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="surface-card p-7">
              <p className="text-[13px] font-semibold tracking-[0.88px] uppercase text-[#888888] mb-2">Processed</p>
              <p className="text-[32px] font-medium tracking-[-0.96px] text-white">{run.transactionsProcessed}</p>
            </div>
            <div className="surface-card p-7">
              <p className="text-[13px] font-semibold tracking-[0.88px] uppercase text-[#888888] mb-2">Revenue at Risk</p>
              <p className="text-[32px] font-medium tracking-[-0.96px] text-white">{formatCurrency(run.revenueAtRisk)}</p>
            </div>
            <div className="surface-card p-7">
              <p className="text-[13px] font-semibold tracking-[0.88px] uppercase text-[#00d4ff] mb-2">Recovered</p>
              <p className="text-[32px] font-medium tracking-[-0.96px] text-white">{formatCurrency(run.revenueRecovered)}</p>
            </div>
            <div className="surface-card p-7">
              <p className="text-[13px] font-semibold tracking-[0.88px] uppercase text-[#888888] mb-2">Recovery Rate</p>
              <div className="flex items-baseline gap-2">
                <p className="text-[32px] font-medium tracking-[-0.96px] text-[#33d17a]">{formatPct(run.recoveryRate)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="surface-elevated p-8">
              <h3 className="text-[18px] font-medium tracking-[-0.5px] text-white mb-6">AI Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-[#222222]">
                  <span className="text-[14px] text-[#a8a8a8]">Decision Accuracy</span>
                  <span className="text-[16px] font-medium text-white">{formatPct(run.decisionAccuracy)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#222222]">
                  <span className="text-[14px] text-[#a8a8a8]">Precision</span>
                  <span className="text-[16px] font-medium text-white">{formatPct(run.precision)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[14px] text-[#a8a8a8]">Avg Processing Time</span>
                  <span className="text-[16px] font-medium text-white">{(run.averageProcessingTime / 1000).toFixed(2)}s</span>
                </div>
              </div>
            </div>

            <div className="surface-elevated p-8">
              <h3 className="text-[18px] font-medium tracking-[-0.5px] text-white mb-6">Safety & Exceptions</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-[#222222]">
                  <span className="text-[14px] text-[#a8a8a8]">Blocked Unsafe Actions</span>
                  <span className="text-[16px] font-medium text-[#ff4d4d]">{run.blockedActions}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#222222]">
                  <span className="text-[14px] text-[#a8a8a8]">Escalated Cases</span>
                  <span className="text-[16px] font-medium text-[#00d4ff]">{run.escalatedCases}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#222222]">
                  <span className="text-[14px] text-[#a8a8a8]">Unresolved Exceptions</span>
                  <span className="text-[16px] font-medium text-[#ff4d4d]">{run.unresolvedCases}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[14px] text-[#a8a8a8]">False Positive Rate</span>
                  <span className="text-[16px] font-medium text-white">{formatPct(run.falsePositiveRate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
