import { batchGetValues, clearValues, updateValues } from './sheetsClient'

export async function updateRecipeMeta(
  spreadsheetId: string,
  name: string,
  link: string,
  image: string,
): Promise<void> {
  const [recipesR] = await batchGetValues(spreadsheetId, ['Recipes!A2:A1000'])
  const rows = recipesR.values ?? []
  const idx = rows.findIndex((r) => (r[0] ?? '').trim() === name)
  if (idx === -1) throw new Error(`Recipe "${name}" not found.`)
  const rowNumber = idx + 2
  await updateValues(spreadsheetId, `Recipes!B${rowNumber}:C${rowNumber}`, [[link, image]])
}

export interface RecipeIngredientRow {
  ingredient: string
  quantity: string
  unit: string
}

export async function saveRecipeIngredients(
  spreadsheetId: string,
  recipeName: string,
  ingredients: RecipeIngredientRow[],
): Promise<void> {
  const [riR] = await batchGetValues(spreadsheetId, ['RecipeIngredients!A2:D1000'])
  const others = (riR.values ?? []).filter((r) => (r[0] ?? '').trim() !== recipeName)
  const newRows = ingredients
    .filter((i) => i.ingredient.trim())
    .map((i) => [recipeName, i.ingredient.trim(), i.quantity.trim(), i.unit.trim()])
  const finalRows = [...others, ...newRows]

  await clearValues(spreadsheetId, 'RecipeIngredients!A2:D1000')
  if (finalRows.length > 0) {
    await updateValues(spreadsheetId, 'RecipeIngredients!A2:D', finalRows)
  }
}
