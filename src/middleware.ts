import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const OWNER_ONLY_PATHS = [
  '/dashboard',
  '/reports',
  '/whatsapp',
  '/settings',
  '/device',
  '/pt/packages',
]

// Initialize Rate Limiter if Upstash is configured
const redis = process.env.UPSTASH_REDIS_REST_URL ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}) : null;

const apiLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
}) : null;

export async function middleware(request: NextRequest) {
  // Rate Limit specific sensitive API routes
  if (request.nextUrl.pathname.startsWith('/api/whatsapp') || request.nextUrl.pathname.startsWith('/api/payments/create-link')) {
    if (apiLimiter) {
      const ip = request.ip ?? '127.0.0.1'
      const { success, limit, remaining, reset } = await apiLimiter.limit(ip)
      if (!success) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        })
      }
    }
  }

  // Bypass Auth for Webhooks and Cron
  if (
    request.nextUrl.pathname.startsWith('/api/cron') ||
    request.nextUrl.pathname.startsWith('/api/payments/webhook') ||
    request.nextUrl.pathname.startsWith('/api/whatsapp/webhook') ||
    request.nextUrl.pathname.startsWith('/api/device/checkin')
  ) {
    return NextResponse.next()
  }
  
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isAuthPath = request.nextUrl.pathname === '/login'

  if (!user && !isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPath) {
    const role = user.user_metadata?.role
    const url = request.nextUrl.clone()
    url.pathname = role === 'owner' ? '/dashboard' : '/attendance'
    return NextResponse.redirect(url)
  }

  if (user) {
    const role = user.user_metadata?.role

    const isOwnerPath = OWNER_ONLY_PATHS.some(path => request.nextUrl.pathname.startsWith(path))
    if (isOwnerPath && role !== 'owner') {
      const url = request.nextUrl.clone()
      url.pathname = '/attendance'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

