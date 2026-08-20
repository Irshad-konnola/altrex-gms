// src/app/(dashboard)/pt/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dumbbell, Users, Settings, User, Search, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

type ActivePTMember = {
  id: string
  trainer_name: string
  sessions_total: number
  sessions_remaining: number
  sessions_used: number
  end_date: string
  members: {
    id: string
    full_name: string
    phone: string
    photo_url: string | null
  }
  pt_packages: {
    name: string
  }
}

export default function PTDashboardPage() {
  const [ptMembers, setPtMembers] = useState<ActivePTMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 15

  useEffect(() => {
    const fetchActivePT = async () => {
      try {
        const res = await fetch('/api/pt/active')
        if (res.ok) {
          const data = await res.json()
          setPtMembers(data)
        }
      } catch  {
        console.error("Failed to load active PT members")
      } finally {
        setLoading(false)
      }
    }
    fetchActivePT()
  }, [])

  const filteredMembers = ptMembers.filter(record => 
    record.members?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.trainer_name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const paginatedMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-gold-500" />
            Personal Training
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage active PT clients and trainer assignments.</p>
        </div>
        
        <Link href="/pt/packages">
          <Button className="bg-muted text-foreground hover:bg-card border border-border font-semibold gap-2">
            <Settings className="w-4 h-4 text-gold-500" />
            Manage Packages
          </Button>
        </Link>
      </div>

      {/* Main Dashboard UI */}
      <div className="bg-muted border border-border rounded-xl overflow-hidden shadow-sm">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-card/50 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search member or trainer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background border-border focus:border-gold-500 text-foreground w-full"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-background px-4 py-2 rounded-lg border border-border">
            <Dumbbell className="w-4 h-4 text-gold-500" />
            Total Active PT: <span className="text-foreground">{ptMembers.length}</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-card/80 text-muted-foreground uppercase tracking-wider font-medium text-xs border-b border-border">
              <tr>
                <th className="p-4">Member</th>
                <th className="p-4">Package</th>
                <th className="p-4">Trainer</th>
                <th className="p-4 text-center">Remaining</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground animate-pulse">
                    Loading PT data...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Dumbbell className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                    <h3 className="text-foreground font-medium mb-1">No Active Clients found</h3>
                    <p className="text-muted-foreground text-sm">Assign packages to members via their profile.</p>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((record) => (
                  <tr key={record.id} className="hover:bg-card/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center overflow-hidden border border-border">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{record.members?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{record.members?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-foreground">{record.pt_packages?.name || 'Custom'}</span>
                    </td>
                    <td className="p-4">
                      <span className="bg-card border border-border px-2 py-1 rounded text-foreground font-medium">
                        {record.trainer_name}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {record.sessions_remaining <= 3 && (
                          <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                        )}
                        <span className={`font-bold text-lg ${record.sessions_remaining <= 3 ? 'text-red-400' : 'text-gold-500'}`}>
                          {record.sessions_remaining}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">/ {record.sessions_total}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/members/${record.members?.id}`}>
                        <Button variant="outline" size="sm" className="font-medium hover:bg-gold-500 hover:text-dark-900 border-border">
                          View Member
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {filteredMembers.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-border mt-2 bg-background rounded-b-xl">
            <div className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{page}</span> of <span className="font-medium text-foreground">{Math.ceil(filteredMembers.length / pageSize)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(filteredMembers.length / pageSize)} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}