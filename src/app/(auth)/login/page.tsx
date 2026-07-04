"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Dumbbell, ShieldCheck, Zap, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<"owner" | "front_desk">("owner")

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      toast.error(error.message)
      setIsLoading(false)
      return
    }

    const userRole = data.user?.user_metadata?.role
    if (userRole !== role) {
      toast.info(`Logged in as ${userRole === 'owner' ? 'Owner' : 'Front Desk'}`)
    } else {
      toast.success("Login successful!")
    }

    router.refresh()
    if (userRole === "owner") {
      router.push("/dashboard")
    } else {
      router.push("/attendance")
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-dark-900 text-dark-50">
      
      {/* Left Panel - Premium Branding */}
      <div className="hidden lg:flex w-1/2 bg-dark-950 border-r border-dark-800 flex-col justify-between p-16 relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-gold-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-gold-500/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="bg-gradient-to-b from-gold-300 to-gold-500 p-2.5 rounded-xl shadow-lg shadow-gold-500/20">
              <Dumbbell className="w-6 h-6 text-dark-950" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Altrex GMS</span>
          </div>
          
          <h1 className="text-5xl font-bold leading-tight mb-6 tracking-tight">
            Manage your gym with <br />
            {/* Native Tailwind Text Gradient */}
            <span className="bg-gradient-to-br from-gold-300 via-gold-500 to-gold-600 bg-clip-text text-transparent drop-shadow-sm">
              absolute precision.
            </span>
          </h1>
          <p className="text-dark-300 text-lg max-w-md leading-relaxed">
            The complete, AI-assisted operating system built exclusively for Altrex Fitness.
          </p>
        </div>

        <div className="space-y-8 relative z-10">
          <div className="flex items-center gap-5">
            <div className="bg-dark-900 border border-dark-800 p-4 rounded-2xl text-gold-500 shadow-lg shadow-black/50">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">Real-time Check-ins</h3>
              <p className="text-dark-300">Live eSSL face recognition feed.</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="bg-dark-900 border border-dark-800 p-4 rounded-2xl text-gold-500 shadow-lg shadow-black/50">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">Automated Renewals</h3>
              <p className="text-dark-300">WhatsApp reminders & Razorpay links.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[420px] space-y-10">
          
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-4xl font-bold tracking-tight text-white">Sign In</h2>
            <p className="text-dark-300 text-lg">Select your role to securely access the system.</p>
          </div>

          <div className="space-y-8">
            {/* Custom Premium Role Selector */}
            <div className="relative flex p-1.5 bg-dark-950 border border-dark-800 rounded-2xl shadow-inner">
              <button
                type="button"
                onClick={() => setRole("owner")}
                className={cn(
                  "flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 z-10",
                  role === "owner" ? "text-dark-950" : "text-dark-400 hover:text-white"
                )}
              >
                Gym Owner
              </button>
              <button
                type="button"
                onClick={() => setRole("front_desk")}
                className={cn(
                  "flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 z-10",
                  role === "front_desk" ? "text-dark-950" : "text-dark-400 hover:text-white"
                )}
              >
                Front Desk
              </button>
              
              {/* Sliding Gold Pill with Native Tailwind Gradients */}
              <div 
                className={cn(
                  "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gradient-to-b from-gold-400 to-gold-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] border border-gold-300/50 rounded-xl transition-transform duration-300 ease-out",
                  role === "owner" ? "translate-x-0" : "translate-x-[calc(100%+0px)]"
                )} 
              />
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-dark-200 font-medium ml-1">Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="admin@altrex.com" 
                          className="h-12 bg-dark-950 border-dark-800 text-white focus-visible:ring-gold-500/50 focus-visible:border-gold-500 placeholder:text-dark-600 rounded-xl px-4 text-base transition-all" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 ml-1" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-dark-200 font-medium ml-1">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="h-12 bg-dark-950 border-dark-800 text-white focus-visible:ring-gold-500/50 focus-visible:border-gold-500 placeholder:text-dark-600 rounded-xl px-4 text-base transition-all" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 ml-1" />
                    </FormItem>
                  )}
                />

                {/* Submit Button with Native Tailwind Gradients */}
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-12 mt-4 bg-gradient-to-b from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 text-dark-950 shadow-[0_0_20px_rgba(234,179,8,0.25)] border border-gold-300/50 font-bold text-base rounded-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `Sign in as ${role === 'owner' ? 'Owner' : 'Front Desk'} →`
                  )}
                </Button>
              </form>
            </Form>
          </div>

        </div>
      </div>
    </div>
  )
}