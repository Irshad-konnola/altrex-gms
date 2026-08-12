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

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-gold-500" />
            Personal Training
          </h1>
          <p className="text-dark-300 text-sm mt-1">Manage active PT clients and trainer assignments.</p>
        </div>
        
        <Link href="/pt/packages">
          <Button className="bg-dark-800 text-white hover:bg-dark-700 border border-dark-600 font-semibold gap-2">
            <Settings className="w-4 h-4 text-gold-500" />
            Manage Packages
          </Button>
        </Link>
      </div>

      {/* Main Dashboard UI */}
      <div className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden shadow-sm">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-dark-600 bg-dark-900/50 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <Input 
              placeholder="Search member or trainer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-dark-950 border-dark-700 focus:border-gold-500 text-white w-full"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-dark-300 font-medium bg-dark-950 px-4 py-2 rounded-lg border border-dark-700">
            <Dumbbell className="w-4 h-4 text-gold-500" />
            Total Active PT: <span className="text-white">{ptMembers.length}</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-dark-900/80 text-dark-300 uppercase tracking-wider font-medium text-xs border-b border-dark-600">
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
                  <td colSpan={5} className="p-8 text-center text-dark-400 animate-pulse">
                    Loading PT data...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Dumbbell className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                    <h3 className="text-white font-medium mb-1">No Active Clients found</h3>
                    <p className="text-dark-400 text-sm">Assign packages to members via their profile.</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((record) => (
                  <tr key={record.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center overflow-hidden border border-dark-600">
                          {/* {record.members?.photo_url ? (
                            <Image src={record.members.photo_url} alt="Profile" fill className="w-4 h-4 object-cover" />
                          ) : ( */}
                            <User className="w-4 h-4 text-dark-400" />
                          {/* )} */}
                        </div>
                        <div>
                          <p className="font-medium text-white">{record.members?.full_name}</p>
                          <p className="text-xs text-dark-400">{record.members?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-dark-200">{record.pt_packages?.name || 'Custom'}</span>
                    </td>
                    <td className="p-4">
                      <span className="bg-dark-900 border border-dark-700 px-2 py-1 rounded text-dark-200 font-medium">
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
                        <span className="text-xs text-dark-400 mt-1">/ {record.sessions_total}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/members/${record.members?.id}`}>
                        <Button size="sm" className="bg-dark-700 hover:bg-gold-500 hover:text-dark-900 text-white border border-dark-600">
                          View Profile
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}