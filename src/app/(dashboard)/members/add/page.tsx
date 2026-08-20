import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { AddMemberForm } from "@/components/members/AddMemberForm"

export default function AddMemberPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link 
          href="/members" 
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-gold-500 transition-colors bg-background border border-border px-3 py-2 rounded-lg w-fit"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Members
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Add New Member</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">Register a new member and process their first payment.</p>
        </div>
      </div>

      {/* The Form Wizard */}
      <AddMemberForm />
      
    </div>
  )
}