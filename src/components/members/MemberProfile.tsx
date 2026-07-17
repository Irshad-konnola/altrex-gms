/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @next/next/no-img-element */
"use client"

import { useState } from "react"
import { User,ScanFace, CalendarDays, Phone, Mail, MapPin, Activity, CheckCircle2, History, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MemberBadge } from "./MemberBadge"
import { AdjustMembershipModal } from "./AdjustMembershipModal"
import { EditMemberModal } from "./EditMemberModal"
import { useRouter } from "next/navigation"
import { updateMemberAction, archiveMemberAction } from "@/app/(dashboard)/members/actions"
import { toast } from "sonner"


const TABS = ["Overview", "Attendance", "Payments"]
export function MemberProfile({ initialData }: { initialData: any }) {
  const [isArchiving, setIsArchiving] = useState(false)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("Overview")
  const member = initialData

  const handleArchive = async () => {
    // Simple native confirmation dialog to prevent accidental clicks
    if (!window.confirm("Are you sure you want to archive this member? Their history will be saved, but they will be removed from the active list.")) {
      return
    }

    setIsArchiving(true)
    try {
      const result = await archiveMemberAction(member.id)
      if (result.success) {
        toast.success("Member archived successfully.")
        router.push("/members") // Kick the user back to the list
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (error) {
      toast.error("Failed to archive member.")
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-dark-950 border border-dark-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:items-center justify-between relative overflow-hidden">
        {/* Subtle gold glow background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-6 z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-dark-900 border-2 border-dark-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            {/* NEW: Use the real photo if it exists */}
            {member.photo_url ? (
              <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-dark-400" />
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{member.full_name}</h1>
              <MemberBadge status={member.status} />
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-dark-300">
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-dark-400" /> {member.phone}</span>
              {member.device_user_id && (
                <span className="flex items-center gap-1.5 text-green-400"><ScanFace className="w-4 h-4" /> Face ID: {member.device_user_id}</span>
              )}
              {/* NEW: Show BMI */}
              {member.bmi && (
                <span className="flex items-center gap-1.5 text-gold-400"><Activity className="w-4 h-4" /> BMI: {member.bmi}</span>
              )}
            </div>
            </div>
          </div>

        {/* <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left z-10">
          <div className="w-24 h-24 rounded-full bg-dark-900 border-2 border-dark-700 flex items-center justify-center text-dark-400 shrink-0 shadow-xl">
            <User className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-3xl font-bold text-white tracking-tight">{member.full_name}</h1>
              <MemberBadge status={member.status} />
              {member.is_pt_member && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider bg-gold-500/20 text-gold-400 border border-gold-500/30">
                  PT Active
                </span>
              )}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-4 text-dark-300 text-sm font-medium">
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {member.phone}</span>
              <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> Joined Feb 2026</span>
            </div>
          </div> */}
        {/* </div> */}

        <div className="flex flex-col gap-3 w-full sm:w-auto z-10">
          <Button className="bg-gold-500 hover:bg-gold-600 text-dark-950 font-bold w-full sm:w-40 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            Renew Plan
          </Button>
          <AdjustMembershipModal memberId={member.id} currentEndDate={member.end_date} />
         <EditMemberModal member={member} />
         <Button 
            onClick={handleArchive} 
            disabled={isArchiving}
            variant="ghost" 
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-900/30 w-full sm:w-auto rounded-xl"
          >
            {isArchiving ? "Archiving..." : "Archive"}
          </Button>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Custom Tab Navigation */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-dark-950 border border-dark-800 rounded-xl w-fit">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2 rounded-lg text-sm font-semibold transition-all",
                  activeTab === tab 
                    ? "bg-dark-800 text-gold-500 shadow-sm" 
                    : "text-dark-400 hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === "Overview" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-dark-950 border border-dark-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-gold-500" /> Personal Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <p className="text-xs text-dark-400 uppercase tracking-wider font-medium mb-1">Email</p>
                    <p className="text-dark-50 flex items-center gap-2"><Mail className="w-4 h-4 text-dark-400" /> {member.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 uppercase tracking-wider font-medium mb-1">Date of Birth</p>
                    <p className="text-dark-50">{member.dob}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 uppercase tracking-wider font-medium mb-1">Gender</p>
                    <p className="text-dark-50">{member.gender}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 uppercase tracking-wider font-medium mb-1">Address</p>
                    <p className="text-dark-50 flex items-start gap-2"><MapPin className="w-4 h-4 text-dark-400 shrink-0 mt-0.5" /> {member.address}</p>
                  </div>
                  <div className="sm:col-span-2 pt-4 border-t border-dark-800">
                    <p className="text-xs text-dark-400 uppercase tracking-wider font-medium mb-2">Health Notes / Injuries</p>
                    <div className="bg-dark-900 border border-dark-800 p-4 rounded-xl text-dark-200 text-sm">
                      {member.health_notes}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PLACEHOLDERS FOR OTHER TABS */}
          {activeTab === "Attendance" && (
            <div className="bg-dark-950 border border-dark-800 rounded-2xl p-12 text-center animate-in fade-in duration-300">
              <History className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Attendance History</h3>
              <p className="text-dark-400 text-sm">Real check-in logs will appear here once connected to the eSSL device.</p>
            </div>
          )}

          {activeTab === "Payments" && (
            <div className="bg-dark-950 border border-dark-800 rounded-2xl p-12 text-center animate-in fade-in duration-300">
              <CreditCard className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Payment History</h3>
              <p className="text-dark-400 text-sm">Past transactions and receipt statuses will be listed here.</p>
            </div>
          )}

        </div>

        {/* Right Column (Side Widgets) */}
        <div className="space-y-6">
          
          {/* Active Plan Widget */}
          <div className="bg-dark-950 border border-dark-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold-500" /> Current Plan
            </h3>
            
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 mb-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1 h-full bg-gold-500" />
              <h4 className="font-bold text-white text-lg mb-1">{member.plan_name}</h4>
              <p className="text-dark-300 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Active
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-dark-400 text-sm font-medium">Valid Till</span>
                <span className="text-white font-semibold">{member.end_date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-400 text-sm font-medium">Time Remaining</span>
                <span className="text-gold-500 font-bold">{member.days_left} days</span>
              </div>
            </div>
          </div>

          {/* PT Widget (Conditionally rendered) */}
          {member.is_pt_member && (
            <div className="bg-dark-950 border border-dark-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Personal Training</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-dark-800">
                  <span className="text-dark-400 text-sm font-medium">Trainer</span>
                  <span className="text-white font-semibold">{member.trainer_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark-400 text-sm font-medium">Sessions Left</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-gold-500">{member.pt_sessions_left}</span>
                    <span className="text-dark-400 text-xs mt-1">/ 20</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}