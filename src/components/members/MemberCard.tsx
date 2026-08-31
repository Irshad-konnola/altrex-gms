// src/components/members/MemberCard.tsx
"use client"

import { User, CalendarDays, Phone, ChevronRight } from "lucide-react"
import { MemberBadge } from "./MemberBadge"
import type { MemberRow } from "./MemberTable"
import { useRouter } from "next/navigation"

export function MemberCard({ member }: { member: MemberRow }) {
  const router = useRouter()

  return (
    <div 
      onClick={() => router.push(`/members/${member.id}`)}
      className="bg-background border border-border p-4 rounded-2xl flex flex-col gap-4 cursor-pointer hover:border-gold-500/50 transition-colors shadow-sm active:scale-[0.98]"
    >
      
      {/* Top Row: Avatar, Name, Status */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border shrink-0 overflow-hidden">
             {member.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6" />
              )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground text-base">{member.full_name}</h3>
              {member.is_pt_member && (
                <span className="w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" title="PT Member" />
              )}
            </div>
            <MemberBadge status={member.status} />
          </div>
        </div>
        
        {/* Replaced dots with a clear navigation chevron */}
        <div className="text-muted-foreground p-2 bg-card rounded-lg">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Bottom Row: Details */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-2 pt-3 border-t border-border/50">
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Plan</span>
          <span className="text-sm font-medium text-foreground">{member.plan_name}</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Time Left</span>
          <div className="flex items-center text-sm font-medium text-foreground gap-1.5">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-col gap-1 items-end">
              <span className={member.days_left <= 7 ? "text-yellow-400 font-bold" : "text-foreground font-medium"}>
                {member.days_left} days <span className="text-muted-foreground text-[10px] font-normal">(Plan)</span>
              </span>
              {member.is_pt_member && typeof member.pt_sessions_left === 'number' && (
                <span className={member.pt_sessions_left <= 3 ? "text-yellow-400 font-bold text-xs" : "text-gold-500 font-medium text-xs"}>
                  {member.pt_days_left} days / {member.pt_sessions_left} sesh
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col col-span-2 mt-1 bg-card p-2.5 rounded-lg border border-border">
           <div className="flex items-center text-sm font-medium text-foreground gap-3">
            <Phone className="w-4 h-4 text-gold-500" />
            {member.phone}
          </div>
        </div>
      </div>
      
    </div>
  )
}