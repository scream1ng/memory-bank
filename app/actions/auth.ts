'use server'

import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { createSession, clearSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'

export async function signIn(formData: FormData) {
  const email = (formData.get('email') as string).toLowerCase().trim()
  const password = formData.get('password') as string

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) return { error: 'Invalid email or password' }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return { error: 'Invalid email or password' }

  await createSession(user.id, user.email)
  redirect('/')
}

export async function signUp(formData: FormData) {
  const email = (formData.get('email') as string).toLowerCase().trim()
  const password = formData.get('password') as string

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing) return { error: 'Email already registered' }

  const password_hash = await bcrypt.hash(password, 12)
  const [user] = await db.insert(users).values({ email, password_hash }).returning({ id: users.id, email: users.email })

  await createSession(user.id, user.email)
  redirect('/')
}

export async function signOut() {
  await clearSession()
  redirect('/login')
}
