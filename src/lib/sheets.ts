import type { CartLine } from '../context/CartContext'
import type { CustomerInfo } from './whatsapp'
import { cartLineLabel, formatPrice } from '../data/menu'

export interface OrderLineItem {
  productId: string
  name: string
  sizeId?: string
  sizeLabel?: string
  options?: Record<string, string[]>
  extrasLabel?: string
  qty: number
  unitPrice: number
}

export interface OrderPayload {
  folio: string
  fecha: string
  cliente: string
  telefono: string
  tipo: string
  direccion: string
  notas: string
  items: string
  lineItems: OrderLineItem[]
  total: number
  totalTexto: string
  estado: string
  pago: string
}

export interface PopularResponse {
  ok: boolean
  popular: string[]
  ranking?: { id: string; name: string; units: number }[]
}

export function buildOrderPayload(
  lines: CartLine[],
  total: number,
  customer: CustomerInfo,
): OrderPayload {
  const folio = `KIT-${Date.now().toString(36).toUpperCase()}`
  const items = lines
    .map(
      (l) =>
        `${l.qty}x ${cartLineLabel(l.item, l.extrasLabel)} (${formatPrice(l.unitPrice)})`,
    )
    .join(' | ')

  const lineItems: OrderLineItem[] = lines.map((l) => ({
    productId: l.item.id,
    name: l.item.name,
    sizeId: l.sizeId,
    sizeLabel: l.extrasLabel,
    options: l.options,
    extrasLabel: l.extrasLabel,
    qty: l.qty,
    unitPrice: l.unitPrice,
  }))

  return {
    folio,
    fecha: new Date().toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City',
    }),
    cliente: customer.name,
    telefono: customer.phone,
    tipo: customer.orderType === 'domicilio' ? 'Domicilio' : 'Recoger',
    direccion: customer.address || '',
    notas: customer.notes || '',
    items,
    lineItems,
    total,
    totalTexto: formatPrice(total),
    estado: 'Nuevo',
    pago: customer.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo',
  }
}

function sheetsUrl(): string | null {
  const url = import.meta.env.VITE_SHEETS_WEBAPP_URL as string | undefined
  if (!url || url.includes('TU_ID')) return null
  return url
}

export async function saveOrderToSheets(
  payload: OrderPayload,
): Promise<{ ok: boolean; skipped?: boolean }> {
  const url = sheetsUrl()

  if (!url) {
    console.warn(
      '[KITOS] Sheets no configurado — pedido solo por WhatsApp.',
    )
    return { ok: true, skipped: true }
  }

  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })

  return { ok: true }
}

/**
 * Lee el top de ventas desde Sheets (hoja Ranking vía Apps Script).
 * Esos IDs se marcan como "Popular" en el menú.
 */
export async function fetchPopularProductIds(): Promise<string[]> {
  const url = sheetsUrl()
  if (!url) return []

  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = (await res.json()) as PopularResponse
    if (!data?.ok || !Array.isArray(data.popular)) return []
    return data.popular.filter((id) => typeof id === 'string')
  } catch (err) {
    console.warn('[KITOS] No se pudo cargar ranking Popular:', err)
    return []
  }
}
