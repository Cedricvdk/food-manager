import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import SheetGate from '../components/SheetGate'
import { useSheetData, type SheetData } from '../hooks/useSheetData'
import { aggregateShoppingList } from '../lib/shoppingList'
import { regenerateShoppingList, toggleShoppingListItem } from '../lib/google/shoppingListWrites'
import { addDays, toIsoDate } from '../lib/date'
import { useSettingsStore } from '../store/settingsStore'

export default function ShoppingList() {
  const { data, isLoading, error } = useSheetData()
  const sheetId = useSettingsStore((s) => s.sheetId)

  return (
    <SheetGate isLoading={isLoading} error={error}>
      <ShoppingListContent data={data!} sheetId={sheetId} />
    </SheetGate>
  )
}

function ShoppingListContent({ data, sheetId }: { data: SheetData; sheetId: string }) {
  const today = toIsoDate(new Date())
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(addDays(today, 6))
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['sheetData'] })

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateShoppingList(sheetId, aggregateShoppingList(data, startDate, endDate)),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof Error ? err.message : String(err)),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ ingredient, unit, checked }: { ingredient: string; unit: string; checked: boolean }) =>
      toggleShoppingListItem(sheetId, ingredient, unit, checked),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof Error ? err.message : String(err)),
  })

  const sortOrderByCategory = new Map(data.categories.map((c) => [c.category, c.sortOrder]))
  const byCategory = new Map<string, typeof data.shoppingList>()
  for (const item of data.shoppingList) {
    const list = byCategory.get(item.category) ?? []
    list.push(item)
    byCategory.set(item.category, list)
  }
  const categories = [...byCategory.keys()].sort(
    (a, b) => (sortOrderByCategory.get(a) ?? 999) - (sortOrderByCategory.get(b) ?? 999),
  )

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-slate-600">
            From
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block rounded-md border px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-sm text-slate-600">
            To
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block rounded-md border px-2 py-1.5 text-sm"
            />
          </label>
          <button
            onClick={() => {
              setError(null)
              regenerateMutation.mutate()
            }}
            disabled={regenerateMutation.isPending}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {regenerateMutation.isPending ? 'Generating…' : 'Regenerate shopping list'}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Rebuilds the list from planned recipes in that date range. Ticked items are kept ticked
          if the ingredient is still needed.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-slate-400">
          No shopping list yet — pick a date range and click "Regenerate".
        </p>
      ) : (
        categories.map((category) => (
          <div key={category} className="rounded-lg border bg-white p-4">
            <h2 className="mb-2 font-semibold text-slate-700">{category}</h2>
            <ul className="space-y-1">
              {byCategory
                .get(category)!
                .sort((a, b) => a.ingredient.localeCompare(b.ingredient))
                .map((item) => (
                  <li key={`${item.ingredient}-${item.unit}`} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) =>
                        toggleMutation.mutate({
                          ingredient: item.ingredient,
                          unit: item.unit,
                          checked: e.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <span className={item.checked ? 'text-slate-400 line-through' : 'text-slate-700'}>
                      {item.quantity} {item.unit} {item.ingredient}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))
      )}
    </div>
  )
}
