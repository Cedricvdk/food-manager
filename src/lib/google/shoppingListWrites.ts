import { batchGetValues, clearValues, updateValues } from './sheetsClient'
import type { AggregatedItem } from '../shoppingList'

export async function regenerateShoppingList(
  spreadsheetId: string,
  items: AggregatedItem[],
): Promise<void> {
  const [existingR] = await batchGetValues(spreadsheetId, ['ShoppingList!A2:E1000'])
  const checkedByKey = new Map<string, boolean>()
  for (const row of existingR.values ?? []) {
    const key = `${(row[0] ?? '').trim().toLowerCase()}|${(row[2] ?? '').trim().toLowerCase()}`
    checkedByKey.set(key, (row[4] ?? '').trim().toUpperCase() === 'TRUE')
  }

  const rows = items.map((item) => {
    const key = `${item.ingredient.toLowerCase()}|${item.unit.toLowerCase()}`
    const checked = checkedByKey.get(key) ?? false
    return [item.ingredient, roundQuantity(item.quantity), item.unit, item.category, checked]
  })

  await clearValues(spreadsheetId, 'ShoppingList!A2:E1000')
  if (rows.length > 0) {
    await updateValues(spreadsheetId, 'ShoppingList!A2:E', rows)
  }
}

export async function toggleShoppingListItem(
  spreadsheetId: string,
  ingredient: string,
  unit: string,
  checked: boolean,
): Promise<void> {
  const [rowsR] = await batchGetValues(spreadsheetId, ['ShoppingList!A2:C1000'])
  const rows = rowsR.values ?? []
  const idx = rows.findIndex(
    (r) => (r[0] ?? '').trim() === ingredient && (r[2] ?? '').trim() === unit,
  )
  if (idx === -1) return
  const rowNumber = idx + 2
  await updateValues(spreadsheetId, `ShoppingList!E${rowNumber}`, [[checked]])
}

function roundQuantity(n: number): number {
  return Math.round(n * 100) / 100
}
