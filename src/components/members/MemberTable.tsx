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
  photo_url?: string
  device_user_id?: string
}

export function MemberTable({ members }: { members: MemberRow[] }) {
  console.log(members,"member details");
  
  const router = useRouter()

  if (members.length === 0) {
    return (
      <div className="w-full p-12 text-center bg-dark-950 border border-dark-800 rounded-xl">
        <Users className="w-10 h-10 text-dark-600 mx-auto mb-3" />
        <p className="text-white font-medium">No members found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-dark-800 bg-dark-950 shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-dark-300 uppercase bg-dark-900 border-b border-dark-800">
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
              className="hover:bg-dark-900/50 transition-colors group cursor-pointer"
            >
              <td className="px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-dark-300 border border-dark-600 overflow-hidden shrink-0">
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-dark-50">{member.full_name}</span>
                    {member.is_pt_member && <span className="w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]" title="PT Member" />}
                  </div>
                  {member.device_user_id ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-500 mt-0.5 font-medium tracking-wide">
                      <ScanFace className="w-3 h-3" /> Face ID: {member.device_user_id}
                    </span>
                  ) : (
                    <span className="text-[10px] text-dark-400 mt-0.5 uppercase font-medium tracking-wide">Not Connected</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-dark-200">{member.phone}</td>
              <td className="px-6 py-4 text-dark-200 font-medium">{member.plan_name}</td>
              <td className="px-6 py-4"><MemberBadge status={member.status} /></td>
              <td className="px-6 py-4">
                <span className={member.days_left <= 7 ? "text-yellow-400 font-bold" : "text-dark-200 font-medium"}>
                  {member.days_left} days
                </span>
              </td>
              
              {/* Fixed Action Column */}
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents the row click from firing
                      router.push(`/members/${member.id}`);
                    }}
                    className="p-2 text-dark-400 hover:text-white bg-dark-900 hover:bg-dark-700 rounded-lg transition-all border border-dark-700 hover:border-dark-600"
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
                    className="p-2 text-dark-400 hover:text-gold-500 bg-dark-900 hover:bg-dark-700 rounded-lg transition-all border border-dark-700 hover:border-gold-500/50"
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