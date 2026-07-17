/* eslint-disable @next/next/no-img-element */
"use client"

import { useRouter } from "next/navigation"
import { MoreHorizontal, User, ScanFace } from "lucide-react"
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
  const router = useRouter()

  if (members.length === 0) {
    return (
      <div className="w-full p-8 text-center bg-dark-950 border border-dark-800 rounded-xl">
        <p className="text-dark-300">No members found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-dark-800 bg-dark-950">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-dark-300 uppercase bg-dark-900 border-b border-dark-800">
          <tr>
            <th className="px-6 py-4 font-medium">Member</th>
            <th className="px-6 py-4 font-medium">Contact</th>
            <th className="px-6 py-4 font-medium">Plan</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium">Time Left</th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
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
                    <span className="font-medium text-dark-50">{member.full_name}</span>
                    {member.is_pt_member && <span className="w-2 h-2 rounded-full bg-gold-500" title="PT Member" />}
                  </div>
                  {/* NEW: Device Connection Indicator */}
                  {member.device_user_id ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-500 mt-0.5 font-medium">
                      <ScanFace className="w-3 h-3" /> Face ID: {member.device_user_id}
                    </span>
                  ) : (
                    <span className="text-[10px] text-dark-400 mt-0.5">Not Connected</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-dark-200">{member.phone}</td>
              <td className="px-6 py-4 text-dark-200">{member.plan_name}</td>
              <td className="px-6 py-4"><MemberBadge status={member.status} /></td>
              <td className="px-6 py-4">
                <span className={member.days_left <= 7 ? "text-yellow-400 font-medium" : "text-dark-200"}>{member.days_left} days</span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-dark-400 hover:text-gold-500 p-1 transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}