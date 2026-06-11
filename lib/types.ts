export type Subject = {
  id: string
  name: string
  created_at: string
}

export type Project = {
  id: string
  name: string
  subject_id: string | null
  archived_at: string | null
  pinned_at: string | null
  created_at: string
}

export type MemoBlock = {
  id: string
  project_id: string
  type: 'text' | 'photo'
  content: string
  position: number
  created_at: string
}
