import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session on every request (required by @supabase/ssr)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes — always allowed
  const publicRoutes = ['/login', '/auth/callback']
  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    return supabaseResponse
  }

  // Unauthenticated → login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Onboarding page itself is fine for authenticated users
  if (pathname === '/onboarding') {
    return supabaseResponse
  }

  // Check whether this user has a completed client record.
  // If not (no record at all, or record with no onboarding_completed_at),
  // send them to onboarding.
  const { data: client } = await supabase
    .from('clients')
    .select('onboarding_completed_at')
    .eq('user_id', user.id)
    .single()

  if (!client || !client.onboarding_completed_at) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
