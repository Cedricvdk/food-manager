import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import SheetGate from '../components/SheetGate'
import { useSheetData, type SheetData } from '../hooks/useSheetData'
import { addIngredient, deleteIngredient, setIngredientCategory } from '../lib/google/ingredientWrites'
import { useSettingsStore } from '../store/settingsStore'

export default function IngredientsAdmin() {
  const { data, isLoading, error } = useSheetData()
  const sheetId = useSettingsStore((s) => s.sheetId)

  return (
    <SheetGate isLoading={isLoading} error={error}>
      <IngredientsAdminContent data={data!} sheetId={sheetId} />
    </SheetGate>
  )
}

function IngredientsAdminContent({ data, sheetId }: { data: SheetData; sheetId: string }) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['sheetData'] })

  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState(data.categories[0]?.category ?? '')
  const [error, setError] = useState<string | null>(null)

  const addMutation = useMutation({
    mutationFn: () => addIngredient(sheetId, newName, newCategory),
    onSuccess: () => {
      setNewName('')
      invalidate()
    },
    onError: (err) => setError(err instanceof Error ? err.message : String(err)),
  })

  const categoryMutation = useMutation({
    mutationFn: ({ name, category }: { name: string; category: string }) =>
      setIngredientCategory(sheetId, name, category),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof Error ? err.message : String(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (name: string) => deleteIngredient(sheetId, name),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof Error ? err.message : String(err)),
  })

  const sortOrderByCategory = new Map(data.categories.map((c) => [c.category, c.sortOrder]))
  const byCategory = new Map<string, string[]>()
  for (const ingredient of data.ingredients) {
    const list = byCategory.get(ingredient.category) ?? []
    list.push(ingredient.name)
    byCategory.set(ingredient.category, list)
  }
  const categories = [...byCategory.keys()].sort(
    (a, b) => (sortOrderByCategory.get(a) ?? 999) - (sortOrderByCategory.get(b) ?? 999),
  )
  const allCategoryOptions = data.categories
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => c.category)

  const busy = addMutation.isPending || categoryMutation.isPending || deleteMutation.isPending

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 font-semibold text-slate-700">Add ingredient</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="ingredient name"
            className="flex-1 min-w-32 rounded-md border px-2 py-1.5 text-sm"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="rounded-md border px-2 py-1.5 text-sm"
          >
            {allCategoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setError(null)
              addMutation.mutate()
            }}
            disabled={busy || !newName.trim()}
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-slate-400">No ingredients yet.</p>
      ) : (
        categories.map((category) => (
          <div key={category} className="rounded-lg border bg-white p-4">
            <h2 className="mb-2 font-semibold text-slate-700">{category}</h2>
            <div className="space-y-1">
              {byCategory
                .get(category)!
                .sort((a, b) => a.localeCompare(b))
                .map((name) => (
                  <div key={name} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="flex-1">{name}</span>
                    <select
                      value={category}
                      disabled={busy}
                      onChange={(e) => {
                        setError(null)
                        categoryMutation.mutate({ name, category: e.target.value })
                      }}
                      className="rounded-md border px-2 py-1 text-xs"
                    >
                      {allCategoryOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={busy}
                      onClick={() => {
                        setError(null)
                        deleteMutation.mutate(name)
                      }}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
