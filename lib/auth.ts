import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!)
const COOKIE = 'session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export type Session = { userId: string; email: string }

export async function createSession(userId: string, email: string) {
  const token = await new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  return verifyToken(store.get(COOKIE)?.value)
}

export async function clearSession() {
  const store = await cookies()
  store.delete(COOKIE)
}

// Used in proxy.ts where cookies() is unavailable — reads directly from request
export async function getSessionFromRequest(req: NextRequest): Promise<Session | null> {
  return verifyToken(req.cookies.get(COOKIE)?.value)
}

async function verifyToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return { userId: payload.sub as string, email: payload.email as string }
  } catch {
    return null
  }
}
