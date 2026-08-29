export type Organization = {
  id: string
  name: string
  suspended: boolean
  created_at: string
}

export type OrganizationAdminSummary = {
  id: string
  name: string
  suspended: boolean
  created_at: string
  member_count: number
  product_count: number
}

export type Profile = {
  id: string
  organization_id: string
  full_name: string | null
  role: 'owner' | 'member'
  email: string | null
  created_at: string
}

export type Product = {
  id: string
  organization_id: string
  name: string
  reference: string | null
  quantity: number
  alert_threshold: number
  price: number
  category: string | null
  created_at: string
  updated_at: string
}

export type ProductInput = {
  name: string
  reference: string | null
  quantity: number
  alert_threshold: number
  price: number
  category: string | null
}

export type MovementType = 'in' | 'out'

export type StockMovement = {
  id: string
  organization_id: string
  product_id: string
  type: MovementType
  quantity: number
  note: string | null
  created_by: string | null
  created_at: string
}
