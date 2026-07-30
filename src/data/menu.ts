export type CategoryId = 'platillos' | 'aguachile' | 'ceviches' | 'sushi'

export interface SizeOption {
  id: string
  label: string
  price: number
}

export interface OptionChoice {
  id: string
  label: string
}

export interface OptionSubgroup {
  id: string
  label: string
  choices: OptionChoice[]
}

export interface MenuOptionGroup {
  id: string
  label: string
  required?: boolean
  /** Permite elegir varias opciones (ej. aderezos). */
  multiple?: boolean
  choices?: OptionChoice[]
  subgroups?: OptionSubgroup[]
}

export interface MenuItem {
  id: string
  name: string
  description: string
  category: CategoryId
  /**
   * Ruta de la imagen en /public.
   * Ejemplo: /images/camarones-empanizados.jpg
   */
  image: string
  /** Precio fijo (platillos sin talla) */
  price?: number
  /** Tallas Chico / Grande */
  sizes?: SizeOption[]
  /** Opciones de personalización (acompanamiento, aderezo, rollo, etc.) */
  options?: MenuOptionGroup[]
}

export interface Category {
  id: CategoryId
  label: string
  short: string
}

/** Selecciones al agregar al carrito (siempre arrays; single = 1 id). */
export interface CartExtras {
  sizeId?: string
  options?: Record<string, string[]>
}

export const categories: Category[] = [
  { id: 'platillos', label: 'Platillos', short: 'Plato' },
  { id: 'aguachile', label: 'Aguachile', short: 'Aguachile' },
  { id: 'ceviches', label: 'Ceviches', short: 'Ceviche' },
  { id: 'sushi', label: 'Sushi', short: 'Sushi' },
]

/** Prefijo de assets (en GitHub Pages: /menukitos/) */
const asset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

export const menuItems: MenuItem[] = [
  {
    id: 'pla-camarones',
    name: 'Platillo Camarones Empanizados',
    description:
      'Camarones empanizados, arroz, papas a la francesa, ensalada de verduras.',
    price: 160,
    category: 'platillos',
    image: asset('images/camarones-empanizados.webp'),
  },
  {
    id: 'pla-filete',
    name: 'Platillo Filete Empanizado',
    description:
      'Filete empanizado, arroz, papas a la francesa, ensalada de verduras.',
    price: 160,
    category: 'platillos',
    image: asset('images/filete-empanizado.jpg'),
  },
  {
    id: 'pla-mixto',
    name: 'Platillo Mixto Empanizado',
    description:
      'Filete y camarones empanizados, arroz, papas a la francesa, ensalada de verduras.',
    price: 180,
    category: 'platillos',
    image: asset('images/mixto.jpeg'),
  },
  {
    id: 'agua-chile',
    name: 'Aguachile',
    description: 'Aguachile fresco. Elige tamaño chico o grande.',
    category: 'aguachile',
    image: asset('images/aguachile.webp'),
    sizes: [
      { id: 'chico', label: 'Chico', price: 140 },
      { id: 'grande', label: 'Grande', price: 210 },
    ],
  },
  {
    id: 'cev-clasico',
    name: 'Ceviche',
    description: 'Ceviche tradicional. Elige tamaño chico o grande.',
    category: 'ceviches',
    image: asset('images/ceviche.webp'),
    sizes: [
      { id: 'chico', label: 'Chico', price: 120 },
      { id: 'grande', label: 'Grande', price: 180 },
    ],
  },
  {
    id: 'cev-camarones',
    name: 'Ceviche con Camarones',
    description: 'Ceviche con camarones. Elige tamaño chico o grande.',
    category: 'ceviches',
    image: asset('images/ceviche-camarones.jpg'),
    sizes: [
      { id: 'chico', label: 'Chico', price: 130 },
      { id: 'grande', label: 'Grande', price: 200 },
    ],
  },
  {
    id: 'sushi-combo3',
    name: 'Combo 3',
    description:
      '1 Rollo, papas fritas o gyozas y aderezos a elegir.',
    price: 150,
    category: 'sushi',
    image: asset('images/sushi_combo3.jpg'),
    options: [
      {
        id: 'acompanamiento',
        label: 'Acompañamiento',
        required: true,
        choices: [
          { id: 'papas', label: 'Papas fritas' },
          { id: 'gyozas', label: 'Gyozas' },
        ],
      },
      {
        id: 'aderezo',
        label: 'Aderezos',
        required: true,
        multiple: true,
        choices: [
          { id: 'chipotle', label: 'Chipotle' },
          { id: 'anguila', label: 'Salsa anguila' },
          { id: 'soja', label: 'Salsa de soja' },
        ],
      },
      {
        id: 'rollo',
        label: 'Rollo',
        required: true,
        subgroups: [
          {
            id: 'fresco',
            label: 'Sushi fresco',
            choices: [
              { id: 'fresco-philadelphia', label: 'Philadelphia Roll' },
              { id: 'fresco-ginger', label: 'Ginger Roll' },
              { id: 'fresco-california', label: 'California Roll' },
              { id: 'fresco-camaron', label: 'Camaron Roll' },
              { id: 'fresco-vegetales', label: 'Sushi de vegetales' },
              { id: 'fresco-atun', label: 'Uramaki de atun' },
            ],
          },
          {
            id: 'frito',
            label: 'Sushi frito',
            choices: [
              { id: 'frito-california', label: 'California Roll' },
              { id: 'frito-camaron', label: 'Camaron Roll' },
              { id: 'frito-atun', label: 'Uramaki de atun' },
              { id: 'frito-queso', label: 'Queso Roll' },
            ],
          },
        ],
      },
    ],
  },
]

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getMinPrice(item: MenuItem): number {
  if (item.sizes?.length) {
    return Math.min(...item.sizes.map((s) => s.price))
  }
  return item.price ?? 0
}

