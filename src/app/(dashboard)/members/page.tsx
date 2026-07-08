"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MemberTable, type MemberRow } from "@/components/members/MemberTable"
import { MemberCard } from "@/components/members/MemberCard"

// Mock data to visualize the UI
const MOCK_MEMBERS: MemberRow[] = [
  { id: "1", full_name: "Rahul N", phone: "+91 9876543210", plan_name: "3-Month Premium", status: "active", days_left: 45, is_pt_member: true },
  { id: "2", full_name: "Sneha P", phone: "+91 9876543211", plan_name: "Annual Pass", status: "active", days_left: 210, is_pt_member: false },
  { id: "3", full_name: "Vishnu M", phone: "+91 9876543212", plan_name: "1-Month Basic", status: "expiring", days_left: 3, is_pt_member: false },
  { id: "4", full_name: "Afsal K", phone: "+91 9876543213", plan_name: "6-Month Premium", status: "expired", days_left: 0, is_pt_member: true },
]

const TABS = ["All", "Active", "Expiring", "Expired", "PT Members"]

export default function MembersPage() {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("All")

  const filteredMembers = MOCK_MEMBERS.filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(search.toLowerCase()) || 
                          member.phone.includes(search)
    
    if (!matchesSearch) return false
    
    switch (activeTab) {
      case "Active": return member.status === "active"
      case "Expiring": return member.status === "expiring"
      case "Expired": return member.status === "expired"
      case "PT Members": return member.is_pt_member
      default: return true
    }
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Members</h1>
          <p className="text-dark-300 mt-1">Manage your gym members and their subscriptions.</p>
        </div>
        
        {/* ADDED LINK TO NEW PAGE */}
        <Link href="/members/add" className="w-full sm:w-auto">
          <Button className="bg-gold-500 hover:bg-gold-600 text-dark-950 font-bold w-full h-11 px-6 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all">
            <UserPlus className="w-5 h-5 mr-2" />
            Add Member
          </Button>
        </Link>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 bg-dark-950 p-2 border border-dark-800 rounded-2xl shadow-sm">
        <div className="flex overflow-x-auto no-scrollbar gap-1 p-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === tab 
                  ? "bg-dark-800 text-gold-500 shadow-sm" 
                  : "text-dark-300 hover:text-dark-100 hover:bg-dark-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72 shrink-0 p-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <Input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-dark-900 border-dark-700 text-white focus-visible:ring-gold-500/50 rounded-xl"
          />
        </div>
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block">
        <MemberTable members={filteredMembers} />
      </div>

      {/* FIXED: Mobile Card View (Hidden on desktop) */}
      <div className="md:hidden space-y-4">
        {filteredMembers.length === 0 ? (
          <div className="w-full p-8 text-center bg-dark-950 border border-dark-800 rounded-xl">
            <p className="text-dark-300 text-sm">No members found.</p>
          </div>
        ) : (
          filteredMembers.map(member => (
            <MemberCard key={member.id} member={member} />
          ))
        )}
      </div>

    </div>
  )
}