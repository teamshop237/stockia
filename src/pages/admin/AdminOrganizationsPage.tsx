import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listOrganizationsForAdmin, setOrganizationSuspended } from '../../lib/admin'
import type { OrganizationAdminSummary } from '../../types/database'
import { ConfirmDialog } from '../../components/ConfirmDialog'

export function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationAdminSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [target, setTarget] = useState<OrganizationAdminSummary | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(null)
    listOrganizationsForAdmin()
      .then((data) => {
        if (active) setOrganizations(data)
      })
      .catch((err) => {
        if (active) {
          setLoadError(err instanceof Error ? err.message : 'Impossible de charger les organisations.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reloadToken])

  async function handleToggleSuspend() {
    if (!target) return
    setUpdating(true)
    setUpdateError(null)
    try {
      await setOrganizationSuspended(target.id, !target.suspended)
      setOrganizations((prev) =>
        prev.map((o) => (o.id === target.id ? { ...o, suspended: !target.suspended } : o)),
      )
      setTarget(null)
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Échec de l'action.")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Organisations</h1>
      <p className="mt-1 text-sm text-gray-500">
        {organizations.length} organisation{organizations.length > 1 ? 's' : ''} au total.
      </p>

      {updateError && <p className="mt-4 text-sm text-red-600">{updateError}</p>}

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
                <th className="py-2 pr-4 font-medium">Nom</th>
                <th className="py-2 pr-4 font-medium">Créée le</th>
                <th className="py-2 pr-4 font-medium">Membres</th>
                <th className="py-2 pr-4 font-medium">Produits</th>
                <th className="py-2 pr-4 font-medium">Statut</th>
                <th className="py-2 pr-4 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {organizations.map((org) => (
                <tr key={org.id}>
                  <td className="py-2 pr-4 font-medium text-gray-900">
                    <Link to={`/admin/organizations/${org.id}`} className="text-blue-600 hover:underline">
                      {org.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-gray-600">
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{org.member_count}</td>
                  <td className="py-2 pr-4 text-gray-600">{org.product_count}</td>
                  <td className="py-2 pr-4">
                    {org.suspended ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Suspendue
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <button
                      type="button"
                      onClick={() => setTarget(org)}
                      className={org.suspended ? 'text-green-700 hover:underline' : 'text-red-600 hover:underline'}
                    >
                      {org.suspended ? 'Réactiver' : 'Suspendre'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={target !== null}
        title={target?.suspended ? 'Réactiver cette organisation ?' : 'Suspendre cette organisation ?'}
        message={
          target?.suspended
            ? `"${target?.name}" retrouvera immédiatement l'accès à ses données.`
            : `"${target?.name}" perdra immédiatement l'accès à toutes ses données, pour tous ses membres.`
        }
        confirmLabel={target?.suspended ? 'Réactiver' : 'Suspendre'}
        loading={updating}
        onConfirm={handleToggleSuspend}
        onCancel={() => setTarget(null)}
      />
    </div>
  )
}
