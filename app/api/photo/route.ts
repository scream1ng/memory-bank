import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getPresignedGetUrl } from '@/lib/storage'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const path = req.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  // Ensure the path belongs to the requesting user
  if (!path.startsWith(`${session.userId}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = await getPresignedGetUrl(path)
  return NextResponse.json({ url })
}
