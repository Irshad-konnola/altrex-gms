// src/app/(dashboard)/pt/packages/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Dumbbell, Calendar, IndianRupee, Loader2 } from "lucide-react"
import { toast } from "sonner"

type PTPackage = {
  id: string
  name: string
  total_sessions: number
  price: number
  validity_days: number
  description: string
  is_active: boolean
}

export default function PTPackagesPage() {
  const [packages, setPackages] = useState<PTPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    total_sessions: "",
    price: "",
    validity_days: "",
    description: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/pt/packages')
      if (res.ok) {
        const data = await res.json()
        setPackages(data)
      }
    } catch  {
      toast.error("Failed to load packages")
    } finally {
      setLoading(false)
    }
  }

useEffect(() => {
    const loadData = async () => {
      await fetchPackages(); 
    }
    loadData();
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/pt/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error("Failed to create package")

      toast.success("PT Package created successfully!")
      setIsOpen(false)
      setFormData({ name: "", total_sessions: "", price: "", validity_days: "", description: "" })
      fetchPackages() // Refresh the list
    } catch  {
      toast.error("Error creating package")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-gold-500" />
            PT Packages
          </h1>
          <p className="text-dark-300 text-sm mt-1">Manage Personal Training pricing and bundles.</p>
        </div>
        
        {/* Trigger state manually, completely bypassing the TS error */}
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-gold-500 text-dark-900 hover:bg-gold-600 font-semibold gap-2 shadow-md shadow-gold-500/10"
        >
          <Plus className="w-4 h-4" />
          New Package
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-dark-800 border-dark-600 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create PT Package</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200">Package Name *</label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. 20 Sessions Elite" className="bg-dark-900 border-dark-600 focus:border-gold-500 text-white" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark-200">Total Sessions *</label>
                  <Input required type="number" value={formData.total_sessions} onChange={e => setFormData({...formData, total_sessions: e.target.value})} placeholder="e.g. 20" className="bg-dark-900 border-dark-600 focus:border-gold-500 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark-200">Validity (Days) *</label>
                  <Input required type="number" value={formData.validity_days} onChange={e => setFormData({...formData, validity_days: e.target.value})} placeholder="e.g. 90" className="bg-dark-900 border-dark-600 focus:border-gold-500 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200">Price (₹) *</label>
                <Input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="e.g. 5000" className="bg-dark-900 border-dark-600 focus:border-gold-500 text-white" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200">Description (Optional)</label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Includes diet plan..." className="bg-dark-900 border-dark-600 focus:border-gold-500 text-white" />
              </div>
              
              <Button type="submit" disabled={isSubmitting} className="w-full bg-gold-500 text-dark-900 hover:bg-gold-600 font-bold mt-2">
                {isSubmitting ? "Saving..." : "Create Package"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-gold-500 animate-spin" /></div>
      ) : packages.length === 0 ? (
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-12 text-center shadow-sm">
          <Dumbbell className="w-12 h-12 text-dark-400 mx-auto mb-3 opacity-20" />
          <h3 className="text-lg font-medium text-white mb-1">No PT Packages</h3>
          <p className="text-dark-400 text-sm">Create your first training package to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-dark-800 border border-dark-600 rounded-xl p-6 shadow-sm hover:border-gold-500/30 transition-colors flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${pkg.is_active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                  {pkg.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center text-dark-200 text-sm">
                  <Dumbbell className="w-4 h-4 mr-3 text-gold-500" />
                  {pkg.total_sessions} Sessions
                </div>
                <div className="flex items-center text-dark-200 text-sm">
                  <Calendar className="w-4 h-4 mr-3 text-gold-500" />
                  Valid for {pkg.validity_days} Days
                </div>
                {pkg.description && (
                  <p className="text-xs text-dark-400 mt-2 line-clamp-2">{pkg.description}</p>
                )}
              </div>
              
              <div className="pt-4 border-t border-dark-600/50 flex items-center justify-between">
                <div className="flex items-center text-white font-bold text-xl">
                  <IndianRupee className="w-5 h-5 mr-1 text-gold-500" />
                  {pkg.price.toLocaleString()}
                </div>
                <span className="text-xs text-dark-400 font-medium">₹{(pkg.price / pkg.total_sessions).toFixed(0)} / session</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}