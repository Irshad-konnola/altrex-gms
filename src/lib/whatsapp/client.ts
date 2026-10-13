// src/lib/whatsapp/client.ts

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
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID

  // Safety check: Bypass if no keys exist or if they are literal placeholder text
  if (!token || !phoneId || token === 'your_meta_access_token') {
    console.warn(`[WhatsApp Stub] 🛑 Bypassing Meta API. Keys missing or placeholder. Would have sent '${templateName}' to ${to}`)
    return { success: true, stubbed: true }
  }

  // Ensure clean international format (auto-prepend 91 if standard 10 digits given)
  let cleanPhone = to.replace(/\D/g, '')
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone
  }

  const WA_API_URL = `https://graph.facebook.com/v19.0/${phoneId}/messages`

  async function callMeta(lang: string) {
    return await fetch(WA_API_URL, {
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
          language: { code: lang },
          components,
        },
      }),
    })
  }

  try {
    let response = await callMeta(languageCode)
    let data = await response.json()

    // If template does not exist in 'en', auto-retry with 'en_US' (the default Meta UI language code)
    if (!response.ok && data.error?.code === 132000 && languageCode === 'en') {
      console.warn(`[WhatsApp] Template '${templateName}' not found in 'en'. Retrying with 'en_US'...`)
      response = await callMeta('en_US')
      data = await response.json()
    }

    if (!response.ok) {
      console.error('❌ Meta API Error:', JSON.stringify(data, null, 2))
      throw new Error(data.error?.message || 'Failed to send WhatsApp message')
    }

    console.log(`✅ WhatsApp template '${templateName}' successfully sent to ${cleanPhone}`)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Failed to execute sendTemplateMessage:', error)
    throw error
  }
}