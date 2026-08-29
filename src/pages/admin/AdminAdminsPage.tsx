import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { listPlatformAdmins, addPlatformAdmin, removePlatformAdmin, type PlatformAdmin } from '../../lib/admin'
import { ConfirmDialog } from '../../components/ConfirmDialog'

export function AdminAdminsPage() {
  const { user } = useAuth()
  const [admins, setAdmins] = useState<PlatformAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)

  const [removeTarget, setRemoveTarget] = useState<PlatformAdmin | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(null)
    listPlatformAdmins()
      .then((data) => {
        if (active) setAdmins(data)
      })
      .catch((err) => {
        if (active) {
          setLoadError(err instanceof Error ? err.message : 'Impossible de charger les administrateurs.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reloadToken])

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    if (adding) return
    setAdding(true)
    setAddError(null)
    setAddSuccess(null)
    try {
      await addPlatformAdmin(email.trim())
      setAddSuccess(`${email.trim()} est maintenant administrateur.`)
      setEmail('')
      setReloadToken((t) => t + 1)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Échec de l'ajout.")
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove() {
    if (!removeTarget) return
    setRemoving(true)
    setRemoveError(null)
    try {
      await removePlatformAdmin(removeTarget.id)
      setAdmins((prev) => prev.filter((a) => a.id !== removeTarget.id))
      setRemoveTarget(null)
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Échec du retrait.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Administrateurs</h1>
      <p className="mt-1 text-sm text-gray-500">
        La personne doit déjà avoir un compte StockIA (s'être connectée au moins une fois).
      </p>

      <form onSubmit={handleAdd} className="mt-4 max-w-md space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Ajouter un administrateur</h2>
        <div className="flex flex-wrap gap-3">
          <input
            type="email"
            required
            placeholder="email@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={adding}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding ? 'Ajout…' : 'Ajouter'}
          </button>
        </div>
        {addError && <p className="text-sm text-red-600">{addError}</p>}
        {addSuccess && <p className="text-sm text-green-700">{addSuccess}</p>}
      </form>

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
                <th className="py-2 pr-4 font-medium">Admin depuis</th>
                <th className="py-2 pr-4 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.map((a) => (
                <tr key={a.id}>
                  <td className="py-2 pr-4 font-medium text-gray-900">
                    {a.email ?? '—'}
                    {a.id === user?.id && <span className="ml-2 text-xs text-gray-400">(toi)</span>}
                  </td>
                  <td className="py-2 pr-4 text-gray-600">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    {a.id !== user?.id && (
                      <button
                        type="button"
                        onClick={() => setRemoveTarget(a)}
                        className="text-red-600 hover:underline"
                      >
                        Retirer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        title="Retirer cet administrateur ?"
        message={`"${removeTarget?.email}" perdra immédiatement l'accès à l'espace admin.`}
        confirmLabel="Retirer"
        loading={removing}
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}
