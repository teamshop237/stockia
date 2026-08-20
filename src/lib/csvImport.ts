import type { ProductInput } from '../types/database'

export type CsvImportError = { line: number; reason: string }

export type CsvImportResult = {
  valid: ProductInput[]
  errors: CsvImportError[]
}

const HEADER_ALIASES: Record<keyof ProductInput, string[]> = {
  name: ['name', 'nom', 'product name', 'item name', 'item', 'produit', 'article'],
  reference: ['reference', 'ref', 'sku', 'item code', 'code'],
  quantity: [
    'quantity',
    'quantite',
    'qty',
    'qty on hand',
    'quantity on hand',
    'current stock',
    'stock',
  ],
  alert_threshold: [
    'alert_threshold',
    'seuil',
    'seuil_alerte',
    'seuil dalerte',
    'reorder level',
    'reorder point',
    'min stock',
    'minimum stock',
  ],
  price: ['price', 'prix', 'unit price', 'selling price', 'sale price'],
  category: ['category', 'categorie'],
}

function normalizeHeader(header: string): string {
  return header
    .replace(/^﻿/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/\s+/g, ' ')
}

// Minimal RFC4180-style parser: handles quoted fields, embedded commas/newlines, "" escapes.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      pushField()
    } else if (char === '\r') {
      // ignore, \n handles the line break
    } else if (char === '\n') {
      pushRow()
    } else {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) pushRow()

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

// Comprend les formats "9.99", "9,99" (virgule décimale), "5,000" ou "1,234,567"
// (séparateur de milliers), avec ou sans symbole/code de devise ("5,000 FCFA", "9,99 €").
export function parseNumber(raw: string): number {
  let s = raw.trim().replace(/[^0-9,.-]/g, '')
  if (s === '') return NaN

  const hasComma = s.includes(',')
  const hasDot = s.includes('.')

  if (hasComma && hasDot) {
    s = s.replace(/,/g, '')
  } else if (hasComma) {
    const parts = s.split(',')
    const last = parts[parts.length - 1]
    const looksLikeThousands = parts.length > 1 && last.length === 3
    s = looksLikeThousands ? parts.join('') : s.replace(',', '.')
  }

  return Number(s)
}

function findColumn(headers: string[], key: keyof ProductInput): number {
  const aliases = HEADER_ALIASES[key]
  return headers.findIndex((h) => aliases.includes(h))
}

// Utilisé pour repérer, parmi plusieurs feuilles d'un classeur Excel, celle qui
// contient réellement les produits (un classeur a souvent des feuilles
// "Instructions" ou "Dashboard" en plus de la feuille de données).
export function hasRecognizableHeader(rows: string[][]): boolean {
  if (rows.length === 0) return false
  const headers = rows[0].map(normalizeHeader)
  return findColumn(headers, 'name') !== -1
}

export function buildProductInputs(rows: string[][]): CsvImportResult {
  const errors: CsvImportError[] = []
  const valid: ProductInput[] = []

  if (rows.length === 0) {
    return { valid, errors: [{ line: 0, reason: 'Le fichier est vide.' }] }
  }

  const headers = rows[0].map(normalizeHeader)
  const nameCol = findColumn(headers, 'name')

  if (nameCol === -1) {
    return {
      valid,
      errors: [{ line: 1, reason: 'Colonne "nom" (ou "name") introuvable dans l\'en-tête.' }],
    }
  }

  const refCol = findColumn(headers, 'reference')
  const qtyCol = findColumn(headers, 'quantity')
  const thresholdCol = findColumn(headers, 'alert_threshold')
  const priceCol = findColumn(headers, 'price')
  const categoryCol = findColumn(headers, 'category')

  for (let i = 1; i < rows.length; i++) {
    const line = i + 1
    const cells = rows[i]
    const name = cells[nameCol]?.trim() ?? ''

    if (!name) {
      errors.push({ line, reason: 'Nom manquant.' })
      continue
    }

    const rawQty = qtyCol >= 0 ? cells[qtyCol]?.trim() : ''
    const rawThreshold = thresholdCol >= 0 ? cells[thresholdCol]?.trim() : ''
    const rawPrice = priceCol >= 0 ? cells[priceCol]?.trim() : ''

    const quantity = rawQty ? parseNumber(rawQty) : 0
    const alertThreshold = rawThreshold ? parseNumber(rawThreshold) : 0
    const price = rawPrice ? parseNumber(rawPrice) : 0

    if (!Number.isFinite(quantity) || quantity < 0) {
      errors.push({ line, reason: `Quantité invalide : "${rawQty}".` })
      continue
    }
    if (!Number.isFinite(alertThreshold) || alertThreshold < 0) {
      errors.push({ line, reason: `Seuil d'alerte invalide : "${rawThreshold}".` })
      continue
    }
    if (!Number.isFinite(price) || price < 0) {
      errors.push({ line, reason: `Prix invalide : "${rawPrice}".` })
      continue
    }

    const reference = refCol >= 0 ? (cells[refCol]?.trim() ?? '') : ''
    const category = categoryCol >= 0 ? (cells[categoryCol]?.trim() ?? '') : ''

    valid.push({
      name,
      reference: reference || null,
      quantity,
      alert_threshold: alertThreshold,
      price,
      category: category || null,
    })
  }

  return { valid, errors }
}

export function buildTemplateCsv(): string {
  return [
    'nom,reference,quantite,seuil_alerte,prix,categorie',
    'Exemple de produit,REF-001,10,3,9.99,Catégorie exemple',
  ].join('\n')
}
