// src/components/payments/RazorpayLinkModal.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, MessageCircle, ExternalLink } from 'lucide-react'
import { useState } from 'react'

interface RazorpayLinkModalProps {
  isOpen: boolean
  onClose: () => void
  paymentUrl: string
  memberPhone?: string
}

export function RazorpayLinkModal({ isOpen, onClose, paymentUrl, memberPhone }: RazorpayLinkModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    if (!memberPhone) return
    const cleanPhone = memberPhone.replace(/\D/g, '') // strip everything except numbers
    const message = encodeURIComponent(`Hi! Here is your payment link for Altrex Fitness: ${paymentUrl}`)
    window.open(`https://wa.me/91${cleanPhone}?text=${message}`, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-dark-800 border-dark-600 sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Payment Link Ready</DialogTitle>
          <DialogDescription className="text-dark-400">
            Scan the QR code or send the link to the member.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <QRCodeSVG 
              value={paymentUrl} 
              size={200}
              bgColor={"#ffffff"}
              fgColor={"#0D0D0D"}
              level={"H"}
            />
          </div>

          <div className="flex items-center gap-2 w-full max-w-sm">
            <div className="flex-1 bg-dark-900 border border-dark-600 rounded-md px-3 py-2 text-sm text-dark-200 truncate overflow-hidden">
              {paymentUrl}
            </div>
            <Button variant="outline" size="icon" onClick={handleCopy} className="border-dark-600 bg-dark-700 hover:bg-dark-600 hover:text-white shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-dark-300" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-2">
          <Button 
            variant="outline" 
            className="border-dark-600 bg-dark-800 text-white hover:bg-dark-700"
            onClick={() => window.open(paymentUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Link
          </Button>
          <Button 
            className="bg-[#25D366] text-white hover:bg-[#1EBE5A] font-medium"
            onClick={handleWhatsApp}
            disabled={!memberPhone}
          >
            <MessageCircle className="h-4 w-4 mr-2" fill="currentColor" />
            WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}