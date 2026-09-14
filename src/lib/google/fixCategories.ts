import { batchGetValues, clearValues, updateValues } from './sheetsClient'

const RENAMES: Record<string, string> = {
  'Groenten, aardappelen': 'Groente, aardappelen',
  'Aperitiefhapjes, chips, snacks': 'Borrel, chips, snacks',
  Bakbenodigdheden: 'Koek, snoep, chocolade',
}

export interface FixCategoriesResult {
  ingredientsUpdated: number
  categoryRowsRemoved: number
}

export async function fixDriftedCategories(spreadsheetId: string): Promise<FixCategoriesResult> {
  const [ingredientsSheet, categoriesSheet] = await batchGetValues(spreadsheetId, [
    'Ingredients!A2:B1000',
    'Categories!A2:B1000',
  ])

  const ingredientRows = ingredientsSheet.values ?? []
  let ingredientsUpdated = 0
  const fixedIngredients = ingredientRows.map(([name, category]) => {
    const renamed = RENAMES[category]
    if (renamed) ingredientsUpdated += 1
    return [name, renamed ?? category]
  })

  const categoryRows = categoriesSheet.values ?? []
  const filteredCategories = categoryRows.filter(([category]) => !(category in RENAMES))
  const categoryRowsRemoved = categoryRows.length - filteredCategories.length

  await clearValues(spreadsheetId, 'Ingredients!A2:B1000')
  if (fixedIngredients.length > 0) {
    await updateValues(spreadsheetId, 'Ingredients!A2:B', fixedIngredients)
  }

  await clearValues(spreadsheetId, 'Categories!A2:B1000')
  if (filteredCategories.length > 0) {
    await updateValues(spreadsheetId, 'Categories!A2:B', filteredCategories)
  }

  return { ingredientsUpdated, categoryRowsRemoved }
}
