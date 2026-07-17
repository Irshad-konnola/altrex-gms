/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars, react-hooks/incompatible-library */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { User, Dumbbell, CreditCard, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Upload, Activity } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { createMemberAction } from "@/app/(dashboard)/members/actions"

// Mock Plans (Will be fetched from DB later)
const MOCK_PLANS = [
  { id: "11111111-1111-1111-1111-111111111111", name: "1-Month Basic", price: 1500, duration: 30 },
  { id: "22222222-2222-2222-2222-222222222222", name: "3-Month Premium", price: 4000, duration: 90 },
  { id: "33333333-3333-3333-3333-333333333333", name: "Annual Pass", price: 12000, duration: 365 },
]

// 1. Zod Validation Schema
const memberSchema = z.object({
  // Step 1: Personal
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  dob: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  healthNotes: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  
  // Step 2: Plan
  planId: z.string().min(1, "Please select a plan"),
  startDate: z.string().min(1, "Start date is required"),
  
  // Step 3: Payment
  paymentMethod: z.string().min(1, "Select a payment method"),
  amount: z.string().min(1, "Amount is required"),
  reference: z.string().optional(),
  sendWelcomeMsg: z.boolean(),
})

type FormValues = z.infer<typeof memberSchema>

const STEPS = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Membership", icon: Dumbbell },
  { id: 3, title: "Payment", icon: CreditCard },
]

