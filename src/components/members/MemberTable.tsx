// src/components/members/MemberTable.tsx
/* eslint-disable @next/next/no-img-element */
"use client"

import { useRouter } from "next/navigation"
import { User, ScanFace, Eye,Users } from "lucide-react"
import { MemberBadge } from "./MemberBadge"

export interface MemberRow {
  id: string
  full_name: string
  phone: string
  plan_name: string
  status: string
  days_left: number
  is_pt_member: boolean
  pt_days_left?: number | null
  pt_sessions_left?: number | null
  photo_url?: string
  device_user_id?: string
}

export function MemberTable({ members }: { members: MemberRow[] }) {
  console.log(members,"member details");
  
  const router = useRouter()

  if (members.length === 0) {
    return (
      <div className="w-full p-12 text-center bg-background border border-border rounded-xl">
        <Users className="w-10 h-10 text-dark-600 mx-auto mb-3" />
        <p className="text-foreground font-medium">No members found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-card border-b border-border">
          <tr>
            <th className="px-6 py-4 font-bold tracking-wider">Member</th>
            <th className="px-6 py-4 font-bold tracking-wider">Contact</th>
            <th className="px-6 py-4 font-bold tracking-wider">Plan</th>
            <th className="px-6 py-4 font-bold tracking-wider">Status</th>
            <th className="px-6 py-4 font-bold tracking-wider">Time Left</th>
            <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-800">
          {members.map((member) => (
            <tr 
              key={member.id} 
              onClick={() => router.push(`/members/${member.id}`)}
              className="hover:bg-card/50 transition-colors group cursor-pointer"
            >
              <td className="px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border overflow-hidden shrink-0">
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{member.full_name}</span>
                    {member.is_pt_member && <span className="w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]" title="PT Member" />}
                  </div>
                  {member.device_user_id ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-500 mt-0.5 font-medium tracking-wide">
                      <ScanFace className="w-3 h-3" /> Face ID: {member.device_user_id}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground mt-0.5 uppercase font-medium tracking-wide">Not Connected</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-foreground">{member.phone}</td>
              <td className="px-6 py-4 text-foreground font-medium">{member.plan_name}</td>
              <td className="px-6 py-4"><MemberBadge status={member.status} /></td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <span className={member.days_left <= 7 ? "text-yellow-400 font-bold" : "text-foreground font-medium"}>
                    {member.days_left} days <span className="text-muted-foreground text-xs font-normal">(Plan)</span>
                  </span>
                  {member.is_pt_member && typeof member.pt_sessions_left === 'number' && (
                    <span className={member.pt_sessions_left <= 3 ? "text-yellow-400 font-bold text-sm" : "text-gold-500 font-medium text-sm"}>
                      {member.pt_days_left} days / {member.pt_sessions_left} sesh <span className="text-muted-foreground text-xs font-normal">(PT)</span>
                    </span>
                  )}
                </div>
              </td>
              
              {/* Fixed Action Column */}
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents the row click from firing
                      router.push(`/members/${member.id}`);
                    }}
                    className="p-2 text-muted-foreground hover:text-foreground bg-card hover:bg-card rounded-lg transition-all border border-border hover:border-border"
                    title="View Profile"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {/* <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Edit logic routed to profile for now, where edit modal exists
                      router.push(`/members/${member.id}`);
                    }}
                    className="p-2 text-muted-foreground hover:text-gold-500 bg-card hover:bg-card rounded-lg transition-all border border-border hover:border-gold-500/50"
                    title="Edit Member"
                  >
                    <Pencil className="w-4 h-4" />
                  </button> */}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}