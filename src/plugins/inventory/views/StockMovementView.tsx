import React, { useState, useEffect, useMemo } from 'react'
import { Save, Plus, ArrowUpRight, ArrowDownRight, RefreshCw, ArrowRightLeft, Trash2, Package, Check, Eye } from 'lucide-react'
import { useInventoryConfig, useInventoryStore, useInventoryProvider, formatCurrency } from '../InventoryContext'
import { cn } from '../../../lib/cn'
import { SubpageHeader } from '../../../components/layout/ModulePage'
import { SearchSelect, type SearchSelectOption } from '../../../components/ui/search-select'
import { DatePicker } from '../../../components/ui/date-picker'
import type { MovementType, StockMovement, StockPosition } from '../types'

// ---------------------------------------------------------------------------
// Movement type config
// ---------------------------------------------------------------------------

const MOVEMENT_TYPES: { value: MovementType; label: string; icon: React.ElementType; color: string; activeColor: string; description: string }[] = [
  { value: 'entry', label: 'Entry', icon: ArrowDownRight, color: 'text-emerald-600', activeColor: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', description: 'Receiving goods' },
  { value: 'exit', label: 'Exit', icon: ArrowUpRight, color: 'text-red-500', activeColor: 'border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400', description: 'Using or selling' },
  { value: 'adjustment', label: 'Adjustment', icon: RefreshCw, color: 'text-blue-500', activeColor: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', description: 'Count correction' },
  { value: 'transfer', label: 'Transfer', icon: ArrowRightLeft, color: 'text-violet-500', activeColor: 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400', description: 'Between locations' },
  { value: 'loss', label: 'Loss', icon: Trash2, color: 'text-amber-500', activeColor: 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', description: 'Waste or damage' },
]

// ---------------------------------------------------------------------------
// Movement detail card (for viewing a recorded movement)
// ---------------------------------------------------------------------------

function MovementDetail({ movement, currency, onClose }: {
  movement: StockMovement
  currency: { code: string; locale: string; symbol: string }
  onClose: () => void
}) {
  const typeConfig = MOVEMENT_TYPES.find((t) => t.value === movement.movementType)
  const TypeIcon = typeConfig?.icon ?? Package

  return (
    <div className="space-y-4">
      <SubpageHeader title="Movement Details" subtitle={`#${movement.id}`} onBack={onClose} />

      <div className="rounded-lg border bg-card p-5 space-y-4">
        {/* Type + Product hero */}
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${typeConfig?.activeColor ?? 'bg-muted'}`}>
            <TypeIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold">{movement.productName ?? 'Unknown Product'}</p>
            <p className="text-xs text-muted-foreground capitalize">{movement.movementType} &middot; {movement.movementDate}</p>
          </div>
        </div>

        {/* Key details grid */}
        <div className="grid gap-3 sm:grid-cols-3 pt-2 border-t">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Quantity</p>
            <p className="text-sm font-semibold">{movement.movementType === 'entry' ? '+' : '-'}{movement.quantity}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Unit Cost</p>
            <p className="text-sm font-semibold">{formatCurrency(movement.unitCost, currency)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Total Cost</p>
            <p className="text-sm font-semibold">{formatCurrency(movement.totalCost, currency)}</p>
          </div>
        </div>

        {/* Optional details */}
        <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t">
          {movement.stockLocationName && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Location</p>
              <p className="text-sm">{movement.stockLocationName}</p>
            </div>
          )}
          {movement.destinationLocationName && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Destination</p>
              <p className="text-sm">{movement.destinationLocationName}</p>
            </div>
          )}
          {movement.supplierName && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Supplier</p>
              <p className="text-sm">{movement.supplierName}</p>
            </div>
          )}
          {movement.documentNumber && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Document</p>
              <p className="text-sm">{movement.documentNumber}</p>
            </div>
          )}
          {movement.reason && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Reason</p>
              <p className="text-sm">{movement.reason}</p>
            </div>
          )}
        </div>

        {movement.notes && (
          <div className="pt-2 border-t">
            <p className="text-[10px] text-muted-foreground uppercase">Notes</p>
            <p className="text-sm mt-0.5">{movement.notes}</p>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-[10px] text-muted-foreground">Recorded {new Date(movement.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stock movement form
// ---------------------------------------------------------------------------

export function StockMovementView({ defaultType, onSaved, viewMovement }: {
  defaultType: MovementType
  onSaved?: () => void
  viewMovement?: StockMovement
}) {
  const { currency, modules } = useInventoryConfig()
  const provider = useInventoryProvider()
  const products = useInventoryStore((s) => s.products)
  const locations = useInventoryStore((s) => s.locations)
  const fetchProducts = useInventoryStore((s) => s.fetchProducts)
  const fetchLocations = useInventoryStore((s) => s.fetchLocations)
  const createMovement = useInventoryStore((s) => s.createMovement)

  const [step, setStep] = useState(1)
  const [positions, setPositions] = useState<StockPosition[]>([])
  const [movementType, setMovementType] = useState<MovementType>(defaultType)
  const [productId, setProductId] = useState('')
  const [productLabel, setProductLabel] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitCost, setUnitCost] = useState(0)
  const [locationId, setLocationId] = useState('')
  const [destLocationId, setDestLocationId] = useState('')
  const [reason, setReason] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMovement, setSavedMovement] = useState<StockMovement | null>(null)

  useEffect(() => { fetchProducts({}); fetchLocations() }, [])

  // If viewing a movement detail
  if (viewMovement) {
    return <MovementDetail movement={viewMovement} currency={currency} onClose={() => onSaved?.()} />
  }

  // If just saved — show success with details
  if (savedMovement) {
    return <MovementDetail movement={savedMovement} currency={currency} onClose={() => onSaved?.()} />
  }

  const selectedProduct = products.find((p) => p.id === productId)
  const totalCost = quantity * unitCost
  const typeConfig = MOVEMENT_TYPES.find((t) => t.value === movementType)!
  const needsReason = movementType === 'adjustment' || movementType === 'loss'
  const needsDest = movementType === 'transfer'

  // Product search
  function searchProducts(query: string): SearchSelectOption[] {
    const q = query.toLowerCase()
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode?.includes(q))
      .slice(0, 20)
      .map((p) => ({
        id: p.id,
        label: p.name,
        subtitle: [p.sku, `Stock: ${p.currentQuantity}`].filter(Boolean).join(' · '),
        group: p.productType,
        icon: <Package className="h-4 w-4 text-muted-foreground shrink-0" />,
        data: p,
      }))
  }

  // Auto-fill cost when product selected + fetch positions
  function handleProductSelect(id: string, option: SearchSelectOption | null) {
    setProductId(id)
    setProductLabel(option?.label ?? '')
    if (option?.data?.costPrice && unitCost === 0) {
      setUnitCost(option.data.costPrice)
    }
    // Fetch stock positions per location for this product
    if (id) {
      provider.getPositions(id).then(setPositions).catch(() => setPositions([]))
    } else {
      setPositions([])
    }
  }

  // Build a map of locationId → total quantity from positions
  const positionByLocation = useMemo(() => {
    const map: Record<string, number> = {}
    for (const pos of positions) {
      if (pos.stockLocationId) {
        map[pos.stockLocationId] = (map[pos.stockLocationId] ?? 0) + pos.quantity
      }
    }
    return map
  }, [positions])

  // Sort locations by stock position (highest first)
  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => (positionByLocation[b.id] ?? 0) - (positionByLocation[a.id] ?? 0))
  }, [locations, positionByLocation])

  const canProceedStep1 = !!productId
  const canProceedStep2 = quantity > 0 && (!needsReason || reason.trim()) && (!needsDest || destLocationId)
  const title = defaultType === 'entry' ? 'Stock Entry' : defaultType === 'exit' ? 'Stock Exit' : 'Stock Movement'

  async function handleSave() {
    if (!productId || quantity <= 0) return
    setSaving(true)
    try {
      const movement = await createMovement({
        productId,
        quantity,
        movementType,
        unitCost: unitCost || undefined,
        stockLocationId: locationId || undefined,
        destinationLocationId: destLocationId || undefined,
        reason: reason || undefined,
        documentNumber: documentNumber || undefined,
        notes: notes || undefined,
        batchNumber: batchNumber || undefined,
        expirationDate: expirationDate || undefined,
      })
      setSavedMovement(movement)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SubpageHeader
        title={title}
        subtitle={`Step ${step} of 3`}
        onBack={step > 1 ? () => setStep(step - 1) : onSaved}
      />

      {/* Progress bar */}
      <div className="flex gap-1">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      {/* Step 1: What — Type + Product */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Movement type selector */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Movement type</p>
            <div className="grid gap-2 sm:grid-cols-5">
              {MOVEMENT_TYPES.map((t) => {
                const Icon = t.icon
                const active = movementType === t.value
                return (
                  <button
                    key={t.value}
                    onClick={() => setMovementType(t.value)}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${active ? t.activeColor : 'border-transparent bg-card hover:bg-muted/30'}`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <p className="text-xs font-medium">{t.label}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 hidden sm:block">{t.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Product search */}
          <SearchSelect
            value={productId}
            displayValue={productLabel}
            onChange={handleProductSelect}
            onSearch={searchProducts}
            label="Product"
            required
            placeholder="Search by name, SKU, or barcode..."
            minChars={1}
            debounce={150}
            renderOption={(opt) => (
              <>
                {opt.icon}
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{opt.label}</p>
                  {opt.subtitle && <p className="text-[10px] text-muted-foreground">{opt.subtitle}</p>}
                </div>
              </>
            )}
          />

          {selectedProduct && (
            <div className="rounded-lg bg-muted/30 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{selectedProduct.name}</p>
                <p className="text-xs text-muted-foreground">
                  Current stock: <span className="font-medium">{selectedProduct.currentQuantity}</span>
                  {selectedProduct.minQuantity > 0 && <> &middot; Min: {selectedProduct.minQuantity}</>}
                  {selectedProduct.costPrice > 0 && <> &middot; Cost: {formatCurrency(selectedProduct.costPrice, currency)}</>}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium bg-muted text-muted-foreground capitalize">{selectedProduct.productType}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: How much — Quantity + Cost + Location */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Quantity *</label>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                  autoFocus
                  className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Unit Cost</label>
                <div className="flex items-center mt-1 rounded-lg border bg-background focus-within:ring-2 focus-within:ring-primary/20">
                  <span className="pl-2.5 text-xs text-muted-foreground">{currency.symbol}</span>
                  <input type="number" min={0} step={0.01} value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value) || 0)} className="flex-1 bg-transparent px-2 py-2 text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Total</label>
                <p className="mt-1 px-3 py-2 text-lg font-bold">{formatCurrency(totalCost, currency)}</p>
              </div>
            </div>

            {/* Location — radio-style selector with stock positions */}
            {modules.stockLocations && locations.length > 0 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{needsDest ? 'From Location' : 'Location'}</label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {sortedLocations.map((l) => {
                      const qty = positionByLocation[l.id] ?? 0
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setLocationId(l.id)}
                          className={cn(
                            'rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all flex items-center gap-2',
                            locationId === l.id
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/50',
                          )}
                        >
                          <span>{l.name}</span>
                          {productId && (
                            <span className={cn(
                              'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                              qty > 0
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-muted text-muted-foreground',
                            )}>
                              {qty}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {needsDest && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">To Location *</label>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {sortedLocations.filter((l) => l.id !== locationId).map((l) => {
                        const qty = positionByLocation[l.id] ?? 0
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => setDestLocationId(l.id)}
                            className={cn(
                              'rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all flex items-center gap-2',
                              destLocationId === l.id
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/50',
                            )}
                          >
                            <span>{l.name}</span>
                            {productId && (
                              <span className={cn(
                                'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                                qty > 0
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-muted text-muted-foreground',
                              )}>
                                {qty}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reason (required for adjustment/loss) */}
            {needsReason && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Reason *</label>
                <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={movementType === 'loss' ? 'e.g. Expired, damaged' : 'e.g. Physical count correction'} className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors">Back</button>
            <button onClick={() => setStep(3)} disabled={!canProceedStep2} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* Step 3: Review + Optional details + Save */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Summary card */}
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${typeConfig.activeColor}`}>
                <typeConfig.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{productLabel}</p>
                <p className="text-xs text-muted-foreground capitalize">{movementType} &middot; {quantity} units &middot; {formatCurrency(totalCost, currency)}</p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 text-xs border-t pt-3">
              <div><span className="text-muted-foreground">Quantity:</span> <span className="font-medium">{quantity}</span></div>
              <div><span className="text-muted-foreground">Unit Cost:</span> <span className="font-medium">{formatCurrency(unitCost, currency)}</span></div>
              <div><span className="text-muted-foreground">Total:</span> <span className="font-bold">{formatCurrency(totalCost, currency)}</span></div>
            </div>
          </div>

          {/* Optional details */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <p className="text-xs font-medium text-muted-foreground">Additional details (optional)</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Document Number</label>
                <input type="text" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="Invoice, receipt, PO..." className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              {modules.batchTracking && (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Batch Number</label>
                    <input type="text" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="e.g. LOT001" className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Expiration Date</label>
                    <DatePicker value={expirationDate} onChange={setExpirationDate} className="mt-1" />
                  </div>
                </>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional notes..." className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors">Back</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" /> {saving ? 'Recording...' : 'Record Movement'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