export function AddMemberForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const supabase = createClient() 
  
  const form = useForm<FormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      fullName: "", phone: "", email: "", dob: "", gender: "male", address: "", emergencyContact: "", healthNotes: "",
      height: "", weight: "",
      planId: "", startDate: new Date().toISOString().split("T")[0],
      paymentMethod: "upi", amount: "", reference: "", sendWelcomeMsg: true,
    },
  })

  // Watch height and weight to auto-calculate BMI
  const heightVal = form.watch("height")
  const weightVal = form.watch("weight")
  
  let calculatedBmi = "0.00"
  if (heightVal && weightVal) {
    const h = parseFloat(heightVal) / 100 // convert cm to meters
    const w = parseFloat(weightVal)
    if (h > 0 && w > 0) {
      calculatedBmi = (w / (h * h)).toFixed(2)
    }
  }

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Handle Plan Selection to auto-fill amount
  const handlePlanSelect = (planId: string, price: number) => {
    form.setValue("planId", planId)
    form.setValue("amount", price.toString())
    form.clearErrors("planId")
  }

  // Next Step with Validation
  const handleNext = async () => {
    let fieldsToValidate: (keyof FormValues)[] = []
    if (step === 1) fieldsToValidate = ["fullName", "phone", "email"]
    if (step === 2) fieldsToValidate = ["planId", "startDate"]

    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) setStep(step + 1)
  }

  // Final Submit
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    
    try {
      let photoUrl = ""

      // 1. Handle the Supabase Image Upload First
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('member_photos')
          .upload(fileName, imageFile)

        if (uploadError) {
          toast.error("Failed to upload photo. Proceeding without it.")
          console.error(uploadError)
        } else if (uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('member_photos')
            .getPublicUrl(uploadData.path)
            
          photoUrl = publicUrlData.publicUrl
        }
      }

      // 2. Attach our calculated variables to the form payload
      const finalValues = {
        ...values,
        photoUrl: photoUrl || undefined,
        bmi: calculatedBmi !== "0.00" ? calculatedBmi : undefined,
      }

      // 3. Send to Server Action
      const result = await createMemberAction(finalValues)
      
      if (result.success) {
        toast.success("Member added successfully!")
        router.push("/members")
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (error) {
      toast.error("Something went wrong while adding the member.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-dark-950 border border-dark-800 rounded-2xl p-4 sm:p-8 shadow-xl">
      
      {/* Step Indicator */}
      <div className="flex items-center justify-between sm:justify-start sm:gap-8 mb-8 sm:mb-12 relative">
        <div className="hidden sm:block absolute top-1/2 left-0 w-full h-0.5 bg-dark-800 -z-10 -translate-y-1/2" />
        {STEPS.map((s) => {
          const isActive = step === s.id
          const isCompleted = step > s.id
          
          return (
            <div key={s.id} className="flex flex-col items-center gap-2 bg-dark-950 sm:px-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                isActive ? "border-gold-500 bg-gold-500/10 text-gold-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]" :
                isCompleted ? "border-gold-500 bg-gold-500 text-dark-950" :
                "border-dark-700 bg-dark-900 text-dark-400"
              )}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
              </div>
              <span className={cn(
                "text-xs sm:text-sm font-semibold tracking-wide",
                isActive || isCompleted ? "text-white" : "text-dark-400"
              )}>
                {s.title}
              </span>
            </div>
          )
        })}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* STEP 1: PERSONAL INFO */}
          <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-500", step !== 1 && "hidden")}>
            
            {/* NEW: Photo Upload UI */}
            <label htmlFor="photo-upload" className="flex items-center justify-center w-full sm:w-32 h-32 rounded-2xl bg-dark-900 border border-dark-700 border-dashed text-dark-400 hover:text-gold-500 hover:border-gold-500/50 transition-colors cursor-pointer mb-6 mx-auto sm:mx-0 overflow-hidden relative">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-medium">Upload Photo</span>
                </div>
              )}
              <input type="file" id="photo-upload" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel className="text-dark-200">Full Name *</FormLabel>
                  <FormControl><Input placeholder="John Doe" className="h-12 bg-dark-900 border-dark-700 text-white rounded-xl" {...field} /></FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel className="text-dark-200">Phone Number *</FormLabel>
                  <FormControl><Input placeholder="+91 9876543210" className="h-12 bg-dark-900 border-dark-700 text-white rounded-xl" {...field} /></FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel className="text-dark-200">Email (Optional)</FormLabel>
                  <FormControl><Input placeholder="john@example.com" className="h-12 bg-dark-900 border-dark-700 text-white rounded-xl" {...field} /></FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )} />

              <FormField control={form.control} name="dob" render={({ field }) => (
                <FormItem><FormLabel className="text-dark-200">Date of Birth</FormLabel>
                  <FormControl><Input type="date" className="h-12 bg-dark-900 border-dark-700 text-white rounded-xl scheme-dark" {...field} /></FormControl>
                </FormItem>
              )} />
              
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem><FormLabel className="text-dark-200">Gender</FormLabel>
                  <FormControl>
                    <select className="flex h-12 w-full items-center justify-between rounded-xl border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50" {...field}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="emergencyContact" render={({ field }) => (
                <FormItem><FormLabel className="text-dark-200">Emergency Contact (Phone)</FormLabel>
                  <FormControl><Input placeholder="Relative's phone number" className="h-12 bg-dark-900 border-dark-700 text-white rounded-xl" {...field} /></FormControl>
                </FormItem>
              )} />

              {/* NEW: BMI Section */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-dark-900/50 border border-dark-800 rounded-xl">
                <FormField control={form.control} name="height" render={({ field }) => (
                  <FormItem><FormLabel className="text-dark-200">Height (cm)</FormLabel>
                    <FormControl><Input type="number" placeholder="175" className="h-12 bg-dark-950 border-dark-700 text-white rounded-xl" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="weight" render={({ field }) => (
                  <FormItem><FormLabel className="text-dark-200">Weight (kg)</FormLabel>
                    <FormControl><Input type="number" placeholder="70" className="h-12 bg-dark-950 border-dark-700 text-white rounded-xl" {...field} /></FormControl>
                  </FormItem>
                )} />
                <div className="flex flex-col space-y-2 justify-end">
                  <FormLabel className="text-dark-200 flex items-center gap-2"><Activity className="w-4 h-4 text-gold-500" /> Auto BMI</FormLabel>
                  <div className="h-12 bg-dark-950 border border-dark-700 rounded-xl flex items-center px-4 text-gold-500 font-bold text-lg">
                    {calculatedBmi}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <FormField control={form.control} name="healthNotes" render={({ field }) => (
                  <FormItem><FormLabel className="text-dark-200">Health Notes / Injuries</FormLabel>
                    <FormControl>
                      <textarea placeholder="Any medical conditions we should know about..." className="flex min-h-25 w-full rounded-xl border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white placeholder:text-dark-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50" {...field} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
            </div>
          </div>

          {/* STEP 2: MEMBERSHIP PLAN */}
          <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-500", step !== 2 && "hidden")}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                // 1. Extract the watch call outside the map loop to satisfy React Compiler
                const selectedPlanId = form.watch("planId")
                
                // 2. Return the mapped array
                return MOCK_PLANS.map((plan) => {
                  const isSelected = selectedPlanId === plan.id
                  
                  return (
                    <div 
                      key={plan.id}
                      onClick={() => handlePlanSelect(plan.id, plan.price)}
                      className={cn(
                        "p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden",
                        isSelected 
                          ? "border-gold-500 bg-gold-500/5 shadow-[0_0_20px_rgba(234,179,8,0.1)]" 
                          : "border-dark-800 bg-dark-900 hover:border-dark-600 hover:bg-dark-800"
                      )}
                    >
                      {isSelected && <div className="absolute top-0 right-0 p-1.5 bg-gold-500 rounded-bl-xl"><CheckCircle2 className="w-4 h-4 text-dark-950" /></div>}
                      <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                      <div className="text-3xl font-black text-gold-500 mb-4">₹{plan.price}</div>
                      <p className="text-sm text-dark-300 font-medium">Valid for {plan.duration} days</p>
                    </div>
                  )
                })
              })()} 
            </div>
            {form.formState.errors.planId && <p className="text-red-400 text-sm font-medium">{form.formState.errors.planId.message}</p>}

            <div className="mt-8 max-w-sm">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem><FormLabel className="text-dark-200">Start Date</FormLabel>
                  <FormControl><Input type="date" className="h-12 bg-dark-900 border-dark-700 text-white rounded-xl scheme-dark" {...field} /></FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )} />
            </div>
          </div>

          {/* STEP 3: PAYMENT */}
          <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-500", step !== 3 && "hidden")}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                <FormItem><FormLabel className="text-dark-200">Payment Method</FormLabel>
                  <FormControl>
                    <select className="flex h-12 w-full items-center justify-between rounded-xl border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50" {...field}>
                      <option value="upi">UPI (GPay, PhonePe)</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card / POS</option>
                      <option value="razorpay">Generate Razorpay Link</option>
                    </select>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )} />

              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel className="text-dark-200">Amount Received (₹)</FormLabel>
                  <FormControl><Input type="number" placeholder="0" className="h-12 bg-dark-900 border-dark-700 rounded-xl text-lg font-bold text-gold-500" {...field} /></FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )} />

              <div className="md:col-span-2">
                <FormField control={form.control} name="reference" render={({ field }) => (
                  <FormItem><FormLabel className="text-dark-200">Reference Number (UTR / Receipt ID)</FormLabel>
                    <FormControl><Input placeholder="Optional" className="h-12 bg-dark-900 border-dark-700 text-white rounded-xl" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </div>

            <div className="pt-6 border-t border-dark-800">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" {...form.register("sendWelcomeMsg")} className="w-5 h-5 rounded border-dark-700 bg-dark-900 checked:bg-gold-500 checked:border-gold-500 text-gold-500 focus:ring-gold-500/50 focus:ring-offset-dark-950" />
                <div className="flex flex-col">
                  <span className="text-white font-medium group-hover:text-gold-500 transition-colors">Send WhatsApp Welcome Message</span>
                  <span className="text-xs text-dark-400">Includes login details and membership receipt.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Form Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-dark-800">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setStep(step - 1)}
              disabled={step === 1 || isSubmitting}
              className="text-dark-300 hover:text-white hover:bg-dark-800 rounded-xl px-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            
            {step < 3 ? (
              <Button 
                type="button" 
                onClick={handleNext}
                className="bg-gold-500 hover:bg-gold-600 text-dark-950 font-bold rounded-xl px-8 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
              >
                Next Step <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-linear-to-r from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 text-dark-950 font-bold rounded-xl px-8 shadow-[0_0_20px_rgba(234,179,8,0.3)] border border-gold-300/50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
              </Button>
            )}
          </div>

        </form>
      </Form>
    </div>
  )
}