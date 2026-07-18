// src/hooks/useAttendanceFeed.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Local type definition for strict TS
export interface AttendanceWithMember {
  id: string
  member_id: string
  check_in_at: string
  method: string
  members: {
    full_name: string
    photo_url: string | null
    status: string
  } | null
}

export function useAttendanceFeed() {
  const [feed, setFeed] = useState<AttendanceWithMember[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Load initial data for SSR/first paint (last 20 check-ins)
    supabase
      .from('attendance_logs')
      .select('*, members(full_name, photo_url, status)')
      .order('check_in_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setFeed((data as unknown as AttendanceWithMember[]) || []))

    // Subscribe to new insertions via Supabase Realtime
    const channel = supabase
      .channel('attendance-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_logs',
        },
        async (payload) => {
          // Fetch the member info for this new entry
          const { data: member } = await supabase
            .from('members')
            .select('full_name, photo_url, status')
            .eq('id', payload.new.member_id)
            .single()

          const newEntry = { 
            ...payload.new, 
            members: member 
          } as unknown as AttendanceWithMember
          
          // Add new entry to the top, keep list max 50 items
          setFeed((prev) => [newEntry, ...prev].slice(0, 50))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return feed
}