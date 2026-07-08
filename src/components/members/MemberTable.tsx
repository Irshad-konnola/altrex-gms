"use client"

import { MoreHorizontal, User } from "lucide-react"
import { MemberBadge } from "./MemberBadge"

// Temporary interface until we generate full DB types
export interface MemberRow {
  id: string
  full_name: string
  phone: string
  plan_name: string
  status: string
  days_left: number
  is_pt_member: boolean
}

export function MemberTable({ members }: { members: MemberRow[] }) {
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
            <tr key={member.id} className="hover:bg-dark-900/50 transition-colors group">
              <td className="px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center text-dark-300 border border-dark-600">
                  <User className="w-4 h-4" />
                </div>
                <span className="font-medium text-dark-50">{member.full_name}</span>
                {member.is_pt_member && (
                  <span className="w-2 h-2 rounded-full bg-gold-500 ml-2" title="PT Member" />
                )}
              </td>
              <td className="px-6 py-4 text-dark-200">{member.phone}</td>
              <td className="px-6 py-4 text-dark-200">{member.plan_name}</td>
              <td className="px-6 py-4">
                <MemberBadge status={member.status} />
              </td>
              <td className="px-6 py-4">
                <span className={member.days_left <= 7 ? "text-yellow-400 font-medium" : "text-dark-200"}>
                  {member.days_left} days
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-dark-400 hover:text-gold-500 p-1 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}