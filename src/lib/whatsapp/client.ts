// src/lib/whatsapp/client.ts

const WA_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`

interface TemplateComponent {
  type: string
  parameters: Array<{
    type: string
    text: string
  }>
}

interface SendTemplateParams {
  to: string
  templateName: string
  languageCode?: string
  components?: TemplateComponent[]
}

export async function sendTemplateMessage({
  to,
  templateName,
  languageCode = 'en',
  components = [],
}: SendTemplateParams) {
  if (
    !process.env.WHATSAPP_ACCESS_TOKEN || 
    !process.env.WHATSAPP_PHONE_ID ||
    process.env.WHATSAPP_ACCESS_TOKEN.includes('temp') ||
    process.env.WHATSAPP_ACCESS_TOKEN === 'your_meta_access_token'
  ) {
    console.warn(`[WhatsApp Stub] 🛑 Bypassing Meta API. Would have sent '${templateName}' to ${to}`)
    return { success: true, stubbed: true }
  }

  // Meta requires the phone number without the '+' prefix
  const cleanPhone = to.replace(/\D/g, '')

  try {
    const response = await fetch(WA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Meta API Error:', data)
      throw new Error(data.error?.message || 'Failed to send WhatsApp message')
    }

    return data
  } catch (error) {
    console.error('❌ Failed to execute sendTemplateMessage:', error)
    throw error
  }
}