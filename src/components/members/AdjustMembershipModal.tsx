"use client"

import { useState } from "react"
import { CalendarClock, Loader2, ArrowRight } from "lucide-react"
import { addDays, format, parseISO } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

interface AdjustMembershipModalProps {
  memberId: string
  currentEndDate: string
}

export function AdjustMembershipModal({ memberId, currentEndDate }: AdjustMembershipModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [daysToAdd, setDaysToAdd] = useState<number | "">("")
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate new date dynamically as the admin types
  const newEndDate = daysToAdd 
    ? format(addDays(parseISO(currentEndDate), Number(daysToAdd)), "yyyy-MM-dd")
    : currentEndDate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!daysToAdd) return

    setIsSubmitting(true)
    
    // TODO: Supabase Update Logic
    console.log("Extending membership:", { memberId, daysToAdd, reason, newEndDate })
    
    // Fake API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast.success(`Membership extended by ${daysToAdd} days!`)
    setIsSubmitting(false)
    setIsOpen(false)
    setDaysToAdd("")
    setReason("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* FIXED: Removed asChild and nested <Button>. Applied styles directly to DialogTrigger. */}
      <DialogTrigger className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium border border-dark-700 text-white hover:bg-dark-800 hover:text-gold-500 w-full sm:w-auto rounded-xl transition-colors">
        <CalendarClock className="w-4 h-4 mr-2" />
        Extend Plan
      </DialogTrigger>
      
      <DialogContent className="bg-dark-950 border border-dark-800 text-white sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Adjust Membership</DialogTitle>
          <DialogDescription className="text-dark-400">
Extend this member&apos;s plan due to vacation, medical reasons, or gym closure.          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          
          {/* Status Display */}
          <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-dark-400 uppercase tracking-wider font-medium mb-1">Current Expiry</span>
              <span className="font-semibold text-white">{currentEndDate}</span>
            </div>
            <ArrowRight className="w-5 h-5 text-dark-500" />
            <div className="flex flex-col text-right">
              <span className="text-xs text-dark-400 uppercase tracking-wider font-medium mb-1">New Expiry</span>
              <span className="font-bold text-gold-500">{newEndDate}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200">Days to Add</label>
              <Input 
                type="number" 
                min="1"
                placeholder="e.g. 20" 
                value={daysToAdd}
                onChange={(e) => setDaysToAdd(e.target.value ? parseInt(e.target.value) : "")}
                className="bg-dark-900 border-dark-700 text-white rounded-xl h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200">Reason (Optional)</label>
              <Input 
                type="text" 
                placeholder="e.g. Medical leave, Vacation" 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-dark-900 border-dark-700 text-white rounded-xl h-11"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-dark-800">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsOpen(false)}
              className="text-dark-300 hover:text-white rounded-xl"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!daysToAdd || isSubmitting}
              className="bg-gold-500 hover:bg-gold-600 text-dark-950 font-bold rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.2)]"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Extension"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}