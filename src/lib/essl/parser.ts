// src/lib/essl/parser.ts

export interface ESSLRawPayload {
  SN: string
  DATA: string
}

export function parseESSLPayload(body: ESSLRawPayload) {
  // ADMS data format: USER_ID DATE TIME STATUS VERIFY_MODE WORK_CODE
  // Example: "245 2026-07-25 07:32:14 0 15 1"
  const parts = body.DATA.trim().split(/\s+/) 
  
  const verifyMap: Record<string, string> = {
    '15': 'face',
    '1': 'fingerprint', 
    '4': 'card',
    '20': 'face', // Some newer Orcus models use 20 for face+temp
  }

  return {
    deviceSerial: body.SN,
    deviceUserId: parts[0],
    // Combine date and time, assuming IST for Malappuram, Kerala
    datetime: new Date(`${parts[1]}T${parts[2]}+05:30`),
    method: verifyMap[parts[4]] || 'face',
  }
}