import Link from "next/link"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MemberTable } from "@/components/members/MemberTable"
import { MemberCard } from "@/components/members/MemberCard"
import { MemberFilters } from "@/components/members/MemberFilters"
import { PaginationControls } from "@/components/ui/pagination"
import { getMembers } from "./actions"

export default async function MembersPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ query?: string; tab?: string; sort?: string; page?: string; plan?: string }> 
}) {
  const resolvedParams = await searchParams
  const search = resolvedParams.query?.toLowerCase() || ""
  const activeTab = resolvedParams.tab || "All"
  const sortOption = resolvedParams.sort || ""
  const planFilter = resolvedParams.plan || ""

  const members = await getMembers()

  // Summary counts for frontdesk staff
  const totalCount = members.filter((m: any) => m.status !== "archived").length
  const activeCount = members.filter((m: any) => m.status === "active" || m.status === "expiring").length
  const expiringCount = members.filter((m: any) => m.status === "expiring" || (m.days_left !== null && m.days_left !== undefined && m.days_left > 0 && m.days_left <= 7)).length
  const expiredCount = members.filter((m: any) => m.status === "expired" || m.days_left === 0).length
  const ptCount = members.filter((m: any) => m.is_pt_member).length
  const duePendingCount = members.filter((m: any) => m.due_amount && m.due_amount > 0).length

  const tabCounts = {
    All: totalCount,
    Active: activeCount,
    Expiring: expiringCount,
    Expired: expiredCount,
    "PT Members": ptCount,
    "Due Pending": duePendingCount
  }

  // Extract distinct plan names for the plan filter dropdown
  const availablePlans = Array.from(
    new Set(
      members
        .map((m: any) => {
          if (!m.plan_name || m.plan_name === "Unknown Plan" || m.plan_name === "No Plan") return null
          return m.plan_name.replace(" (Renewed)", "").trim()
        })
        .filter(Boolean) as string[]
    )
  ).sort()

  const filteredMembers = members.filter((member: any) => {
    // 1. Text search by Name, Phone, OR Plan Name
    const matchesSearch = 
      member.full_name?.toLowerCase().includes(search) || 
      member.phone?.includes(search) ||
      (member.plan_name && member.plan_name.toLowerCase().includes(search))
    
    if (!matchesSearch) return false

    // 2. Specific Plan filter dropdown
    if (planFilter && planFilter !== "all") {
      const memberPlan = (member.plan_name || "").toLowerCase()
      if (!memberPlan.includes(planFilter.toLowerCase())) {
        return false
      }
    }
    
    // 3. Tab filter
    switch (activeTab) {
      case "Active": return member.status === "active" || member.status === "expiring"
      case "Expiring": return member.status === "expiring" || (member.days_left !== null && member.days_left !== undefined && member.days_left > 0 && member.days_left <= 7)
      case "Expired": return member.status === "expired" || member.days_left === 0
      case "PT Members": return member.is_pt_member
      case "Due Pending": return member.due_amount && member.due_amount > 0
      default: return true
    }
  })

  // Apply sorting
  filteredMembers.sort((a: any, b: any) => {
    if (sortOption === "oldest") {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    } else if (sortOption === "name_asc") {
      return a.full_name.localeCompare(b.full_name)
    } else if (sortOption === "name_desc") {
      return b.full_name.localeCompare(a.full_name)
    }
    return 0
  })

  // Pagination
  const page = parseInt(resolvedParams.page || "1", 10)
  const pageSize = 15
  const totalPages = Math.ceil(filteredMembers.length / pageSize)
  const paginatedMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header and Add Member Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Members</h1>
          <p className="text-muted-foreground mt-1">Manage your gym members and their subscriptions.</p>
        </div>
        
        <Link href="/members/add" className="w-full sm:w-auto">
          <Button className="bg-gradient-to-b from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 text-dark-950 font-bold w-full h-11 px-6 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.25)] transition-all">
            <UserPlus className="w-5 h-5 mr-2" />
            Add Member
          </Button>
        </Link>
      </div>

      {/* Filter Component with Plan Filter and Tab Counts */}
      <MemberFilters 
        initialSearch={search} 
        activeTab={activeTab} 
        initialSort={sortOption} 
        initialPlan={planFilter}
        availablePlans={availablePlans}
        tabCounts={tabCounts}
      />

      <div className="hidden md:block">
        <MemberTable members={paginatedMembers} />
      </div>

      <div className="md:hidden space-y-4">
        {paginatedMembers.length === 0 ? (
          <div className="w-full p-8 text-center bg-card border border-border rounded-xl">
            <p className="text-muted-foreground text-sm">No members found.</p>
          </div>
        ) : (
          paginatedMembers.map((member: any) => (
            <MemberCard key={member.id} member={member} />
          ))
        )}
      </div>
      
      <PaginationControls totalPages={totalPages} currentPage={page} />
    </div>
  )
}
