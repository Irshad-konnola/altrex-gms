/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link"
import { Search, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MemberTable } from "@/components/members/MemberTable"
import { MemberCard } from "@/components/members/MemberCard"
import { getMembers } from "./actions"

const TABS = ["All", "Active", "Expiring", "Expired", "PT Members"]

// In Next.js 15, we use searchParams to handle our filters and search on the server!
export default async function MembersPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ query?: string; tab?: string }> 
}) {
  const resolvedParams = await searchParams
  const search = resolvedParams.query?.toLowerCase() || ""
  const activeTab = resolvedParams.tab || "All"

  // Fetch REAL data from Supabase
  const members = await getMembers()

  // Filter logic applied to real data
  const filteredMembers = members.filter((member: any) => {
    const matchesSearch = member.full_name.toLowerCase().includes(search) || 
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
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Members</h1>
          <p className="text-dark-300 mt-1">Manage your gym members and their subscriptions.</p>
        </div>
        
        <Link href="/members/add" className="w-full sm:w-auto">
          <Button className="bg-gold-500 hover:bg-gold-600 text-dark-950 font-bold w-full h-11 px-6 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all">
            <UserPlus className="w-5 h-5 mr-2" />
            Add Member
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row justify-between gap-4 bg-dark-950 p-2 border border-dark-800 rounded-2xl shadow-sm">
        
        {/* Temporary static tabs - we will make these interactive with Next.js navigation later */}
        <div className="flex overflow-x-auto no-scrollbar gap-1 p-1">
          {TABS.map(tab => (
            <Link
              key={tab}
              href={`/members?tab=${tab}${search ? `&query=${search}` : ''}`}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === tab 
                  ? "bg-dark-800 text-gold-500 shadow-sm" 
                  : "text-dark-300 hover:text-dark-100 hover:bg-dark-900"
              }`}
            >
              {tab}
            </Link>
          ))}
        </div>

        <div className="relative w-full lg:w-72 shrink-0 p-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          {/* Note: We will wire this search input up to the URL router in a future step */}
          <Input 
            type="text" 
            placeholder="Search by name or phone..." 
            defaultValue={search}
            className="pl-10 h-10 bg-dark-900 border-dark-700 text-white focus-visible:ring-gold-500/50 rounded-xl"
          />
        </div>
      </div>

      <div className="hidden md:block">
        <MemberTable members={filteredMembers} />
      </div>

      <div className="md:hidden space-y-4">
        {filteredMembers.length === 0 ? (
          <div className="w-full p-8 text-center bg-dark-950 border border-dark-800 rounded-xl">
            <p className="text-dark-300 text-sm">No members found.</p>
          </div>
        ) : (
          filteredMembers.map((member: any) => (
            <MemberCard key={member.id} member={member} />
          ))
        )}
      </div>

    </div>
  )
}