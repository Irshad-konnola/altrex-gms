"use client"

import { MoreVertical, User, CalendarDays, Phone } from "lucide-react"
import { MemberBadge } from "./MemberBadge"
import type { MemberRow } from "./MemberTable"

export function MemberCard({ member }: { member: MemberRow }) {
  return (
    <div className="bg-dark-950 border border-dark-800 p-4 rounded-2xl flex flex-col gap-4">
      
      {/* Top Row: Avatar, Name, Status */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-dark-300 border border-dark-600 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-base">{member.full_name}</h3>
              {member.is_pt_member && (
                <span className="w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" title="PT Member" />
              )}
            </div>
            <MemberBadge status={member.status} />
          </div>
        </div>
        
        <button className="text-dark-400 hover:text-gold-500 p-1 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Row: Details */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-2 pt-3 border-t border-dark-800/50">
        <div className="flex flex-col">
          <span className="text-[11px] text-dark-400 uppercase font-medium tracking-wider mb-1">Plan</span>
          <span className="text-sm text-dark-100">{member.plan_name}</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-[11px] text-dark-400 uppercase font-medium tracking-wider mb-1">Time Left</span>
          <div className="flex items-center text-sm text-dark-100 gap-1.5">
            <CalendarDays className="w-4 h-4 text-dark-400" />
            <span className={member.days_left <= 7 ? "text-yellow-400 font-medium" : ""}>
              {member.days_left} days
            </span>
          </div>
        </div>

        <div className="flex flex-col col-span-2 mt-1">
           <div className="flex items-center text-sm text-dark-300 gap-2">
            <Phone className="w-4 h-4" />
            {member.phone}
          </div>
        </div>
      </div>
      
    </div>
  )
}