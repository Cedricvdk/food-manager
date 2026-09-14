import { addSheets, getSheetTitles, updateValues } from './sheetsClient'

export const SCHEMA: Record<string, string[]> = {
  Recipes: ['Name', 'Link', 'Image'],
  Ingredients: ['Name', 'Category'],
  Categories: ['Category', 'SortOrder'],
  RecipeIngredients: ['Recipe', 'Ingredient', 'Quantity', 'Unit'],
  Calendar: ['Date', 'Recipe', 'CalendarEventId'],
  ShoppingList: ['Ingredient', 'Quantity', 'Unit', 'Category', 'Checked'],
}

export interface EnsureSchemaResult {
  created: string[]
  alreadyPresent: string[]
}

export async function ensureSchema(spreadsheetId: string): Promise<EnsureSchemaResult> {
  const existingTitles = await getSheetTitles(spreadsheetId)
  const existing = new Set(existingTitles)

  const tabNames = Object.keys(SCHEMA)
  const missing = tabNames.filter((name) => !existing.has(name))
  const alreadyPresent = tabNames.filter((name) => existing.has(name))

  if (missing.length > 0) {
    await addSheets(spreadsheetId, missing)
    for (const name of missing) {
      const headers = SCHEMA[name]
      const endCol = String.fromCharCode('A'.charCodeAt(0) + headers.length - 1)
      await updateValues(spreadsheetId, `${name}!A1:${endCol}1`, [headers])
    }
  }

  return { created: missing, alreadyPresent }
}
