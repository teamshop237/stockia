import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { session, profile, loading, refreshProfile } = useAuth()
  const [checkingInvite, setCheckingInvite] = useState(true)
  const [orgName, setOrgName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading || !session || profile) {
      setCheckingInvite(false)
      return
    }

    let active = true
    supabase
      .rpc('join_invited_organization')
      .then(async ({ data, error: rpcError }) => {
        if (!active) return
        if (!rpcError && data) {
          await refreshProfile()
          navigate('/dashboard', { replace: true })
          return
        }
        setCheckingInvite(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, profile])

  if (loading || checkingInvite) {
    return <p className="text-gray-500">Chargement…</p>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (profile) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)

    const { error: rpcError } = await supabase.rpc('create_organization_and_profile', {
      org_name: orgName,
      member_full_name: null,
    })

    if (rpcError) {
      setError(rpcError.message)
      setSubmitting(false)
      return
    }

    await refreshProfile()
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-xl font-semibold text-gray-900">Configure ton entreprise</h1>
      <p className="mt-2 text-gray-600">
        Ton compte est confirmé. Il ne reste qu'une étape avant d'accéder à StockIA.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="orgName" className="block text-sm font-medium text-gray-700">
            Nom de l'entreprise
          </label>
          <input
            id="orgName"
            type="text"
            required
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Création…' : 'Continuer'}
        </button>
      </form>
    </div>
  )
}
