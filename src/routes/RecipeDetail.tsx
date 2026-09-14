import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import SheetGate from '../components/SheetGate'
import { useSheetData, type SheetData } from '../hooks/useSheetData'
import { updateRecipeMeta, saveRecipeIngredients, type RecipeIngredientRow } from '../lib/google/recipeWrites'
import { addIngredient } from '../lib/google/ingredientWrites'
import { useSettingsStore } from '../store/settingsStore'

export default function RecipeDetail() {
  const { name } = useParams<{ name: string }>()
  const decodedName = decodeURIComponent(name ?? '')
  const { data, isLoading, error } = useSheetData()
  const sheetId = useSettingsStore((s) => s.sheetId)
  const queryClient = useQueryClient()

  return (
    <SheetGate isLoading={isLoading} error={error}>
      <RecipeDetailContent
        key={decodedName}
        name={decodedName}
        data={data!}
        sheetId={sheetId}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['sheetData'] })}
      />
    </SheetGate>
  )
}

function RecipeDetailContent({
  name,
  data,
  sheetId,
  onSaved,
}: {
  name: string
  data: SheetData
  sheetId: string
  onSaved: () => void
}) {
  const recipe = data.recipes.find((r) => r.name === name)
  const existingIngredientNames = new Set(data.ingredients.map((i) => i.name.toLowerCase()))
  const categoryFor = (ingredientName: string) =>
    data.ingredients.find((i) => i.name.toLowerCase() === ingredientName.toLowerCase())?.category

  const [editing, setEditing] = useState(false)
  const [link, setLink] = useState(recipe?.link ?? '')
  const [image, setImage] = useState(recipe?.image ?? '')
  const [rows, setRows] = useState<RecipeIngredientRow[]>(
    data.recipeIngredients
      .filter((ri) => ri.recipe === name)
      .map((ri) => ({ ingredient: ri.ingredient, quantity: ri.quantity, unit: ri.unit })),
  )
  const [newCategories, setNewCategories] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!recipe) {
    return (
      <div className="space-y-3">
        <Link to="/recipes" className="text-sm text-emerald-700 underline">
          ← Back to recipes
        </Link>
        <p className="text-slate-500">Recipe not found.</p>
      </div>
    )
  }

  function updateRow(i: number, patch: Partial<RecipeIngredientRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i))
  }

  function addRow() {
    setRows((prev) => [...prev, { ingredient: '', quantity: '', unit: '' }])
  }

  async function handleSave() {
    setError(null)
    const cleanRows = rows.filter((r) => r.ingredient.trim())
    const missingCategory = cleanRows.find(
      (r) => !existingIngredientNames.has(r.ingredient.trim().toLowerCase()) && !newCategories[r.ingredient.trim()]?.trim(),
    )
    if (missingCategory) {
      setError(`"${missingCategory.ingredient}" is a new ingredient — pick a category for it below.`)
      return
    }

    setSaving(true)
    try {
      await updateRecipeMeta(sheetId, name, link.trim(), image.trim())
      await saveRecipeIngredients(sheetId, name, cleanRows)
      for (const r of cleanRows) {
        const key = r.ingredient.trim()
        if (!existingIngredientNames.has(key.toLowerCase()) && newCategories[key]) {
          await addIngredient(sheetId, key, newCategories[key])
        }
      }
      onSaved()
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Link to="/recipes" className="text-sm text-emerald-700 underline">
          ← Back to recipes
        </Link>
        {(editing ? image : recipe.image) && (
          <img
            src={editing ? image : recipe.image}
            alt={recipe.name}
            className="mt-2 h-48 w-full rounded-lg object-cover"
          />
        )}
        <h1 className="mt-2 text-xl font-semibold text-slate-700">{recipe.name}</h1>

        {editing ? (
          <div className="mt-2 space-y-2">
            <label className="block text-sm text-slate-600">
              Source link
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
              />
            </label>
            <label className="block text-sm text-slate-600">
              Image URL
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
              />
            </label>
          </div>
        ) : (
          recipe.link && (
            <a
              href={recipe.link}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-slate-500 underline"
            >
              Source
            </a>
          )
        )}
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Ingredients</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-emerald-700 underline"
            >
              Edit
            </button>
          )}
        </div>

        {!editing ? (
          rows.length === 0 ? (
            <p className="text-sm text-slate-400">No ingredients recorded yet.</p>
          ) : (
            <ul className="space-y-1 text-sm text-slate-600">
              {rows.map((ri) => (
                <li key={ri.ingredient}>
                  {ri.quantity} {ri.unit} {ri.ingredient}
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="space-y-2">
            {rows.map((row, i) => {
              const isNew =
                row.ingredient.trim() && !existingIngredientNames.has(row.ingredient.trim().toLowerCase())
              return (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={row.quantity}
                    onChange={(e) => updateRow(i, { quantity: e.target.value })}
                    placeholder="qty"
                    className="w-16 rounded-md border px-2 py-1 text-sm"
                  />
                  <input
                    type="text"
                    value={row.unit}
                    onChange={(e) => updateRow(i, { unit: e.target.value })}
                    placeholder="unit"
                    className="w-20 rounded-md border px-2 py-1 text-sm"
                  />
                  <input
                    type="text"
                    value={row.ingredient}
                    onChange={(e) => updateRow(i, { ingredient: e.target.value })}
                    placeholder="ingredient"
                    className="flex-1 min-w-32 rounded-md border px-2 py-1 text-sm"
                  />
                  {isNew && (
                    <input
                      type="text"
                      value={newCategories[row.ingredient.trim()] ?? ''}
                      onChange={(e) =>
                        setNewCategories((prev) => ({ ...prev, [row.ingredient.trim()]: e.target.value }))
                      }
                      placeholder="new — AH category?"
                      className="w-40 rounded-md border border-amber-300 px-2 py-1 text-sm"
                    />
                  )}
                  {!isNew && row.ingredient.trim() && (
                    <span className="text-xs text-slate-400">{categoryFor(row.ingredient)}</span>
                  )}
                  <button
                    onClick={() => removeRow(i)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )
            })}
            <button onClick={addRow} className="text-sm text-emerald-700 underline">
              + Add ingredient
            </button>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-md border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
