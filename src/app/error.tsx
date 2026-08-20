"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Application Error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-card border border-border p-8 rounded-xl max-w-md w-full text-center shadow-2xl">
        <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong!</h2>
        <p className="text-muted-foreground text-sm mb-6">
          An unexpected error occurred. Please try refreshing the page or contact support if the issue persists.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => reset()} className="bg-primary text-primary-foreground">
            Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
