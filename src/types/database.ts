export type Organization = {
  id: string
  name: string
  created_at: string
}

export type Profile = {
  id: string
  organization_id: string
  full_name: string | null
  role: 'owner' | 'member'
  created_at: string
}
