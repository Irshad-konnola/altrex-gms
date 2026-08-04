// src/lib/whatsapp/client.ts

const WA_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`

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
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // Safety check: Bypass if no keys exist or if they are literal placeholder text
  if (!token || !phoneId || token === 'your_meta_access_token') {
    console.warn(`[WhatsApp Stub] 🛑 Bypassing Meta API. Would have sent '${templateName}' to ${to}`)
    return { success: true, stubbed: true }
  }

  // Meta requires the phone number without the '+' prefix or spaces
  const cleanPhone = to.replace(/\D/g, '')

  try {
    const response = await fetch(WA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
      console.error('❌ Meta API Error:', JSON.stringify(data, null, 2))
      throw new Error(data.error?.message || 'Failed to send WhatsApp message')
    }

    return { success: true, data }
  } catch (error) {
    console.error('❌ Failed to execute sendTemplateMessage:', error)
    throw error
  }
}