export function getUnitPrice(item: MenuItem, sizeId?: string): number {
  if (item.sizes?.length) {
    const size =
      item.sizes.find((s) => s.id === sizeId) ?? item.sizes[0]
    return size.price
  }
  return item.price ?? 0
}

export function getSizeLabel(item: MenuItem, sizeId?: string): string | undefined {
  if (!item.sizes?.length || !sizeId) return undefined
  return item.sizes.find((s) => s.id === sizeId)?.label
}

function findChoiceInGroup(
  group: MenuOptionGroup,
  choiceId: string,
): { choice: OptionChoice; subgroupLabel?: string } | undefined {
  if (group.choices) {
    const choice = group.choices.find((c) => c.id === choiceId)
    return choice ? { choice } : undefined
  }
  if (group.subgroups) {
    for (const sub of group.subgroups) {
      const choice = sub.choices.find((c) => c.id === choiceId)
      if (choice) return { choice, subgroupLabel: sub.label }
    }
  }
  return undefined
}

function asChoiceIds(value: string | string[] | undefined): string[] {
  if (!value) return []
  return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : []
}

export function formatOptionSelections(
  item: MenuItem,
  options?: Record<string, string[]>,
): string | undefined {
  if (!item.options?.length || !options) return undefined
  const parts: string[] = []
  for (const group of item.options) {
    const ids = asChoiceIds(options[group.id])
    if (!ids.length) continue
    const labels = ids
      .map((choiceId) => {
        const found = findChoiceInGroup(group, choiceId)
        if (!found) return null
        return found.subgroupLabel
          ? `${found.choice.label} (${found.subgroupLabel})`
          : found.choice.label
      })
      .filter(Boolean)
    if (labels.length) parts.push(labels.join(', '))
  }
  return parts.length ? parts.join(' · ') : undefined
}

export function buildLineExtrasLabel(
  item: MenuItem,
  extras?: CartExtras,
): string | undefined {
  const parts: string[] = []
  const size = getSizeLabel(item, extras?.sizeId)
  if (size) parts.push(size)
  const opts = formatOptionSelections(item, extras?.options)
  if (opts) parts.push(opts)
  return parts.length ? parts.join(' · ') : undefined
}

export function areRequiredOptionsSelected(
  item: MenuItem,
  options?: Record<string, string[]>,
): boolean {
  if (!item.options?.length) return true
  return item.options.every((group) => {
    if (group.required === false) return true
    const ids = asChoiceIds(options?.[group.id])
    if (!ids.length) return false
    return ids.every((id) => Boolean(findChoiceInGroup(group, id)))
  })
}

export function formatPriceLabel(item: MenuItem): string {
  if (item.sizes?.length) {
    const prices = item.sizes.map((s) => s.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    if (min === max) return formatPrice(min)
    return `desde ${formatPrice(min)}`
  }
  return formatPrice(item.price ?? 0)
}

export function cartLineLabel(item: MenuItem, extrasLabel?: string): string {
  return extrasLabel ? `${item.name} (${extrasLabel})` : item.name
}

export function makeCartKey(itemId: string, extras?: CartExtras): string {
  const parts = [itemId]
  if (extras?.sizeId) parts.push(extras.sizeId)
  if (extras?.options) {
    const sorted = Object.keys(extras.options)
      .sort()
      .map((k) => {
        const ids = [...asChoiceIds(extras.options![k])].sort().join(',')
        return `${k}:${ids}`
      })
      .join('|')
    if (sorted) parts.push(sorted)
  }
  return parts.join('__')
}

export function normalizeCartExtras(
  item: MenuItem,
  extras?: CartExtras,
): CartExtras {
  const sizeId =
    item.sizes?.length && extras?.sizeId
      ? item.sizes.some((s) => s.id === extras.sizeId)
        ? extras.sizeId
        : item.sizes[0].id
      : item.sizes?.length
        ? item.sizes[0].id
        : undefined

  const options: Record<string, string[]> = {}
  if (item.options?.length && extras?.options) {
    for (const group of item.options) {
      const raw = extras.options[group.id] as string | string[] | undefined
      const ids = asChoiceIds(raw).filter((id) =>
        Boolean(findChoiceInGroup(group, id)),
      )
      const unique = [...new Set(ids)]
      if (!unique.length) continue
      options[group.id] = group.multiple ? unique.sort() : [unique[0]]
    }
  }

  return {
    sizeId: item.sizes?.length ? sizeId : undefined,
    options: Object.keys(options).length ? options : undefined,
  }
}
