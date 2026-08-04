// src/components/members/MemberFilters.tsx
"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useTransition, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const TABS = ["All", "Active", "Expiring", "Expired", "PT Members"]

export function MemberFilters({ initialSearch, activeTab }: { initialSearch: string, activeTab: string }) {
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

  return (
    <div className="flex flex-col lg:flex-row justify-between gap-4 bg-dark-950 p-2 border border-dark-800 rounded-2xl shadow-sm relative">
      {/* Loading overlay indicator */}
      {isPending && <div className="absolute inset-0 bg-dark-950/20 backdrop-blur-[1px] z-10 rounded-2xl transition-all" />}
      
      {/* Interactive Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-1 p-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300",
              activeTab === tab 
                ? "bg-dark-800 text-gold-500 shadow-sm" 
                : "text-dark-400 hover:text-white hover:bg-dark-900"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Interactive Search */}
      <div className="relative w-full lg:w-72 shrink-0 p-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
        <Input 
          type="text" 
          placeholder="Search by name or phone..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 bg-dark-900 border-dark-700 text-white focus-visible:ring-gold-500/50 rounded-xl"
        />
      </div>
    </div>
  )
}