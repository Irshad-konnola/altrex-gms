// src/components/pt/AssignPT.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

type PTPackage = {
  id: string
  name: string
  total_sessions: number
  price: number
}

export function AssignPT({ memberId, onAssigned }: { memberId: string, onAssigned?: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [packages, setPackages] = useState<PTPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    pt_package_id: "",
    trainer_name: "",
    start_date: new Date().toISOString().split('T')[0]
  })

 useEffect(() => {
    const loadPackages = async () => {
      if (isOpen && packages.length === 0) {
        setLoading(true)
        try {
          const res = await fetch('/api/pt/packages')
          const data = await res.json()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const activePackages = data.filter((p: any) => p.is_active)
          setPackages(activePackages)
          if (activePackages.length > 0) {
            setFormData(prev => ({ ...prev, pt_package_id: activePackages[0].id }))
          }
        } finally {
          setLoading(false)
        }
      }
    }
    
    loadPackages()
  }, [isOpen, packages.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/pt/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, member_id: memberId })
      })

      if (!res.ok) throw new Error("Failed to assign PT")

      toast.success("PT Package assigned successfully!")
      setIsOpen(false)
      if (onAssigned) onAssigned()
    } catch  {
      toast.error("Error assigning PT package")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-gold-500 text-dark-900 hover:bg-gold-600 font-semibold gap-2 shadow-md"
      >
        <Plus className="w-4 h-4" />
        Assign PT
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-dark-800 border-dark-600 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Assign PT Package</DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 text-gold-500 animate-spin" /></div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200">Select Package *</label>
                <select 
                  required 
                  value={formData.pt_package_id}
                  onChange={e => setFormData({...formData, pt_package_id: e.target.value})}
                  className="w-full bg-dark-900 border border-dark-600 rounded-md p-2 text-white focus:border-gold-500 focus:outline-none"
                >
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.total_sessions} Sessions) - ₹{pkg.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200">Trainer Name *</label>
                <Input 
                  required 
                  placeholder="e.g. Coach Ahmed" 
                  value={formData.trainer_name}
                  onChange={e => setFormData({...formData, trainer_name: e.target.value})}
                  className="bg-dark-900 border-dark-600 focus:border-gold-500 text-white" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200">Start Date *</label>
                <Input 
                  required 
                  type="date" 
                  value={formData.start_date}
                  onChange={e => setFormData({...formData, start_date: e.target.value})}
                  className="bg-dark-900 border-dark-600 focus:border-gold-500 text-white" 
                />
              </div>
              
              <Button type="submit" disabled={isSubmitting} className="w-full bg-gold-500 text-dark-900 hover:bg-gold-600 font-bold mt-2">
                {isSubmitting ? "Assigning..." : "Confirm Assignment"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}