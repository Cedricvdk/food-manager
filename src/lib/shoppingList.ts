import type { SheetData } from '../hooks/useSheetData'

const UNIT_CONVERSIONS: Record<string, { base: string; factor: number }> = {
  gram: { base: 'gram', factor: 1 },
  kg: { base: 'gram', factor: 1000 },
  kilogram: { base: 'gram', factor: 1000 },
  milliliter: { base: 'milliliter', factor: 1 },
  liter: { base: 'milliliter', factor: 1000 },
}

function canonicalUnit(unit: string): { base: string; factor: number } {
  const key = unit.trim().toLowerCase()
  return UNIT_CONVERSIONS[key] ?? { base: key, factor: 1 }
}

export interface AggregatedItem {
  ingredient: string
  quantity: number
  unit: string
  category: string
}

export function aggregateShoppingList(
  data: SheetData,
  startDate: string,
  endDate: string,
): AggregatedItem[] {
  const recipesInRange = new Set(
    data.calendar
      .filter((c) => c.recipe && c.date >= startDate && c.date <= endDate)
      .map((c) => c.recipe),
  )

  const categoryByIngredient = new Map(
    data.ingredients.map((i) => [i.name.toLowerCase(), i.category]),
  )

  interface Bucket {
    ingredient: string
    unit: string
    quantity: number
  }
  const buckets = new Map<string, Bucket>()

  for (const ri of data.recipeIngredients) {
    if (!recipesInRange.has(ri.recipe)) continue
    const qty = parseFloat(ri.quantity)
    if (Number.isNaN(qty)) continue

    const { base, factor } = canonicalUnit(ri.unit)
    const key = `${ri.ingredient.toLowerCase()}|${base}`
    const existing = buckets.get(key)
    if (existing) {
      existing.quantity += qty * factor
    } else {
      buckets.set(key, { ingredient: ri.ingredient, unit: base, quantity: qty * factor })
    }
  }

  return [...buckets.values()].map((b) => ({
    ingredient: b.ingredient,
    quantity: b.quantity,
    unit: b.unit,
    category: categoryByIngredient.get(b.ingredient.toLowerCase()) ?? 'Overig',
  }))
}
