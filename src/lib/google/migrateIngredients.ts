import { AH_CATEGORIES, matchAhCategory, suggestAhCategory } from './ahCategories'
import { appendValues, batchGetValues } from './sheetsClient'

export interface MigrateIngredientsResult {
  imported: number
  duplicatesSkipped: number
  conflicts: { ingredient: string; keptCategory: string; ignoredCategory: string }[]
  unmatchedCategories: { original: string; suggestion: string | null }[]
}

interface CleanRow {
  ingredient: string
  category: string
}

export async function migrateIngredients(spreadsheetId: string): Promise<MigrateIngredientsResult> {
  const [existingCheck, oldSheet] = await batchGetValues(spreadsheetId, [
    'Ingredients!A2:A2',
    'Ingredienten!A2:C1000',
  ])
  if ((existingCheck.values ?? []).length > 0) {
    throw new Error('Ingredients tab already has data — skipping to avoid duplicate rows.')
  }
  const rawRows = oldSheet.values ?? []

  const byKey = new Map<string, CleanRow>()
  const conflicts: MigrateIngredientsResult['conflicts'] = []
  const unmatchedSet = new Map<string, string | null>()
  let duplicatesSkipped = 0

  for (const row of rawRows) {
    const [rawCategory, rawIngredient] = row
    const ingredient = (rawIngredient ?? '').trim()
    const categoryRaw = (rawCategory ?? '').trim()
    if (!ingredient || !categoryRaw) continue

    const canonical = matchAhCategory(categoryRaw)
    const category = canonical ?? categoryRaw
    if (!canonical) {
      unmatchedSet.set(categoryRaw, suggestAhCategory(categoryRaw))
    }

    const key = ingredient.toLowerCase()
    const existing = byKey.get(key)
    if (existing) {
      duplicatesSkipped += 1
      if (existing.category !== category) {
        conflicts.push({ ingredient, keptCategory: existing.category, ignoredCategory: category })
      }
      continue
    }
    byKey.set(key, { ingredient, category })
  }

  const cleanRows = [...byKey.values()]

  if (cleanRows.length > 0) {
    await appendValues(
      spreadsheetId,
      'Ingredients!A:B',
      cleanRows.map((r) => [r.ingredient, r.category]),
    )
  }

  const categorySort = AH_CATEGORIES.map((category, i) => [category, i + 1])
  const extraCategories = [...unmatchedSet.keys()].filter(
    (c) => !AH_CATEGORIES.some((canonical) => canonical === c),
  )
  const extraRows = extraCategories.map((category, i) => [category, AH_CATEGORIES.length + i + 1])
  await appendValues(spreadsheetId, 'Categories!A:B', [...categorySort, ...extraRows])

  return {
    imported: cleanRows.length,
    duplicatesSkipped,
    conflicts,
    unmatchedCategories: [...unmatchedSet.entries()].map(([original, suggestion]) => ({
      original,
      suggestion,
    })),
  }
}
