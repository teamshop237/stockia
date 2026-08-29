import { supabase } from './supabase'
import type { Organization, OrganizationAdminSummary, Profile } from '../types/database'

export async function isPlatformAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_platform_admin')
  if (error) throw error
  return data === true
}

export async function listOrganizationsForAdmin(): Promise<OrganizationAdminSummary[]> {
  const { data, error } = await supabase.rpc('admin_list_organizations')
  if (error) throw error
  return data ?? []
}

export async function setOrganizationSuspended(id: string, suspended: boolean): Promise<void> {
  const { error } = await supabase.from('organizations').update({ suspended }).eq('id', id)
  if (error) throw error
}

export async function getOrganization(id: string): Promise<Organization> {
  const { data, error } = await supabase.from('organizations').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function listOrganizationMembers(organizationId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function countOrganizationProducts(organizationId: string): Promise<number> {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  if (error) throw error
  return count ?? 0
}
