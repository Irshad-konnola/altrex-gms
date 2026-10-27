// src/components/members/MemberFilters.tsx
"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, X, Filter, ArrowUpDown, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useTransition, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const TABS = ["All", "Active", "Expiring", "Expired", "PT Members", "Due Pending"]

interface MemberFiltersProps {
  initialSearch: string
  activeTab: string
  initialSort?: string
  initialPlan?: string
  availablePlans?: string[]
  tabCounts?: Record<string, number>
}

export function MemberFilters({ 
  initialSearch, 
  activeTab, 
  initialSort,
  initialPlan,
  availablePlans = [],
  tabCounts
}: MemberFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [searchTerm, setSearchTerm] = useState(initialSearch)

  useEffect(() => {
    const currentQuery = searchParams.get("query") || ""
    if (searchTerm === currentQuery) return;

    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchTerm) {
        params.set("query", searchTerm)
      } else {
        params.delete("query")
      }
      params.delete("page")
      
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 300) 

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, pathname, router, searchParams])

  const handleTabClick = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab !== "All") {
      params.set("tab", tab)
    } else {
      params.delete("tab")
    }
    params.delete("page")
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sort = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (sort) {
      params.set("sort", sort)
    } else {
      params.delete("sort")
    }
    params.delete("page")
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const plan = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (plan && plan !== "all") {
      params.set("plan", plan)
    } else {
      params.delete("plan")
    }
    params.delete("page")
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  const handleResetFilters = () => {
    setSearchTerm("")
    startTransition(() => {
      router.replace(pathname)
    })
  }

  const hasActiveFilters = Boolean(
    searchTerm || 
    (initialPlan && initialPlan !== "all") || 
    initialSort || 
    activeTab !== "All"
  )

  return (
    <div className="space-y-3 relative">
      {/* Loading overlay indicator */}
      {isPending && (
        <div className="absolute inset-0 bg-background/25 backdrop-blur-[1px] z-20 rounded-2xl transition-all" />
      )}
      
      {/* Level 1: Primary Category Tabs */}
      <div className="bg-background/90 p-1.5 border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-0.5">
          {TABS.map(tab => {
            const count = tabCounts ? tabCounts[tab] : undefined
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 shrink-0",
                  isActive 
                    ? "bg-muted text-gold-500 shadow-sm ring-1 ring-gold-500/30" 
                    : "text-muted-foreground hover:text-foreground hover:bg-card/70"
                )}
              >
                <span>{tab}</span>
                {count !== undefined && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums transition-colors",
                    isActive
                      ? "bg-gold-500/20 text-gold-400"
                      : "bg-card text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Level 2: Search & Refinement Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-background/90 p-2.5 border border-border rounded-2xl shadow-sm">
        
        {/* Generous Search Input */}
        <div className="relative flex-1 max-w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search member by name, phone, or plan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-9 h-11 w-full bg-card border-border text-foreground focus-visible:ring-gold-500/50 rounded-xl text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex items-center gap-2.5 shrink-0 overflow-x-auto no-scrollbar">
          
          {/* Plan Filter Dropdown */}
          {availablePlans.length > 0 && (
            <div className="relative flex items-center">
              <Filter className="absolute left-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <select 
                value={initialPlan || "all"}
                onChange={handlePlanChange}
                className="h-11 pl-8 pr-7 bg-card border border-border text-foreground text-xs sm:text-sm font-medium focus:border-gold-500 rounded-xl outline-none min-w-[140px] max-w-[200px] truncate cursor-pointer hover:border-gold-500/40 transition-colors"
                title="Filter by Plan"
              >
                <option value="all">All Plans</option>
                {availablePlans.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <ArrowUpDown className="absolute left-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <select 
              value={initialSort || ""}
              onChange={handleSortChange}
              className="h-11 pl-8 pr-7 bg-card border border-border text-foreground text-xs sm:text-sm font-medium focus:border-gold-500 rounded-xl outline-none min-w-[130px] cursor-pointer hover:border-gold-500/40 transition-colors"
              title="Sort Members"
            >
              <option value="">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="h-11 px-3.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-gold-500 hover:bg-card border border-border rounded-xl transition-all whitespace-nowrap shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

        </div>
      </div>
    </div>
  )
}
