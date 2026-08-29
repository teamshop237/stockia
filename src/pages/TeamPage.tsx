import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { listTeamMembers, inviteMember, removeMember } from '../lib/team'
import type { Profile } from '../types/database'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function TeamPage() {
  const { profile: currentProfile } = useAuth()
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'owner' | 'member'>('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const [removeTarget, setRemoveTarget] = useState<Profile | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const isOwner = currentProfile?.role === 'owner'

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(null)
    listTeamMembers()
      .then((data) => {
        if (active) setMembers(data)
      })
      .catch((err) => {
        if (active) {
          setLoadError(err instanceof Error ? err.message : "Impossible de charger l'équipe.")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reloadToken])

  async function handleInvite(event: FormEvent) {
    event.preventDefault()
    if (inviting) return
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(null)
    try {
      await inviteMember(inviteEmail.trim(), inviteRole)
      setInviteSuccess(`Invitation envoyée à ${inviteEmail.trim()}.`)
      setInviteEmail('')
      setInviteRole('member')
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "L'invitation a échoué.")
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove() {
    if (!removeTarget) return
    setRemoving(true)
    setRemoveError(null)
    try {
      await removeMember(removeTarget.id)
      setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id))
      setRemoveTarget(null)
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Échec du retrait.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Équipe</h1>

      {isOwner ? (
        <form onSubmit={handleInvite} className="mt-4 max-w-md space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">Inviter un membre</h2>
          <div className="flex flex-wrap gap-3">
            <input
              type="email"
              required
              placeholder="email@exemple.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="min-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value === 'owner' ? 'owner' : 'member')}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="member">Membre</option>
              <option value="owner">Propriétaire</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {inviting ? 'Envoi…' : 'Inviter'}
            </button>
          </div>
          {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
          {inviteSuccess && <p className="text-sm text-green-700">{inviteSuccess}</p>}
        </form>
      ) : (
        <p className="mt-4 text-sm text-gray-500">
          Seul le propriétaire de l'entreprise peut inviter des membres.
        </p>
      )}

      {removeError && <p className="mt-4 text-sm text-red-600">{removeError}</p>}

      {loadError && (
        <div className="mt-6 flex items-center gap-3">
          <p className="text-sm text-red-600">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadToken((t) => t + 1)}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-gray-500">Chargement…</p>
      ) : loadError ? null : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Rôle</th>
                <th className="py-2 pr-4 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => {
                const canRemove = isOwner && m.role !== 'owner' && m.id !== currentProfile?.id
                return (
                  <tr key={m.id}>
                    <td className="py-2 pr-4 font-medium text-gray-900">
                      {m.email ?? '—'}
                      {m.id === currentProfile?.id && (
                        <span className="ml-2 text-xs text-gray-400">(toi)</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {m.role === 'owner' ? 'Propriétaire' : 'Membre'}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => setRemoveTarget(m)}
                          className="text-red-600 hover:underline"
                        >
                          Retirer
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        title="Retirer ce membre ?"
        message={`"${removeTarget?.email}" perdra immédiatement l'accès à toutes les données de l'entreprise.`}
        confirmLabel="Retirer"
        loading={removing}
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}
