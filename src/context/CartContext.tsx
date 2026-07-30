import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import {
  buildLineExtrasLabel,
  getUnitPrice,
  makeCartKey,
  menuItems,
  normalizeCartExtras,
  type CartExtras,
  type MenuItem,
} from '../data/menu'

export interface CartLine {
  key: string
  item: MenuItem
  sizeId?: string
  options?: Record<string, string[]>
  extrasLabel?: string
  unitPrice: number
  qty: number
}

type CartAction =
  | { type: 'ADD'; item: MenuItem; extras?: CartExtras }
  | { type: 'REMOVE'; key: string }
  | { type: 'SET_QTY'; key: string; qty: number }
  | { type: 'CLEAR' }

interface CartState {
  lines: CartLine[]
}

const STORAGE_KEY = 'kitos-cart-v3'

interface StoredCartLine {
  itemId: string
  sizeId?: string
  options?: Record<string, string[]>
  qty: number
}

function toLine(item: MenuItem, extras?: CartExtras, qty = 1): CartLine {
  const normalized = normalizeCartExtras(item, extras)
  return {
    key: makeCartKey(item.id, normalized),
    item,
    sizeId: normalized.sizeId,
    options: normalized.options,
    extrasLabel: buildLineExtrasLabel(item, normalized),
    unitPrice: getUnitPrice(item, normalized.sizeId),
    qty,
  }
}

function hydrateLines(stored: StoredCartLine[]): CartLine[] {
  const lines: CartLine[] = []
  for (const row of stored) {
    if (!row?.itemId || !Number.isFinite(row.qty) || row.qty <= 0) continue
    const item = menuItems.find((m) => m.id === row.itemId)
    if (!item) continue
    lines.push(
      toLine(
        item,
        { sizeId: row.sizeId, options: row.options },
        Math.min(99, Math.floor(row.qty)),
      ),
    )
  }
  return lines
}

function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { lines: [] }
    const parsed = JSON.parse(raw) as { lines?: StoredCartLine[] }
    if (!Array.isArray(parsed?.lines)) return { lines: [] }
    return { lines: hydrateLines(parsed.lines) }
  } catch {
    return { lines: [] }
  }
}

function persistCart(lines: CartLine[]) {
  try {
    const payload: { lines: StoredCartLine[] } = {
      lines: lines.map((l) => ({
        itemId: l.item.id,
        sizeId: l.sizeId,
        options: l.options,
        qty: l.qty,
      })),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // private mode / quota — ignore
  }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const line = toLine(action.item, action.extras, 1)
      const existing = state.lines.find((l) => l.key === line.key)
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.key === line.key ? { ...l, qty: l.qty + 1 } : l,
          ),
        }
      }
      return { lines: [...state.lines, line] }
    }
    case 'REMOVE':
      return { lines: state.lines.filter((l) => l.key !== action.key) }
    case 'SET_QTY': {
      if (action.qty <= 0) {
        return { lines: state.lines.filter((l) => l.key !== action.key) }
      }
      return {
        lines: state.lines.map((l) =>
          l.key === action.key ? { ...l, qty: action.qty } : l,
        ),
      }
    }
    case 'CLEAR':
      return { lines: [] }
    default:
      return state
  }
}

interface CartContextValue {
  lines: CartLine[]
  itemCount: number
  total: number
  addItem: (item: MenuItem, extras?: CartExtras) => void
  removeItem: (key: string) => void
  setQty: (key: string, qty: number) => void
  clear: () => void
  qtyFor: (itemId: string, extras?: CartExtras) => number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart)

  useEffect(() => {
    persistCart(state.lines)
  }, [state.lines])

  const addItem = useCallback((item: MenuItem, extras?: CartExtras) => {
    dispatch({ type: 'ADD', item, extras })
  }, [])

  const removeItem = useCallback((key: string) => {
    dispatch({ type: 'REMOVE', key })
  }, [])

  const setQty = useCallback((key: string, qty: number) => {
    dispatch({ type: 'SET_QTY', key, qty })
  }, [])

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  const qtyFor = useCallback(
    (itemId: string, extras?: CartExtras) => {
      const item = menuItems.find((m) => m.id === itemId)
      const normalized = item
        ? normalizeCartExtras(item, extras)
        : extras
      const key = makeCartKey(itemId, normalized)
      return state.lines.find((l) => l.key === key)?.qty ?? 0
    },
    [state.lines],
  )

  const value = useMemo(() => {
    const itemCount = state.lines.reduce((sum, l) => sum + l.qty, 0)
    const total = state.lines.reduce(
      (sum, l) => sum + l.unitPrice * l.qty,
      0,
    )
    return {
      lines: state.lines,
      itemCount,
      total,
      addItem,
      removeItem,
      setQty,
      clear,
      qtyFor,
    }
  }, [state.lines, addItem, removeItem, setQty, clear, qtyFor])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
