import React, { useEffect } from 'react'
import { useInventoryStore } from '../InventoryContext'
import { SubpageHeader } from '../../../components/layout/ModulePage'

export function RecipesView() {
  const recipes = useInventoryStore((s) => s.recipes)
  const recipesLoading = useInventoryStore((s) => s.recipesLoading)
  const fetchRecipes = useInventoryStore((s) => s.fetchRecipes)

  useEffect(() => { fetchRecipes() }, [])

  return (
    <div className="space-y-4">
      <SubpageHeader title="Recipes" subtitle="Production formulas and technical specs" />

      {recipesLoading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed border-muted">
          <p className="text-sm text-muted-foreground">No recipes yet</p>
          <p className="text-xs text-muted-foreground mt-1">Recipes define how to produce intermediate or final products</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <div key={r.id} className="rounded-lg border bg-card p-4 hover:bg-muted/20 transition-colors cursor-pointer">
              <h3 className="text-sm font-semibold">{r.name}</h3>
              {r.productName && <p className="text-xs text-muted-foreground mt-0.5">Produces: {r.productName}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {r.ingredientCount !== undefined && <span>{r.ingredientCount} ingredients</span>}
                {r.preparationTimeMinutes && <span>{r.preparationTimeMinutes} min</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
