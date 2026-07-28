// src/components/pt/PTTab.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AssignPT } from "./AssignPT"
import { Dumbbell, Calendar, CheckCircle2, AlertCircle, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type PTAssignment = {
  id: string
  trainer_name: string
  start_date: string
  end_date: string
  sessions_total: number
  sessions_remaining: number
  sessions_used: number
  status: string
  pt_packages: {
    name: string
  }
}

export function PTTab({ memberId }: { memberId: string }) {
  const [assignment, setAssignment] = useState<PTAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLogging, setIsLogging] = useState(false)
  const supabase = createClient()

  const fetchPTData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('pt_assignments')
      .select(`
        *,
        pt_packages ( name )
      `)
      .eq('member_id', memberId)
      .eq('status', 'active')
      .single()

    if (!error && data) {
      setAssignment(data as PTAssignment)
    } else {
      setAssignment(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPTData()
  }, [memberId])

  const handleLogSession = async () => {
    if (!assignment) return
    
    setIsLogging(true)
    try {
      const res = await fetch('/api/pt/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: assignment.id })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to log session")

      toast.success("Session logged successfully!")
      
      if (data.status === 'completed') {
        toast.info("This PT package is now fully completed!")
      }
      
      fetchPTData() // Refresh UI instantly
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLogging(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 bg-dark-800 border border-dark-600 rounded-xl">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-gold-500" />
          Personal Training
        </h2>
        {!assignment && (
          <AssignPT memberId={memberId} onAssigned={fetchPTData} />
        )}
      </div>

      {assignment ? (
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-6 border-b border-dark-600/50 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                {assignment.pt_packages?.name || "Custom Package"}
              </h3>
              <p className="text-sm text-dark-300">Trainer: <span className="text-white font-medium">{assignment.trainer_name}</span></p>
            </div>
            <span className="bg-gold-500/20 text-gold-400 border border-gold-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
              Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-dark-900/50 border border-dark-700 rounded-lg p-4 flex flex-col items-center justify-center text-center">
              <span className="text-dark-400 text-xs font-medium uppercase tracking-wider mb-1">Total</span>
              <span className="text-2xl font-bold text-white">{assignment.sessions_total}</span>
            </div>
            
            <div className="bg-dark-900/50 border border-dark-700 rounded-lg p-4 flex flex-col items-center justify-center text-center">
              <span className="text-dark-400 text-xs font-medium uppercase tracking-wider mb-1">Used</span>
              <span className="text-2xl font-bold text-white">{assignment.sessions_used}</span>
            </div>
            
            {/* Actionable Remaining Sessions Box */}
            <div className="bg-dark-900/50 border border-gold-500/50 rounded-lg p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gold-500" />
              <span className="text-gold-500 text-xs font-medium uppercase tracking-wider mb-1">Remaining</span>
              <span className="text-4xl font-bold text-white mb-3">{assignment.sessions_remaining}</span>
              
              <Button 
                onClick={handleLogSession} 
                disabled={isLogging || assignment.sessions_remaining <= 0}
                size="sm" 
                className="w-full bg-gold-500 hover:bg-gold-600 text-dark-900 font-bold shadow-md"
              >
                {isLogging ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Log Session
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-dark-300 bg-dark-900/30 p-3 rounded-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Started: {new Date(assignment.start_date).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              Expires: {new Date(assignment.end_date).toLocaleDateString()}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-12 text-center shadow-sm">
          <Dumbbell className="w-12 h-12 text-dark-400 mx-auto mb-3 opacity-20" />
          <h3 className="text-lg font-medium text-white mb-1">No Active PT</h3>
          <p className="text-dark-400 text-sm">This member does not have an active personal training package.</p>
        </div>
      )}
    </div>
  )
}