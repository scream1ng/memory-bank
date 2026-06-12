import { NextResponse, type NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')

  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
