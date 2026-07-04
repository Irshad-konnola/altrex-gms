import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types' // We'll generate this later, it's fine if it red-lines for now

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}