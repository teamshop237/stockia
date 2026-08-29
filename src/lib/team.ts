import { supabase } from './supabase'
import { invokeEdgeFunction } from './edgeFunctions'
import type { Profile } from '../types/database'

export async function listTeamMembers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function inviteMember(email: string, role: 'owner' | 'member'): Promise<void> {
  await invokeEdgeFunction<{ success?: boolean; error?: string }>('invite-member', {
    email,
    role,
  })
}

export async function removeMember(profileId: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', profileId)
  if (error) throw error
}
