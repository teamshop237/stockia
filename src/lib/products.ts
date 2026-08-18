import { supabase } from './supabase'
import type { Product, ProductInput } from '../types/database'

function sanitizeSearchTerm(term: string) {
  return term.trim().replace(/[,()%]/g, '')
}

export async function listProducts(search: string): Promise<Product[]> {
  let query = supabase.from('products').select('*').order('name', { ascending: true })

  const term = sanitizeSearchTerm(search)
  if (term) {
    query = query.or(`name.ilike.%${term}%,reference.ilike.%${term}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createProduct(
  organizationId: string,
  input: ProductInput,
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({ ...input, organization_id: organizationId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}
