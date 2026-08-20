import { useEffect, useState, type FormEvent } from 'react'
import { listMovements, recordMovement } from '../lib/stockMovements'
import type { MovementType, Product, StockMovement } from '../types/database'

type StockMovementsModalProps = {
  product: Product
  onCancel: () => void
  onQuantityChange: (productId: string, newQuantity: number) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function StockMovementsModal({ product, onCancel, onQuantityChange }: StockMovementsModalProps) {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [type, setType] = useState<MovementType>('in')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    listMovements(product.id)
      .then(setMovements)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Impossible de charger l’historique.'))
      .finally(() => setLoading(false))
  }, [product.id])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return

    const quantityNum = Number(quantity)
    if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
      setSubmitError('La quantité doit être un nombre positif.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const movement = await recordMovement(product.id, type, quantityNum, note.trim() || null)
      setMovements((prev) => [movement, ...prev])
      const newQuantity = type === 'in' ? product.quantity + quantityNum : product.quantity - quantityNum
      onQuantityChange(product.id, newQuantity)
      setQuantity('')
      setNote('')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Échec de l’enregistrement.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">Historique — {product.name}</h2>
        <p className="mt-1 text-sm text-gray-500">Quantité actuelle : {product.quantity}</p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="movement-type" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="movement-type"
              value={type}
              onChange={(e) => setType(e.target.value as MovementType)}
              className="mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="in">Entrée</option>
              <option value="out">Sortie</option>
            </select>
          </div>
          <div>
            <label htmlFor="movement-quantity" className="block text-sm font-medium text-gray-700">
              Quantité
            </label>
            <input
              id="movement-quantity"
              type="number"
              step="any"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 w-24 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="movement-note" className="block text-sm font-medium text-gray-700">
              Note (optionnel)
            </label>
            <input
              id="movement-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ex : livraison fournisseur X"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
        {submitError && <p className="mt-2 text-sm text-red-600">{submitError}</p>}

        <div className="mt-6 max-h-64 overflow-y-auto border-t border-gray-100 pt-4">
          {loading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : loadError ? (
            <p className="text-sm text-red-600">{loadError}</p>
          ) : movements.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun mouvement enregistré pour l’instant.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {movements.map((m) => (
                <li key={m.id} className="flex items-center justify-between">
                  <span>
                    <span className={m.type === 'in' ? 'text-green-700' : 'text-red-700'}>
                      {m.type === 'in' ? '+ Entrée' : '− Sortie'} {m.quantity}
                    </span>
                    {m.note && <span className="text-gray-500"> — {m.note}</span>}
                  </span>
                  <span className="text-gray-400">{formatDate(m.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
