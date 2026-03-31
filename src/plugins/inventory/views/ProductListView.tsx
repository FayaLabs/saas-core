import React, { useEffect, useState } from 'react'
import { Search, Plus, Package } from 'lucide-react'
import { useInventoryConfig, useInventoryStore, formatCurrency } from '../InventoryContext'
import { SubpageHeader } from '../../../components/layout/ModulePage'
import { TableSkeleton } from '../../../components/ui/skeleton'
import type { ProductType } from '../types'

export function ProductListView({ onNew, onEdit }: {
  onNew?: () => void
  onEdit?: (id: string) => void
}) {
  const { currency, productTypes } = useInventoryConfig()
  const products = useInventoryStore((s) => s.products)
  const productsTotal = useInventoryStore((s) => s.productsTotal)
  const productsLoading = useInventoryStore((s) => s.productsLoading)
  const fetchProducts = useInventoryStore((s) => s.fetchProducts)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ProductType | undefined>()

  useEffect(() => {
    fetchProducts({ productType: typeFilter, search: search || undefined })
  }, [typeFilter, search])

  return (
    <div className="space-y-4">
      <SubpageHeader
        title="Products"
        subtitle={`${productsTotal} products`}
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {onNew && (
          <button onClick={onNew} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" /> New Product
          </button>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setTypeFilter(undefined)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${!typeFilter ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
        >
          All
        </button>
        {productTypes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value as ProductType)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${typeFilter === t.value ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {productsLoading ? (
        <TableSkeleton columns={5} />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed border-muted">
          <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No products yet</p>
          {onNew && <button onClick={onNew} className="text-xs text-primary hover:underline mt-1">Create your first product</button>}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Product</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Type</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Stock</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Cost</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Value</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} onClick={() => onEdit?.(p.id)} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.name}</p>
                    {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground capitalize">{p.productType}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={p.currentQuantity <= p.minQuantity ? 'text-red-500 font-medium' : ''}>{p.currentQuantity}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(p.costPrice, currency)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.currentQuantity * p.costPrice, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
