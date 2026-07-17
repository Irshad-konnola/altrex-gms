import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { MemberProfile } from "@/components/members/MemberProfile"
import { getMemberById } from "../actions"

export default async function MemberDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Fetch real data on the server
  const memberData = await getMemberById(id)

  // If the ID doesn't exist in the DB, show a 404
  if (!memberData) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <Link 
          href="/members" 
          className="inline-flex items-center text-sm font-medium text-dark-400 hover:text-gold-500 transition-colors bg-dark-950 border border-dark-800 px-3 py-2 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Members
        </Link>
      </div>

      {/* Pass the real data into the profile component */}
      <MemberProfile initialData={memberData} />
      
    </div>
  )
}