import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Minus, Plus, X } from 'lucide-react'
import type { MenuItem, MenuOptionGroup } from '../data/menu'
import {
  areRequiredOptionsSelected,
  formatPrice,
  getUnitPrice,
  makeCartKey,
  normalizeCartExtras,
} from '../data/menu'
import { useCart } from '../context/CartContext'
import { ProductImage } from './ProductImage'

interface ProductDetailProps {
  item: MenuItem | null
  isPopular?: boolean
  onClose: () => void
}

function ChoiceButton({
  label,
  active,
  onClick,
  hint,
  multiple,
}: {
  label: string
  active: boolean
  onClick: () => void
  hint?: string
  multiple?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition duration-150 ${
        active
          ? 'border-ocean-800 bg-ocean-800 text-white shadow-sm shadow-ocean-900/15'
          : 'border-ocean-900/12 bg-white text-ocean-900 hover:border-ocean-700/35 hover:bg-foam/60'
      }`}
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center border transition ${
          multiple ? 'rounded-md' : 'rounded-full'
        } ${
          active
            ? 'border-lime-sea bg-lime-sea text-ocean-950'
            : 'border-ocean-900/25 bg-transparent text-transparent'
        }`}
        aria-hidden
      >
        <Check className="size-3 stroke-[3]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-snug tracking-tight">
          {label}
        </span>
        {hint ? (
          <span
            className={`mt-0.5 block text-xs tabular-nums ${
              active ? 'text-foam/80' : 'text-ocean-900/50'
            }`}
          >
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  )
}

function OptionGroupPicker({
  group,
  values,
  onToggle,
}: {
  group: MenuOptionGroup
  values: string[]
  onToggle: (choiceId: string) => void
}) {
  const multiple = Boolean(group.multiple)
  const hint = multiple
    ? 'Puedes elegir varios'
    : group.required === false
      ? 'Opcional'
      : 'Elige uno'

  if (group.subgroups?.length) {
    return (
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[11px] font-bold tracking-[0.14em] text-ocean-900/45 uppercase">
            {group.label}
          </h3>
          <span className="text-[11px] text-ocean-900/40">{hint}</span>
        </div>
        <div className="space-y-4">
          {group.subgroups.map((sub) => (
            <div key={sub.id} className="space-y-2">
              <p className="text-sm font-semibold text-ocean-800">{sub.label}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {sub.choices.map((choice) => (
                  <ChoiceButton
                    key={choice.id}
                    label={choice.label}
                    active={values.includes(choice.id)}
                    multiple={multiple}
                    onClick={() => onToggle(choice.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (!group.choices?.length) return null

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[11px] font-bold tracking-[0.14em] text-ocean-900/45 uppercase">
          {group.label}
        </h3>
        <span className="text-[11px] text-ocean-900/40">{hint}</span>
      </div>
      <div
        className={`grid gap-2 ${
          group.choices.length === 2
            ? 'grid-cols-2'
            : group.choices.length === 3
              ? 'grid-cols-1 sm:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2'
        }`}
      >
        {group.choices.map((choice) => (
          <ChoiceButton
            key={choice.id}
            label={choice.label}
            active={values.includes(choice.id)}
            multiple={multiple}
            onClick={() => onToggle(choice.id)}
          />
        ))}
      </div>
    </section>
  )
}

export function ProductDetail({
  item,
  isPopular = false,
  onClose,
}: ProductDetailProps) {
  const { addItem, setQty, qtyFor } = useCart()
  const [sizeId, setSizeId] = useState<string | undefined>()
  const [selections, setSelections] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (!item) return
    setSizeId(item.sizes?.[0]?.id)
    setSelections({})
  }, [item])

  useEffect(() => {
    if (!item) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [item])

  const open = Boolean(item)
  const needsSize = Boolean(item?.sizes?.length)
  const hasOptions = Boolean(item?.options?.length)

  const extras = useMemo(() => {
    if (!item) return undefined
    return normalizeCartExtras(item, {
      sizeId: needsSize ? sizeId : undefined,
      options: hasOptions ? selections : undefined,
    })
  }, [item, needsSize, sizeId, hasOptions, selections])

  const unitPrice = item ? getUnitPrice(item, extras?.sizeId) : 0
  const optionsReady = item
    ? areRequiredOptionsSelected(item, selections)
    : false
  const canAdd =
    Boolean(item) &&
    (!needsSize || Boolean(sizeId)) &&
    (!hasOptions || optionsReady)
  const qty = item && canAdd ? qtyFor(item.id, extras) : 0

  function handleAdd() {
    if (!item || !canAdd) return
    addItem(item, extras)
  }

  function toggleOption(group: MenuOptionGroup, choiceId: string) {
    setSelections((prev) => {
      const current = prev[group.id] ?? []
      if (group.multiple) {
        const next = current.includes(choiceId)
          ? current.filter((id) => id !== choiceId)
          : [...current, choiceId]
        return { ...prev, [group.id]: next }
      }
      return { ...prev, [group.id]: [choiceId] }
    })
  }

  return (
    <AnimatePresence>
      {open && item && (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-ocean-950/55 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal
            aria-label={item.name}
            initial={{ y: '100%', opacity: 0.85 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.85 }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-sand shadow-2xl sm:inset-x-4 sm:inset-y-auto sm:bottom-auto sm:top-1/2 sm:max-h-[min(88dvh,720px)] sm:max-w-3xl sm:-translate-y-1/2 sm:rounded-3xl lg:max-w-4xl"
          >
            <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
              {/* Imagen: compacta en móvil, panel lateral en desktop */}
              <div className="relative shrink-0 sm:w-[42%] sm:max-w-sm lg:w-[38%]">
                <div className="aspect-[16/10] w-full overflow-hidden bg-ocean-950 sm:aspect-auto sm:h-full sm:min-h-[280px]">
                  <ProductImage
                    item={item}
                    fit="cover"
                    className="size-full"
                    priority
                    sizes="(min-width: 640px) 360px, 100vw"
                  />
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-3 right-3 z-20 flex size-9 items-center justify-center rounded-full bg-sand/95 text-ocean-900 shadow-md backdrop-blur-sm sm:bg-white/95"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-3 sm:px-6 sm:pt-5">
                  {isPopular && (
                    <div className="mb-2">
                      <span className="rounded bg-lime-sea/80 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ocean-950 uppercase">
                        Popular
                      </span>
                    </div>
                  )}

                  <h2 className="font-display text-[1.85rem] leading-none tracking-wide text-ocean-900 sm:text-[2.15rem]">
                    {item.name}
                  </h2>
                  <p className="mt-2.5 text-sm leading-relaxed text-ocean-900/65">
                    {item.description}
                  </p>

                  <div className="mt-5 space-y-6">
                    {needsSize && item.sizes && (
                      <section className="space-y-3">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="text-[11px] font-bold tracking-[0.14em] text-ocean-900/45 uppercase">
                            Tamaño
                          </h3>
                          <span className="text-[11px] text-ocean-900/40">
                            Elige uno
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {item.sizes.map((size) => (
                            <ChoiceButton
                              key={size.id}
                              label={size.label}
                              hint={formatPrice(size.price)}
                              active={sizeId === size.id}
                              onClick={() => setSizeId(size.id)}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {item.options?.map((group) => (
                      <OptionGroupPicker
                        key={group.id}
                        group={group}
                        values={selections[group.id] ?? []}
                        onToggle={(choiceId) => toggleOption(group, choiceId)}
                      />
                    ))}
                  </div>
                </div>

                <div className="shrink-0 border-t border-ocean-900/8 bg-sand/95 px-5 pt-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:px-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-ocean-900/55">Precio</span>
                    <span className="text-xl font-bold tabular-nums text-ocean-950">
                      {formatPrice(unitPrice)}
                    </span>
                  </div>

                  {!canAdd ? (
                    <p className="mb-3 text-center text-xs text-ocean-900/55">
                      Completa las opciones para agregar.
                    </p>
                  ) : null}

                  {qty === 0 ? (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      disabled={!canAdd}
                      onClick={handleAdd}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-coral py-3.5 text-sm font-bold text-white transition hover:bg-coral-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="size-5" />
                      Agregar al pedido
                    </motion.button>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-1 rounded-2xl bg-ocean-800 p-1.5 text-white">
                        <button
                          type="button"
                          aria-label="Quitar uno"
                          onClick={() =>
                            setQty(makeCartKey(item.id, extras), qty - 1)
                          }
                          className="flex size-10 items-center justify-center rounded-xl hover:bg-white/15"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="min-w-8 text-center text-base font-bold tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Agregar uno"
                          onClick={handleAdd}
                          className="flex size-10 items-center justify-center rounded-xl hover:bg-white/15"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-2xl bg-coral py-3.5 text-sm font-bold text-white transition hover:bg-coral-dark"
                      >
                        Listo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
