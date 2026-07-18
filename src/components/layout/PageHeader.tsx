// src/components/layout/PageHeader.tsx
import { ChevronRight } from 'lucide-react'

interface PageHeaderProps {
  title: string
  breadcrumb: string
}

export function PageHeader({ title, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-2 flex flex-col items-start justify-center animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center text-xs font-medium text-dark-400 mb-1.5 uppercase tracking-wider">
        <span>Altrex GMS</span>
        <ChevronRight className="h-3 w-3 mx-1.5 opacity-50" />
        <span className="text-gold-500">{breadcrumb}</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
        {title}
      </h1>
    </div>
  )
}