"use client"

import { useState, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Edit2, Loader2, Upload, Fingerprint, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { updateMemberAction } from "@/app/(dashboard)/members/actions"
import { cn } from "@/lib/utils"

const editSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  dob: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  healthNotes: z.string().optional(),
  deviceUserId: z.string().optional(),
  bmi: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  split_timing: z.boolean().default(false),
  planId: z.string().optional(), // New field for plan edit
})

type EditFormValues = z.infer<typeof editSchema>

const generateFileName = (ext: string) => {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
}

export function EditMemberModal({ member }: { member: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(member.photo_url || null)
  
  const [plans, setPlans] = useState<any[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [planSearch, setPlanSearch] = useState("")
  
  const supabase = createClient()

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema) as any,
    defaultValues: {
      fullName: member.full_name || "",
      phone: member.phone ? (member.phone.length > 10 && member.phone.startsWith("91") ? member.phone.slice(-10) : member.phone) : "",
      email: member.email === "No email provided" ? "" : member.email || "",
      dob: member.dob === "Not specified" ? "" : member.dob || "",
      gender: member.gender === "Not specified" ? "male" : member.gender || "male",
      address: member.address === "No address provided" ? "" : member.address || "",
      emergencyContact: member.emergency_contact || "",
      healthNotes: member.health_notes === "None" ? "" : member.health_notes || "",
      deviceUserId: member.device_user_id || "",
      bmi: member.bmi ? member.bmi.toString() : "",
      weight: member.weight || "",
      height: member.height || "",
      split_timing: member.split_timing || false,
      planId: "", // Default empty, only send if they select one
    },
  })
  
  useEffect(() => {
    async function fetchPlans() {
      if (isOpen && plans.length === 0) {
        setIsLoadingPlans(true)
        const { data } = await supabase.from('membership_plans').select('*').eq('is_active', true).order('price', { ascending: true })
        if (data) setPlans(data)
        setIsLoadingPlans(false)
      }
    }
    fetchPlans()
  }, [isOpen, plans.length, supabase])

  const heightVal = useWatch({ control: form.control as any, name: "height" })
  const weightVal = useWatch({ control: form.control as any, name: "weight" })
  let calculatedBmi = form.getValues("bmi") || "0.00"
  if (heightVal && weightVal) {
    const h = parseFloat(heightVal) / 100 
    const w = parseFloat(weightVal)
    if (h > 0 && w > 0) {
      calculatedBmi = (w / (h * h)).toFixed(2)
      if (form.getValues("bmi") !== calculatedBmi) {
        form.setValue("bmi", calculatedBmi)
      }
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const onSubmit = async (values: EditFormValues) => {
    setIsSubmitting(true)
    
    try {
      let finalPhotoUrl = member.photo_url || ""

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = generateFileName(fileExt!)
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('member_photos')
          .upload(fileName, imageFile)

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('member_photos')
            .getPublicUrl(uploadData.path)
          finalPhotoUrl = publicUrlData.publicUrl
        }
      }

      const finalPayload = { ...values, photoUrl: finalPhotoUrl }
      const result = await updateMemberAction(member.id, finalPayload)
      
      if (result.success) {
        toast.success("Profile updated successfully!")
        setIsOpen(false)
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (error) {
      toast.error("Something went wrong while updating the profile.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedPlanId = useWatch({ control: form.control as any, name: "planId" })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium border border-border text-foreground hover:bg-muted hover:text-gold-500 w-full sm:w-auto rounded-xl transition-colors">
        <Edit2 className="w-4 h-4 mr-2" />
        Edit Profile
      </DialogTrigger>
      
      <DialogContent className="bg-background border border-border text-foreground w-[95vw] sm:w-full sm:max-w-3xl md:max-w-5xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 sm:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">        
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold tracking-tight">Edit Member Profile</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
            
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Left Column: Photo & Tech Info */}
              <div className="flex flex-col gap-6 w-full md:w-1/3">
                
                <label htmlFor="edit-photo-upload" className="flex items-center justify-center w-full aspect-square rounded-2xl bg-card border border-border border-dashed text-muted-foreground hover:text-gold-500 hover:border-gold-500/50 transition-colors cursor-pointer overflow-hidden relative group">
                  {imagePreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-8 h-8 text-foreground" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6" />
                      <span className="text-xs font-medium">Change Photo</span>
                    </div>
                  )}
                  <input type="file" id="edit-photo-upload" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>

                <div className="p-4 bg-card border border-border rounded-xl">
                  <FormField control={form.control as any} name="deviceUserId" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-2">
                        <Fingerprint className="w-4 h-4 text-green-500" />
                        <FormLabel className="text-foreground font-semibold">eSSL Face ID</FormLabel>
                      </div>
                      <FormControl>
                        <Input placeholder="e.g. 101" className="h-11 bg-background border-border text-foreground rounded-xl font-mono" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
                
                <div className="p-4 bg-card border border-border rounded-xl">
                  <FormField control={form.control as any} name="split_timing" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-foreground font-semibold">Split Timings</FormLabel>
                        <p className="text-xs text-muted-foreground">Allow &gt;1 checkin/day</p>
                      </div>
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={field.onChange} className="w-5 h-5 rounded border-border bg-background checked:bg-gold-500 text-gold-500" />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Right Column: Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full md:w-2/3">
                <FormField control={form.control as any} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel className="text-foreground">Full Name *</FormLabel>
                    <FormControl><Input className="h-11 bg-card border-border text-foreground rounded-xl" {...field} /></FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )} />
                
                <FormField control={form.control as any} name="phone" render={({ field }) => (
                  <FormItem><FormLabel className="text-foreground">Phone Number *</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-muted-foreground font-medium">+91</span>
                        <Input 
                          maxLength={10}
                          className="pl-11 h-11 bg-card border-border text-foreground rounded-xl" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control as any} name="email" render={({ field }) => (
                  <FormItem><FormLabel className="text-foreground">Email (Optional)</FormLabel>
                    <FormControl><Input className="h-11 bg-card border-border text-foreground rounded-xl" {...field} /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control as any} name="dob" render={({ field }) => (
                  <FormItem><FormLabel className="text-foreground">Date of Birth</FormLabel>
                    <FormControl><Input type="date" className="h-11 bg-card border-border text-foreground rounded-xl scheme-dark" {...field} /></FormControl>
                  </FormItem>
                )} />
                
                <FormField control={form.control as any} name="gender" render={({ field }) => (
                  <FormItem><FormLabel className="text-foreground">Gender</FormLabel>
                    <FormControl>
                      <select className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/50" {...field}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control as any} name="emergencyContact" render={({ field }) => (
                  <FormItem><FormLabel className="text-foreground">Emergency Contact</FormLabel>
                    <FormControl><Input className="h-11 bg-card border-border text-foreground rounded-xl" {...field} /></FormControl>
                  </FormItem>
                )} />
                
                <FormField control={form.control as any} name="height" render={({ field }) => (
                  <FormItem><FormLabel className="text-foreground">Height (cm)</FormLabel>
                    <FormControl><Input type="number" placeholder="175" className="h-11 bg-card border-border text-foreground rounded-xl" {...field} /></FormControl>
                  </FormItem>
                )} />
                
                <FormField control={form.control as any} name="weight" render={({ field }) => (
                  <FormItem><FormLabel className="text-foreground">Weight (kg)</FormLabel>
                    <FormControl><Input type="number" placeholder="70" className="h-11 bg-card border-border text-foreground rounded-xl" {...field} /></FormControl>
                  </FormItem>
                )} />

                <div className="sm:col-span-2">
                  <FormField control={form.control as any} name="address" render={({ field }) => (
                    <FormItem><FormLabel className="text-foreground">Address</FormLabel>
                      <FormControl><Input className="h-11 bg-card border-border text-foreground rounded-xl" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <div className="sm:col-span-2">
                  <FormField control={form.control as any} name="healthNotes" render={({ field }) => (
                    <FormItem><FormLabel className="text-foreground">Health Notes / Injuries</FormLabel>
                      <FormControl>
                        <textarea className="flex min-h-[80px] w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>
            </div>
            
            <div className="border-t border-border pt-6 mt-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Change Membership Plan (Optional)</h3>
              <p className="text-sm text-muted-foreground mb-4">Selecting a new plan here will update their current active membership and recalculate dues automatically. Leave blank to keep current plan.</p>
              
              <Input 
                placeholder="Search plans..." 
                value={planSearch} 
                onChange={e => setPlanSearch(e.target.value)} 
                className="max-w-sm h-11 bg-card border-border text-foreground rounded-xl mb-4"
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {isLoadingPlans ? (
                  <div className="col-span-full py-8 flex justify-center">
                    <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
                  </div>
                ) : plans.filter(p => p.name.toLowerCase().includes(planSearch.toLowerCase())).map((plan) => {
                  const isSelected = selectedPlanId === plan.id
                  return (
                    <div 
                      key={plan.id}
                      onClick={() => {
                         if (isSelected) form.setValue("planId", "")
                         else form.setValue("planId", plan.id)
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 relative",
                        isSelected 
                          ? "border-gold-500 bg-gold-500/5" 
                          : "border-border bg-card hover:border-muted-foreground/30"
                      )}
                    >
                      {isSelected && <div className="absolute top-0 right-0 p-1 bg-gold-500 rounded-bl-lg"><CheckCircle2 className="w-3 h-3 text-dark-950" /></div>}
                      <h4 className="font-bold text-foreground mb-1">{plan.name}</h4>
                      <div className="text-xl font-black text-gold-500">₹{plan.price}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <DialogFooter className="pt-6 mt-6 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground rounded-xl px-6 h-11" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-gold-500 hover:bg-gold-600 text-dark-950 font-bold rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.2)] px-8 h-11">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
