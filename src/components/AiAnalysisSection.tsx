import { useState } from 'react'
import { analyzeStock } from '../lib/aiAnalysis'

function renderAnalysis(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) {
      return (
        <h3 key={i} className="mt-4 text-base font-semibold text-gray-900">
          {line.slice(3)}
        </h3>
      )
    }
    if (line.trim() === '') return null
    return (
      <p key={i} className="mt-1 text-sm text-gray-700">
        {line}
      </p>
    )
  })
}

export function AiAnalysisSection() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    if (status === 'loading') return
    setStatus('loading')
    setError(null)
    try {
      const result = await analyzeStock()
      setAnalysis(result)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'analyse IA a échoué.")
      setStatus('error')
    }
  }

  return (
    <div className="mt-8 rounded-lg border border-purple-200 bg-purple-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Analyse IA (option)</h2>
          <p className="mt-1 text-sm text-gray-600">
            Recommandations de réapprovisionnement générées à partir de ton stock actuel.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={status === 'loading'}
          className="whitespace-nowrap rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'loading' ? 'Analyse en cours…' : 'Activer l’analyse IA'}
        </button>
      </div>

      {status === 'error' && error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      {status === 'success' && analysis && (
        <div className="mt-4 rounded-md bg-white p-4">{renderAnalysis(analysis)}</div>
      )}
    </div>
  )
}
