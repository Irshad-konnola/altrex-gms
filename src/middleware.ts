import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const OWNER_ONLY_PATHS = [
  '/dashboard',
  '/reports',
  '/whatsapp',
  '/settings',
  '/device',
  '/pt/packages',
]

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isProtectedPath = request.nextUrl.pathname !== '/' && !isAuthPage && !request.nextUrl.pathname.startsWith('/api/device')

  // 1. If not logged in and trying to access a protected route, redirect to login
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. If logged in and trying to hit the login page, redirect to their home
  if (user && isAuthPage) {
    const role = user.user_metadata?.role
    const url = request.nextUrl.clone()
    url.pathname = role === 'owner' ? '/dashboard' : '/attendance'
    return NextResponse.redirect(url)
  }

  // 3. Role-based access control (RBAC)
  if (user && isProtectedPath) {
    const role = user.user_metadata?.role
    
    // Check if a front_desk user is trying to access an owner-only path
    const isOwnerPath = OWNER_ONLY_PATHS.some(path => request.nextUrl.pathname.startsWith(path))
    
    if (role === 'front_desk' && isOwnerPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/attendance' // Redirect unauthorized front desk to attendance
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}