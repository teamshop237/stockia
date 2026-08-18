import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function SignupPage() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(signUpError.message)
      setSubmitting(false)
      return
    }

    if (!data.session) {
      setNeedsEmailConfirmation(true)
      setSubmitting(false)
      return
    }

    const { error: rpcError } = await supabase.rpc('create_organization_and_profile', {
      org_name: orgName,
      member_full_name: null,
    })

    if (rpcError) {
      setError(
        "Ton compte a été créé mais la création de l'entreprise a échoué : " + rpcError.message,
      )
      setSubmitting(false)
      return
    }

    await refreshProfile()
    navigate('/dashboard', { replace: true })
  }

  if (needsEmailConfirmation) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900">Vérifie ta boîte mail</h1>
        <p className="mt-2 text-gray-600">
          Un email de confirmation a été envoyé à <strong>{email}</strong>. Clique sur le lien
          qu'il contient, puis reviens te connecter.
        </p>
        <Link to="/login" className="mt-4 inline-block text-blue-600 hover:underline">
          Aller à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-xl font-semibold text-gray-900">Créer un compte</h1>
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
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-blue-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
