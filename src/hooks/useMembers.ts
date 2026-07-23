// src/hooks/useMembers.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type Member = {
  id: string
  full_name: string
  phone: string
  status: string
  photo_url?: string | null
}

export function useMembers() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, phone, status, photo_url')
        .order('full_name', { ascending: true })

      if (error) {
        console.error('Supabase fetch error:', error)
        throw new Error('Failed to fetch members')
      }

      return data as Member[]
    }
  })
}