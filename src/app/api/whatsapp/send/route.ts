// src/app/api/whatsapp/send/route.ts
import { NextResponse } from 'next/server'
import { sendTemplateMessage } from '@/lib/whatsapp/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, templateName, components } = body

    if (!to || !templateName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await sendTemplateMessage({ to, templateName, components })
    
    return NextResponse.json({ success: true, result })
  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}