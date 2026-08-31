// src/app/(dashboard)/whatsapp/page.tsx
"use client"

import { useState, useEffect } from "react"
import { WALog } from "@/components/whatsapp/WALog"
import { MessageCircle, Zap, ShieldCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Dependency-free custom toggle switch perfectly themed for Altrex
const CustomToggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900 ${
      checked ? 'bg-gold-500' : 'bg-muted'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
)

export default function WhatsAppPage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  // Fetch rules from the database on load
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await fetch('/api/settings/whatsapp-rules')
        const data = await res.json()
        setToggles(data)
      } catch  {
        toast.error("Failed to load automation rules")
      } finally {
        setLoading(false)
      }
    }
    fetchRules()
  }, [])

  const handleToggle = async (key: string) => {
    const newToggles = { ...toggles, [key]: !toggles[key] }
    
    // Optimistic UI update
    setToggles(newToggles)
    
    try {
      const res = await fetch('/api/settings/whatsapp-rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newToggles)
      })
      
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Automation rule updated")
      
    } catch{
      // Revert UI on failure
      setToggles({ ...toggles })
      toast.error("Failed to save changes")
    }
  }

  // 🌟 FIX: Updated keys to perfectly match the Meta Template names
  const automationRules = [
    { key: 'altrex_renewal_7d', label: 'Renewal Reminder (7 Days)', category: 'Utility', timing: '7 days before expiry' },
    { key: 'altrex_renewal_3d', label: 'Renewal Reminder (3 Days)', category: 'Utility', timing: '3 days before expiry' },
    { key: 'altrex_renewal_today', label: 'Renewal Reminder (Today)', category: 'Utility', timing: 'On expiry day' },
    { key: 'altrex_inactivity_3d', label: 'Inactivity Alert (3 Days)', category: 'Marketing', timing: 'After 3 days of no visits' },
    { key: 'altrex_inactivity_7d', label: 'Inactivity Alert (7 Days)', category: 'Marketing', timing: 'After 7 days of no visits' },
    { key: 'altrex_welcome', label: 'Welcome Message', category: 'Utility', timing: 'On new registration' },
    { key: 'payment_receipt', label: 'Payment Receipts', category: 'Utility', timing: 'On payment record' },
    { key: 'altrex_pt_assigned', label: 'PT Assigned Alert', category: 'Utility', timing: 'On PT assignment' },
    { key: 'altrex_pt_feedback', label: 'PT Session Feedback', category: 'Utility', timing: 'After PT check-in' },
    { key: 'altrex_owner_daily_summary', label: 'Owner Daily Summary', category: 'Utility', timing: '9:30 PM Daily' },
    { key: 'altrex_birthday', label: 'Birthday Greeting', category: 'Marketing', timing: 'On member birthday' },
  ] as const

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-green-500" />
            WhatsApp Automations
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage bots, message rules, and view chat logs.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted border border-border px-4 py-2 rounded-lg">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-foreground">Meta API Connected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Automation Rules */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-muted border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-card/50 flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold-500" />
              <h2 className="font-semibold text-foreground">Active Rules</h2>
            </div>
            {/* 🌟 FIX: Added height and scroll behavior here to handle the longer list */}
            <div className="divide-y divide-dark-600/50 h-[600px] overflow-y-auto no-scrollbar">
              {loading ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 text-gold-500 animate-spin" /></div>
              ) : (
                automationRules.map((rule) => (
                  <div key={rule.key} className="p-4 flex items-center justify-between hover:bg-card/30 transition-colors">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">{rule.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{rule.timing}</p>
                      <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-bold bg-card text-muted-foreground px-2 py-0.5 rounded-full">
                        {rule.category}
                      </span>
                    </div>
                    <CustomToggle 
                      checked={toggles[rule.key] || false} 
                      onChange={() => handleToggle(rule.key)} 
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Message Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-muted border border-border rounded-xl overflow-hidden shadow-sm flex flex-col h-[650px]">
            <div className="p-4 border-b border-border bg-card/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gold-500" />
                <h2 className="font-semibold text-foreground">Recent Messages</h2>
              </div>
              <span className="text-xs text-muted-foreground font-medium bg-card px-2 py-1 rounded-md">
                Last 50
              </span>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <WALog />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}