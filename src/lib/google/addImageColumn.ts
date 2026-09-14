import { batchGetValues, updateValues } from './sheetsClient'

export async function ensureRecipeImageColumn(spreadsheetId: string): Promise<boolean> {
  const [header] = await batchGetValues(spreadsheetId, ['Recipes!C1'])
  const existing = header.values?.[0]?.[0]
  if (existing) return false
  await updateValues(spreadsheetId, 'Recipes!C1', [['Image']])
  return true
}
