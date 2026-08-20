// // src/hooks/useAttendanceFeed.ts
// import { useEffect, useState } from 'react'
// import { createClient } from '@/lib/supabase/client'

// // Local type definition for strict TS
// export interface AttendanceWithMember {
//   id: string
//   member_id: string
//   check_in_at: string
//   method: string
//   members: {
//     full_name: string
//     photo_url: string | null
//     status: string
//   } | null
// }

// export function useAttendanceFeed() {
//   const [feed, setFeed] = useState<AttendanceWithMember[]>([])
//   const supabase = createClient()

//   useEffect(() => {
//     // Load initial data for SSR/first paint (last 20 check-ins)
//     supabase
//       .from('attendance_logs')
//       .select('*, members(full_name, photo_url, status)')
//       .order('check_in_at', { ascending: false })
//       .limit(20)
//       .then(({ data }) => setFeed((data as unknown as AttendanceWithMember[]) || []))

//     // Subscribe to new insertions via Supabase Realtime
//     const channel = supabase
//       .channel('attendance-feed')
//       .on(
//         'postgres_changes',
//         {
//           event: 'INSERT',
//           schema: 'public',
//           table: 'attendance_logs',
//         },
//         async (payload) => {
//           // Fetch the member info for this new entry
//           const { data: member } = await supabase
//             .from('members')
//             .select('full_name, photo_url, status')
//             .eq('id', payload.new.member_id)
//             .single()

//           const newEntry = { 
//             ...payload.new, 
//             members: member 
//           } as unknown as AttendanceWithMember
          
//           // Add new entry to the top, keep list max 50 items
//           setFeed((prev) => [newEntry, ...prev].slice(0, 50))
//         }
//       )
//       .subscribe()

//     return () => { supabase.removeChannel(channel) }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   return feed
// }

// src/hooks/useAttendanceFeed.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type LiveAttendance = {
  id: string
  member_id: string
  check_in_at: string
  method: string
  members: {
    full_name: string
    photo_url: string | null
    status: string
  }
}

export function useAttendanceFeed() {
  const [feed, setFeed] = useState<LiveAttendance[]>([])
  const supabase = createClient()

  useEffect(() => {
    // 1. Fetch the initial load of recent check-ins
    const fetchInitial = async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data, error } = await supabase
        .from('attendance_logs')
        .select(`
          id, member_id, check_in_at, method,
          members (full_name, photo_url, status)
        `)
        .gte('check_in_at', today.toISOString())
        .order('check_in_at', { ascending: false })
        .limit(30)

      if (error) {
        console.error("Supabase Read Error (Attendance):", error.message)
        return
      }

      if (data) {
        setFeed(data as unknown as LiveAttendance[])
      }
    }

    fetchInitial()

    // 2. Subscribe to live inserts from the eSSL machine
    const channel = supabase
      .channel('live-attendance')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance_logs' },
        async (payload) => {
          console.log("🟢 Realtime Ping Received!", payload)
          
          const { data: member } = await supabase
            .from('members')
            .select('full_name, photo_url, status')
            .eq('id', payload.new.member_id)
            .single()

          if (member) {
            const newEntry = {
              ...payload.new,
              members: member,
            } as unknown as LiveAttendance

            setFeed((current) => [newEntry, ...current].slice(0, 30))
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("🟢 Connected to Supabase Realtime")
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return feed
}