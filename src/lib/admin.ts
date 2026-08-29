import { supabase } from './supabase'
import type { Organization, OrganizationAdminSummary, Product, Profile } from '../types/database'

export type PlatformAdmin = {
  id: string
  email: string | null
  created_at: string
}

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

export async function listOrganizationProducts(organizationId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function deleteOrganization(id: string): Promise<void> {
  const { error } = await supabase.from('organizations').delete().eq('id', id)
  if (error) throw error
}

export async function renameOrganization(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('organizations').update({ name }).eq('id', id)
  if (error) throw error
}

export async function listPlatformAdmins(): Promise<PlatformAdmin[]> {
  const { data, error } = await supabase.rpc('admin_list_platform_admins')
  if (error) throw error
  return data ?? []
}

export async function addPlatformAdmin(email: string): Promise<void> {
  const { error } = await supabase.rpc('admin_add_platform_admin', { target_email: email })
  if (error) throw error
}

export async function removePlatformAdmin(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_remove_platform_admin', { target_id: id })
  if (error) throw error
}
