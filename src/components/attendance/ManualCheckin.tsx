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
      setIsSearching(true)
      
      let query = supabase.from('members').select('id, full_name, phone, status').eq('status', 'active')
      
      if (search.length > 0) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`).limit(10)
      } else {
        query = query.limit(100).order('full_name', { ascending: true })
      }
        
      const { data, error } = await query
        
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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to check in")
      }
      
      toast.success(`${memberName} checked in manually!`)
      
      // Reset state and close modal
      setSearch("")
      setIsOpen(false)
      
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to process manual check-in")
    } finally {
      setCheckingInId(null)
    }
  }

  // Handle modal open/close cleanup
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setSearch("")
    }
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2 shadow-md shadow-gold-500/10"
      >
        <Plus className="w-4 h-4" />
        Manual Check-in
      </Button>
      
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-muted border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Manual Check-in</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or phone..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card border-border focus:border-gold-500 text-foreground placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
            
            <div className="min-h-[200px] max-h-[350px] border border-border rounded-lg bg-card/50 p-2 overflow-y-auto">
              {isSearching ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm py-10">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                  Searching...
                </div>
              ) : results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm py-10">
                  <Search className="w-8 h-8 opacity-20 mb-2" />
                  No members found.
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors border border-transparent hover:border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground leading-none">{member.full_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{member.phone}</p>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-card hover:bg-gold-500 hover:text-dark-900 transition-colors h-8"
                        disabled={checkingInId === member.id || member.status !== 'active'}
                        onClick={() => handleCheckIn(member.id, member.full_name)}
                      >
                        {checkingInId === member.id ? (
                          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
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