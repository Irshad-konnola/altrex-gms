import { cn } from "@/lib/utils"

export function MemberBadge({ status }: { status: string }) {
  const styles = {
    active: "bg-green-500/20 text-green-400 border border-green-500/30",
    expiring: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    expired: "bg-red-500/20 text-red-400 border border-red-500/30",
    inactive: "bg-dark-600/50 text-dark-300 border border-dark-500/30",
    archived: "bg-dark-800 text-dark-400 border border-dark-700",
  }

  const defaultStyle = "bg-dark-600/50 text-dark-300 border border-dark-500/30"
  const appliedStyle = styles[status.toLowerCase() as keyof typeof styles] || defaultStyle

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider", appliedStyle)}>
      {status}
    </span>
  )
}