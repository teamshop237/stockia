import { invokeEdgeFunction } from './edgeFunctions'

export async function analyzeStock(): Promise<string> {
  const data = await invokeEdgeFunction<{ analysis?: string; error?: string }>('analyze-stock')
  if (!data.analysis) {
    throw new Error("Réponse inattendue de l'analyse IA.")
  }
  return data.analysis
}
