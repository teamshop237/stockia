import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteOrganization,
  getOrganization,
  listOrganizationMembers,
  listOrganizationProducts,
  renameOrganization,
  setOrganizationSuspended,
} from '../../lib/admin'
import type { Organization, Product, Profile } from '../../types/database'
import { ConfirmDialog } from '../../components/ConfirmDialog'

export function AdminOrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [confirmingSuspend, setConfirmingSuspend] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    setLoadError(null)
    Promise.all([getOrganization(id), listOrganizationMembers(id), listOrganizationProducts(id)])
      .then(([org, orgMembers, orgProducts]) => {
        if (!active) return
        setOrganization(org)
        setMembers(orgMembers)
        setProducts(orgProducts)
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

  function startEditingName() {
    if (!organization) return
    setNameDraft(organization.name)
    setNameError(null)
    setEditingName(true)
  }

  async function handleSaveName(event: FormEvent) {
    event.preventDefault()
    if (!organization || savingName) return
    const trimmed = nameDraft.trim()
    if (!trimmed) {
      setNameError('Le nom ne peut pas être vide.')
      return
    }
    setSavingName(true)
    setNameError(null)
    try {
      await renameOrganization(organization.id, trimmed)
      setOrganization({ ...organization, name: trimmed })
      setEditingName(false)
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Échec du renommage.')
    } finally {
      setSavingName(false)
    }
  }

  async function handleDelete() {
    if (!organization) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteOrganization(organization.id)
      navigate('/admin/organizations', { replace: true })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Échec de la suppression.')
      setDeleting(false)
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
        {editingName ? (
          <form onSubmit={handleSaveName} className="flex flex-1 items-center gap-2">
            <input
              type="text"
              required
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              autoFocus
              className="w-full max-w-sm rounded-md border border-gray-300 px-2 py-1 text-xl font-semibold text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={savingName}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingName ? '…' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => setEditingName(false)}
              disabled={savingName}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Annuler
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">{organization.name}</h1>
            <button
              type="button"
              onClick={startEditingName}
              className="text-sm text-blue-600 hover:underline"
            >
              Modifier
            </button>
          </div>
        )}
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
      {nameError && <p className="mt-1 text-sm text-red-600">{nameError}</p>}
      <p className="mt-1 text-sm text-gray-500">
        Créée le {new Date(organization.created_at).toLocaleDateString()}
      </p>

      <div className="mt-4 flex gap-6 text-sm text-gray-600">
        <p>
          <span className="font-medium text-gray-900">{members.length}</span> membre
          {members.length > 1 ? 's' : ''}
        </p>
        <p>
          <span className="font-medium text-gray-900">{products.length}</span> produit
          {products.length > 1 ? 's' : ''}
        </p>
      </div>

      {updateError && <p className="mt-4 text-sm text-red-600">{updateError}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setConfirmingSuspend(true)}
          className={
            organization.suspended
              ? 'rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700'
              : 'rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700'
          }
        >
          {organization.suspended ? 'Réactiver cette organisation' : 'Suspendre cette organisation'}
        </button>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Supprimer définitivement
        </button>
      </div>
      {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}

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

      <h2 className="mt-8 text-sm font-semibold text-gray-900">Produits</h2>
      {products.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Aucun produit.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">Nom</th>
                <th className="py-2 pr-4 font-medium">Référence</th>
                <th className="py-2 pr-4 font-medium">Quantité</th>
                <th className="py-2 pr-4 font-medium">Seuil</th>
                <th className="py-2 pr-4 font-medium">Prix</th>
                <th className="py-2 pr-4 font-medium">Catégorie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 pr-4 font-medium text-gray-900">{p.name}</td>
                  <td className="py-2 pr-4 text-gray-600">{p.reference ?? '—'}</td>
                  <td className="py-2 pr-4 text-gray-600">{p.quantity}</td>
                  <td className="py-2 pr-4 text-gray-600">{p.alert_threshold}</td>
                  <td className="py-2 pr-4 text-gray-600">{p.price}</td>
                  <td className="py-2 pr-4 text-gray-600">{p.category ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

      <ConfirmDialog
        open={confirmingDelete}
        title="Supprimer définitivement cette organisation ?"
        message={`Action irréversible : "${organization.name}" et toutes ses données (produits, mouvements de stock, membres) seront supprimés pour toujours.`}
        confirmLabel="Supprimer définitivement"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  )
}
