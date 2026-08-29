import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  countOrganizationProducts,
  getOrganization,
  listOrganizationMembers,
  setOrganizationSuspended,
} from '../../lib/admin'
import type { Organization, Profile } from '../../types/database'
import { ConfirmDialog } from '../../components/ConfirmDialog'

export function AdminOrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [productCount, setProductCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [confirmingSuspend, setConfirmingSuspend] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    setLoadError(null)
    Promise.all([getOrganization(id), listOrganizationMembers(id), countOrganizationProducts(id)])
      .then(([org, orgMembers, count]) => {
        if (!active) return
        setOrganization(org)
        setMembers(orgMembers)
        setProductCount(count)
      })
      .catch((err) => {
        if (active) {
          setLoadError(err instanceof Error ? err.message : "Impossible de charger l'organisation.")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, reloadToken])

  async function handleToggleSuspend() {
    if (!organization) return
    setUpdating(true)
    setUpdateError(null)
    try {
      await setOrganizationSuspended(organization.id, !organization.suspended)
      setOrganization({ ...organization, suspended: !organization.suspended })
      setConfirmingSuspend(false)
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Échec de l'action.")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <p className="text-gray-500">Chargement…</p>
  }

  if (loadError) {
    return (
      <div className="flex items-center gap-3">
        <p className="text-sm text-red-600">{loadError}</p>
        <button
          type="button"
          onClick={() => setReloadToken((t) => t + 1)}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (!organization) return null

  return (
    <div>
      <Link to="/admin/organizations" className="text-sm text-blue-600 hover:underline">
        ← Organisations
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{organization.name}</h1>
        {organization.suspended ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            Suspendue
          </span>
        ) : (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Active
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Créée le {new Date(organization.created_at).toLocaleDateString()}
      </p>

      <div className="mt-4 flex gap-6 text-sm text-gray-600">
        <p>
          <span className="font-medium text-gray-900">{members.length}</span> membre
          {members.length > 1 ? 's' : ''}
        </p>
        <p>
          <span className="font-medium text-gray-900">{productCount}</span> produit
          {productCount > 1 ? 's' : ''}
        </p>
      </div>

      {updateError && <p className="mt-4 text-sm text-red-600">{updateError}</p>}

      <button
        type="button"
        onClick={() => setConfirmingSuspend(true)}
        className={
          organization.suspended
            ? 'mt-4 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700'
            : 'mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700'
        }
      >
        {organization.suspended ? 'Réactiver cette organisation' : 'Suspendre cette organisation'}
      </button>

      <h2 className="mt-8 text-sm font-semibold text-gray-900">Membres</h2>
      <div className="mt-2 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Rôle</th>
              <th className="py-2 pr-4 font-medium">Depuis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="py-2 pr-4 font-medium text-gray-900">{m.email ?? '—'}</td>
                <td className="py-2 pr-4 text-gray-600">
                  {m.role === 'owner' ? 'Propriétaire' : 'Membre'}
                </td>
                <td className="py-2 pr-4 text-gray-600">
                  {new Date(m.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmingSuspend}
        title={organization.suspended ? 'Réactiver cette organisation ?' : 'Suspendre cette organisation ?'}
        message={
          organization.suspended
            ? `"${organization.name}" retrouvera immédiatement l'accès à ses données.`
            : `"${organization.name}" perdra immédiatement l'accès à toutes ses données, pour tous ses membres.`
        }
        confirmLabel={organization.suspended ? 'Réactiver' : 'Suspendre'}
        loading={updating}
        onConfirm={handleToggleSuspend}
        onCancel={() => setConfirmingSuspend(false)}
      />
    </div>
  )
}
