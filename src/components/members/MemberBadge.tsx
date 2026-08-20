import { cn } from "@/lib/utils"

export function MemberBadge({ status }: { status: string }) {
  const styles = {
    active: "bg-green-500/20 text-green-400 border border-green-500/30",
    expiring: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    expired: "bg-red-500/20 text-red-400 border border-red-500/30",
    inactive: "bg-muted/50 text-muted-foreground border border-border/30",
    archived: "bg-muted text-muted-foreground border border-border",
  }

  const defaultStyle = "bg-muted/50 text-muted-foreground border border-border/30"
  const appliedStyle = styles[status.toLowerCase() as keyof typeof styles] || defaultStyle

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider", appliedStyle)}>
      {status}
    </span>
  )
}