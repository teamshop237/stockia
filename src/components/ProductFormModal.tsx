import { useState, type FormEvent } from 'react'
import type { Product, ProductInput } from '../types/database'

type ProductFormModalProps = {
  product: Product | null
  onCancel: () => void
  onSubmit: (input: ProductInput) => Promise<void>
}

function emptyOr(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function ProductFormModal({ product, onCancel, onSubmit }: ProductFormModalProps) {
  const [name, setName] = useState(product?.name ?? '')
  const [reference, setReference] = useState(product?.reference ?? '')
  const [quantity, setQuantity] = useState(String(product?.quantity ?? 0))
  const [alertThreshold, setAlertThreshold] = useState(String(product?.alert_threshold ?? 0))
  const [price, setPrice] = useState(String(product?.price ?? 0))
  const [category, setCategory] = useState(product?.category ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return

    const trimmedName = name.trim()
    const quantityNum = Number(quantity)
    const alertThresholdNum = Number(alertThreshold)
    const priceNum = Number(price)

    if (!trimmedName) {
      setError('Le nom est obligatoire.')
      return
    }
    if (!Number.isFinite(quantityNum) || quantityNum < 0) {
      setError('La quantité doit être un nombre positif.')
      return
    }
    if (!Number.isFinite(alertThresholdNum) || alertThresholdNum < 0) {
      setError("Le seuil d'alerte doit être un nombre positif.")
      return
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError('Le prix doit être un nombre positif.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        name: trimmedName,
        reference: emptyOr(reference),
        quantity: quantityNum,
        alert_threshold: alertThresholdNum,
        price: priceNum,
        category: emptyOr(category),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">
          {product ? 'Modifier le produit' : 'Ajouter un produit'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nom
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
                Référence
              </label>
              <input
                id="reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Catégorie
              </label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Quantité
              </label>
              <input
                id="quantity"
                type="number"
                step="any"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="alertThreshold" className="block text-sm font-medium text-gray-700">
                Seuil d'alerte
              </label>
              <input
                id="alertThreshold"
                type="number"
                step="any"
                min="0"
                required
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Prix
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
