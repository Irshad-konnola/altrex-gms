/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client"

import { useState } from "react"
import { User, ScanFace, Phone, Mail, MapPin, Activity, CheckCircle2, Dumbbell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MemberBadge } from "./MemberBadge"
import { AdjustMembershipModal } from "./AdjustMembershipModal"
import { EditMemberModal } from "./EditMemberModal"
import { useRouter } from "next/navigation"
import { archiveMemberAction, unarchiveMemberAction } from "@/app/(dashboard)/members/actions"
import { toast } from "sonner"
import { PTTab } from "@/components/pt/PTTab"
import { MemberPaymentsTab } from "./MemberPaymentsTab"
import { MemberAttendanceTab } from "./MemberAttendanceTab"
import { RenewPlanModal } from "./RenewPlanModal"
const TABS = ["Overview", "Attendance", "Payments", "PT"]

export function MemberProfile({ initialData }: { initialData: any }) {
  const [isArchiving, setIsArchiving] = useState(false)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("Overview")
  const member = initialData

  const handleArchive = async () => {
    if (!window.confirm("Are you sure you want to archive this member?")) return
    setIsArchiving(true)
    try {
      const result = await archiveMemberAction(member.id)
      if (result.success) {
        toast.success("Member archived successfully.")
        router.push("/members") 
      } else toast.error(`Error: ${result.error}`)
    } catch {
      toast.error("Failed to archive member.")
    } finally {
      setIsArchiving(false)
    }
  }

  const handleUnarchive = async () => {
    if (!window.confirm("Are you sure you want to unarchive this member?")) return
    setIsArchiving(true)
    try {
      const result = await unarchiveMemberAction(member.id)
      if (result.success) {
        toast.success("Member unarchived successfully.")
        router.refresh()
      } else toast.error(`Error: ${result.error}`)
    } catch {
      toast.error("Failed to unarchive member.")
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-background border border-border rounded-2xl p-4 sm:p-8 flex flex-col xl:flex-row gap-6 xl:items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start xl:items-center gap-6 z-10 text-center sm:text-left">
          <div className="w-24 h-24 rounded-full bg-card border-2 border-border flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            {member.photo_url ? (
              <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{member.full_name}</h1>
              <MemberBadge status={member.status} />
            </div>
            
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-muted-foreground" /> {member.phone}</span>
              {member.device_user_id && (
                <span className="flex items-center gap-1.5 text-green-400"><ScanFace className="w-4 h-4" /> Face ID: {member.device_user_id}</span>
              )}
              {member.bmi && (
                <span className="flex items-center gap-1.5 text-gold-400"><Activity className="w-4 h-4" /> BMI: {member.bmi}</span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Responsive Action Buttons */}
       <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto z-10 mt-4 xl:mt-0 justify-start xl:justify-end">
          <RenewPlanModal 
            memberId={member.id} 
            memberName={member.full_name}
            memberPhone={member.phone}
            currentEndDate={member.end_date}
          />
          <AdjustMembershipModal memberId={member.id} currentEndDate={member.end_date} />
          <EditMemberModal member={member} />
          {member.status === "archived" ? (
            <Button 
              onClick={handleUnarchive} 
              disabled={isArchiving}
              variant="outline" 
              className="rounded-xl px-4 h-10 py-2"
            >
              {isArchiving ? "Restoring..." : "Unarchive"}
            </Button>
          ) : (
            <Button 
              onClick={handleArchive} 
              disabled={isArchiving}
              variant="ghost" 
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-900/30 rounded-xl px-4 h-10 py-2"
            >
              {isArchiving ? "Archiving..." : "Archive"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 overflow-hidden">
          
          {/* Mobile Responsive Tabs Wrapper */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-background border border-border rounded-xl w-full sm:w-fit">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                  activeTab === tab ? "bg-muted text-gold-500 shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Overview" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-background border border-border rounded-2xl p-6">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-gold-500" /> Personal Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Email</p>
                    <p className="text-foreground flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {member.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Date of Birth</p>
                    <p className="text-foreground">{member.dob || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Gender</p>
                    <p className="text-foreground capitalize">{member.gender || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Address</p>
                    <p className="text-foreground flex items-start gap-2"><MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> {member.address || "No address provided"}</p>
                  </div>
                  <div className="sm:col-span-2 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Health Notes / Injuries</p>
                    <div className="bg-card border border-border p-4 rounded-xl text-foreground text-sm">
                      {member.health_notes || "No health notes provided."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

       {activeTab === "Attendance" && (
            <MemberAttendanceTab memberId={member.id} />
          )}

          {activeTab === "Payments" && <MemberPaymentsTab memberId={member.id} />}
          {activeTab === "PT" && <PTTab memberId={member.id} />}
        </div>

        <div className="space-y-6">
          <div className="bg-background border border-border rounded-2xl p-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold-500" /> Current Plan
            </h3>
            
            <div className="bg-card border border-border rounded-xl p-5 mb-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1 h-full bg-gold-500" />
              <h4 className="font-bold text-foreground text-lg mb-1">{member.plan_name || "General Access"}</h4>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Active
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm font-medium">Valid Till</span>
                <span className="text-foreground font-semibold">{member.end_date || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm font-medium">Time Remaining</span>
                <span className="text-gold-500 font-bold">{member.days_left || "0"} days</span>
              </div>
            </div>
          </div>

          {member.is_pt_member && (
            <div className="bg-background border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-gold-500" /> Personal Training
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3">
                  <span className="text-muted-foreground text-sm font-medium">Status</span>
                  <span className="text-foreground font-semibold">Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}