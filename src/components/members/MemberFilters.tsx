// src/components/members/MemberFilters.tsx
"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useTransition, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const TABS = ["All", "Active", "Expiring", "Expired", "PT Members"]

export function MemberFilters({ initialSearch, activeTab, initialSort }: { initialSearch: string, activeTab: string, initialSort?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [searchTerm, setSearchTerm] = useState(initialSearch)

  useEffect(() => {
    // GUARD: Check what is currently in the URL
    const currentQuery = searchParams.get("query") || ""
    
    // GUARD: If the URL already matches our search term, stop the effect to prevent infinite loops!
    if (searchTerm === currentQuery) return;

    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchTerm) {
        params.set("query", searchTerm)
      } else {
        params.delete("query")
      }
      
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
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col lg:flex-row justify-between gap-4 bg-background p-2 border border-border rounded-2xl shadow-sm relative">
      {/* Loading overlay indicator */}
      {isPending && <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] z-10 rounded-2xl transition-all" />}
      
      {/* Interactive Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-1 p-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300",
              activeTab === tab 
                ? "bg-muted text-gold-500 shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {/* Interactive Sort */}
        <div className="p-1 shrink-0">
          <select 
            value={initialSort || ""}
            onChange={handleSortChange}
            className="h-10 px-3 bg-card border border-border text-foreground text-sm focus:border-gold-500 rounded-xl outline-none"
          >
            <option value="">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
          </select>
        </div>

        {/* Interactive Search */}
        <div className="relative w-full lg:w-64 shrink-0 p-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-card border-border text-foreground focus-visible:ring-gold-500/50 rounded-xl"
          />
        </div>
      </div>
    </div>
  )
}