import { supabase } from './supabase'

export async function invokeEdgeFunction<T extends { error?: string }>(
  name: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body })

  if (error) {
    const context = (error as { context?: Response }).context
    let message = error.message
    if (context) {
      try {
        const parsed = await context.clone().json()
        if (parsed?.error) message = parsed.error
      } catch {
        // réponse non-JSON : on garde le message d'erreur générique
      }
    }
    throw new Error(message)
  }
  if (data?.error) {
    throw new Error(data.error)
  }
  return data as T
}
