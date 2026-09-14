import { appendValues, batchGetValues, clearValues, updateValues } from './sheetsClient'

export async function addIngredient(
  spreadsheetId: string,
  name: string,
  category: string,
): Promise<void> {
  const [ingredientsR] = await batchGetValues(spreadsheetId, ['Ingredients!A2:A1000'])
  const exists = (ingredientsR.values ?? []).some(
    (r) => (r[0] ?? '').trim().toLowerCase() === name.trim().toLowerCase(),
  )
  if (exists) throw new Error(`Ingredient "${name}" already exists.`)
  await appendValues(spreadsheetId, 'Ingredients!A:B', [[name.trim(), category.trim()]])
}

export async function setIngredientCategory(
  spreadsheetId: string,
  name: string,
  category: string,
): Promise<void> {
  const [ingredientsR] = await batchGetValues(spreadsheetId, ['Ingredients!A2:A1000'])
  const rows = ingredientsR.values ?? []
  const idx = rows.findIndex((r) => (r[0] ?? '').trim() === name)
  if (idx === -1) throw new Error(`Ingredient "${name}" not found.`)
  const rowNumber = idx + 2
  await updateValues(spreadsheetId, `Ingredients!B${rowNumber}`, [[category]])
}

export async function deleteIngredient(spreadsheetId: string, name: string): Promise<void> {
  const [ingredientsR, riR] = await batchGetValues(spreadsheetId, [
    'Ingredients!A2:B1000',
    'RecipeIngredients!B2:B1000',
  ])

  const usedBy = (riR.values ?? []).some((r) => (r[0] ?? '').trim() === name)
  if (usedBy) {
    throw new Error(`"${name}" is used by at least one recipe — remove it there first.`)
  }

  const remaining = (ingredientsR.values ?? []).filter((r) => (r[0] ?? '').trim() !== name)
  await clearValues(spreadsheetId, 'Ingredients!A2:B1000')
  if (remaining.length > 0) {
    await updateValues(spreadsheetId, 'Ingredients!A2:B', remaining)
  }
}
