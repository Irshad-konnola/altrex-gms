/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element, @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Edit2, Loader2, Fingerprint, Upload, Activity } from "lucide-react"
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
})

type EditFormValues = z.infer<typeof editSchema>

const generateFileName = (ext: string) => {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
}

export function EditMemberModal({ member }: { member: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // New Image States
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(member.photo_url || null)
  
  const supabase = createClient()

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: member.full_name || "",
      phone: member.phone || "",
      email: member.email === "No email provided" ? "" : member.email || "",
      dob: member.dob === "Not specified" ? "" : member.dob || "",
      gender: member.gender === "Not specified" ? "male" : member.gender || "male",
      address: member.address === "No address provided" ? "" : member.address || "",
      emergencyContact: member.emergency_contact || "",
      healthNotes: member.health_notes === "None" ? "" : member.health_notes || "",
      deviceUserId: member.device_user_id || "",
      bmi: member.bmi ? member.bmi.toString() : "",
    },
  })

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

      // Upload new image if selected
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex items-center justify-center h-11 px-6 py-2 text-sm font-medium border border-dark-700 text-white hover:bg-dark-800 w-full sm:w-auto rounded-xl transition-colors">
        <Edit2 className="w-4 h-4 mr-2" />
        Edit Profile
      </DialogTrigger>
      
      {/* FIXED: 
        1. max-w-4xl for even wider layout
        2. Hidden scrollbar using custom classes: [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
      */}
<DialogContent className="bg-dark-950 border border-dark-800 text-white w-[95vw] sm:w-full sm:max-w-3xl md:max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 sm:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">        
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold tracking-tight">Edit Member Profile</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Left Column: Photo & Tech Info */}
              <div className="flex flex-col gap-6 w-full md:w-1/3">
                
                <label htmlFor="edit-photo-upload" className="flex items-center justify-center w-full aspect-square rounded-2xl bg-dark-900 border border-dark-700 border-dashed text-dark-400 hover:text-gold-500 hover:border-gold-500/50 transition-colors cursor-pointer overflow-hidden relative group">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-8 h-8 text-white" />
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

                <div className="p-4 bg-dark-900 border border-dark-700 rounded-xl">
                  <FormField control={form.control} name="deviceUserId" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-2">
                        <Fingerprint className="w-4 h-4 text-green-500" />
                        <FormLabel className="text-white font-semibold">eSSL Face ID</FormLabel>
                      </div>
                      <FormControl>
                        <Input placeholder="e.g. 101" className="h-11 bg-dark-950 border-dark-600 text-white rounded-xl font-mono" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>

                <div className="p-4 bg-dark-900 border border-dark-700 rounded-xl">
                  <FormField control={form.control} name="bmi" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-gold-500" />
                        <FormLabel className="text-white font-semibold">BMI</FormLabel>
                      </div>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g. 24.5" className="h-11 bg-dark-950 border-dark-600 text-white rounded-xl" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Right Column: Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full md:w-2/3">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel className="text-dark-200">Full Name *</FormLabel>
                    <FormControl><Input className="h-11 bg-dark-900 border-dark-700 text-white rounded-xl" {...field} /></FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel className="text-dark-200">Phone Number *</FormLabel>
                    <FormControl><Input className="h-11 bg-dark-900 border-dark-700 text-white rounded-xl" {...field} /></FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel className="text-dark-200">Email (Optional)</FormLabel>
                    <FormControl><Input className="h-11 bg-dark-900 border-dark-700 text-white rounded-xl" {...field} /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="dob" render={({ field }) => (
                  <FormItem><FormLabel className="text-dark-200">Date of Birth</FormLabel>
                    <FormControl><Input type="date" className="h-11 bg-dark-900 border-dark-700 text-white rounded-xl scheme-dark" {...field} /></FormControl>
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem><FormLabel className="text-dark-200">Gender</FormLabel>
                    <FormControl>
                      <select className="flex h-11 w-full items-center justify-between rounded-xl border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50" {...field}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="emergencyContact" render={({ field }) => (
                  <FormItem><FormLabel className="text-dark-200">Emergency Contact</FormLabel>
                    <FormControl><Input className="h-11 bg-dark-900 border-dark-700 text-white rounded-xl" {...field} /></FormControl>
                  </FormItem>
                )} />

                <div className="sm:col-span-2">
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel className="text-dark-200">Address</FormLabel>
                      <FormControl><Input className="h-11 bg-dark-900 border-dark-700 text-white rounded-xl" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <div className="sm:col-span-2">
                  <FormField control={form.control} name="healthNotes" render={({ field }) => (
                    <FormItem><FormLabel className="text-dark-200">Health Notes / Injuries</FormLabel>
                      <FormControl>
                        <textarea className="flex min-h-[120px] w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-sm text-white placeholder:text-dark-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6 mt-6 border-t border-dark-800">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="text-dark-300 hover:text-white rounded-xl px-6 h-11" disabled={isSubmitting}>
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