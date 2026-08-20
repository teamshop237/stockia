import { supabase } from './supabase'
import type { MovementType, StockMovement } from '../types/database'

export async function listMovements(productId: string): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function recordMovement(
  productId: string,
  type: MovementType,
  quantity: number,
  note: string | null,
): Promise<StockMovement> {
  const { data, error } = await supabase
    .rpc('record_stock_movement', {
      p_product_id: productId,
      p_type: type,
      p_quantity: quantity,
      p_note: note,
    })
    .single()

  if (error) throw error
  return data as StockMovement
}
