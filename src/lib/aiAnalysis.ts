import { supabase } from './supabase'

export async function analyzeStock(): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ analysis?: string; error?: string }>(
    'analyze-stock',
  )

  if (error) {
    const context = (error as { context?: Response }).context
    let message = error.message
    if (context) {
      try {
        const body = await context.clone().json()
        if (body?.error) message = body.error
      } catch {
        // réponse non-JSON : on garde le message d'erreur générique
      }
    }
    throw new Error(message)
  }
  if (data?.error) {
    throw new Error(data.error)
  }
  if (!data?.analysis) {
    throw new Error("Réponse inattendue de l'analyse IA.")
  }
  return data.analysis
}
