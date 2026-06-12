import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getPresignedPutUrl } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, filename, contentType } = await req.json()
  if (!projectId || !filename || !contentType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const path = `${session.userId}/${projectId}/${filename}`
  const url = await getPresignedPutUrl(path, contentType)

  return NextResponse.json({ url, path })
}
