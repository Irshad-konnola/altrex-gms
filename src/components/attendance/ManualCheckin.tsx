// src/components/attendance/ManualCheckin.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus, Search, CheckCircle2, User } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

type MemberResult = {
  id: string
  full_name: string
  phone: string
  status: string
}

export function ManualCheckin() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<MemberResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [checkingInId, setCheckingInId] = useState<string | null>(null)
  
  const supabase = createClient()

  // Real-time debounce search
  useEffect(() => {
    const fetchMembers = async () => {
      if (search.length < 2) {
        setResults([])
        return
      }
      
      setIsSearching(true)
      
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, phone, status')
        // ILIKE performs a case-insensitive search on name or phone
        .or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
        .limit(5)
        
      if (!error && data) {
        setResults(data as MemberResult[])
      }
      
      setIsSearching(false)
    }

    const timeoutId = setTimeout(fetchMembers, 300) // wait 300ms after user stops typing
    return () => clearTimeout(timeoutId)
  }, [search, supabase])

  const handleCheckIn = async (memberId: string, memberName: string) => {
    setCheckingInId(memberId)
    
    try {
      const response = await fetch(`/api/members/${memberId}/checkin`, {
        method: 'POST',
      })
      
      if (!response.ok) throw new Error("Failed to check in")
      
      toast.success(`${memberName} checked in manually!`)
      
      // Reset state and close modal
      setSearch("")
      setResults([])
      setIsOpen(false)
      
    } catch (error) {
      console.error(error)
      toast.error("Failed to process manual check-in")
    } finally {
      setCheckingInId(null)
    }
  }

  // Handle modal open/close cleanup
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setSearch("")
      setResults([])
    }
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-gold-500 text-dark-900 hover:bg-gold-600 font-semibold gap-2 shadow-md shadow-gold-500/10"
      >
        <Plus className="w-4 h-4" />
        Manual Check-in
      </Button>
      
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-dark-800 border-dark-600 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Manual Check-in</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <Input 
                placeholder="Search by name or phone..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-dark-900 border-dark-600 focus:border-gold-500 text-white placeholder:text-dark-400"
                autoFocus
              />
            </div>
            
            <div className="min-h-[200px] border border-dark-600 rounded-lg bg-dark-900/50 p-2 overflow-y-auto">
              {search.length < 2 ? (
                <div className="h-full flex items-center justify-center text-dark-400 text-sm">
                  Type at least 2 characters to search
                </div>
              ) : isSearching ? (
                <div className="h-full flex items-center justify-center text-dark-400 text-sm">
                  Searching...
                </div>
              ) : results.length === 0 ? (
                <div className="h-full flex items-center justify-center text-dark-400 text-sm">
                  No members found
                </div>
              ) : (
                <div className="space-y-2">
                  {results.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-3 rounded-md bg-dark-800 border border-dark-700 hover:border-dark-500 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center border border-dark-600 shrink-0">
                          <User className="w-4 h-4 text-dark-300" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white line-clamp-1">{member.full_name}</span>
                          <span className="text-xs text-dark-400">{member.phone}</span>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(member.id, member.full_name)}
                        disabled={checkingInId === member.id}
                        className="bg-dark-700 hover:bg-gold-500 hover:text-dark-900 text-white border border-dark-600 shrink-0 h-8 px-3"
                      >
                        {checkingInId === member.id ? (
                          "Logging..."
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Log
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}