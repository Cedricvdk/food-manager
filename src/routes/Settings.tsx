import { useState } from 'react'
import { requestAccessToken, signOut } from '../lib/google/auth'
import { ensureSchema } from '../lib/google/schema'
import { migrateIngredients, type MigrateIngredientsResult } from '../lib/google/migrateIngredients'
import { fixDriftedCategories, type FixCategoriesResult } from '../lib/google/fixCategories'
import { ensureRecipeImageColumn } from '../lib/google/addImageColumn'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'

export default function Settings() {
  const { accessToken, email } = useAuthStore()
  const { sheetId, setSheetId } = useSettingsStore()
  const [sheetIdInput, setSheetIdInput] = useState(sheetId)
  const [error, setError] = useState<string | null>(null)
  const [schemaStatus, setSchemaStatus] = useState<string | null>(null)
  const [schemaBusy, setSchemaBusy] = useState(false)
  const [migrateResult, setMigrateResult] = useState<MigrateIngredientsResult | null>(null)
  const [migrateError, setMigrateError] = useState<string | null>(null)
  const [migrateBusy, setMigrateBusy] = useState(false)
  const [fixResult, setFixResult] = useState<FixCategoriesResult | null>(null)
  const [fixError, setFixError] = useState<string | null>(null)
  const [fixBusy, setFixBusy] = useState(false)
  const [imageColStatus, setImageColStatus] = useState<string | null>(null)
  const [imageColBusy, setImageColBusy] = useState(false)

  const isSignedIn = !!accessToken

  async function handleEnsureSchema() {
    setSchemaStatus(null)
    setSchemaBusy(true)
    try {
      const result = await ensureSchema(sheetId)
      const parts: string[] = []
      if (result.created.length > 0) parts.push(`Created: ${result.created.join(', ')}`)
      if (result.alreadyPresent.length > 0) parts.push(`Already there: ${result.alreadyPresent.join(', ')}`)
      setSchemaStatus(parts.join(' — ') || 'Nothing to do.')
    } catch (err) {
      setSchemaStatus(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSchemaBusy(false)
    }
  }

  async function handleMigrateIngredients() {
    setMigrateError(null)
    setMigrateResult(null)
    setMigrateBusy(true)
    try {
      const result = await migrateIngredients(sheetId)
      setMigrateResult(result)
    } catch (err) {
      setMigrateError(err instanceof Error ? err.message : String(err))
    } finally {
      setMigrateBusy(false)
    }
  }

  async function handleFixCategories() {
    setFixError(null)
    setFixResult(null)
    setFixBusy(true)
    try {
      const result = await fixDriftedCategories(sheetId)
      setFixResult(result)
    } catch (err) {
      setFixError(err instanceof Error ? err.message : String(err))
    } finally {
      setFixBusy(false)
    }
  }

  async function handleAddImageColumn() {
    setImageColStatus(null)
    setImageColBusy(true)
    try {
      const added = await ensureRecipeImageColumn(sheetId)
      setImageColStatus(added ? 'Added the Image column header.' : 'Already there.')
    } catch (err) {
      setImageColStatus(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setImageColBusy(false)
    }
  }

  async function handleSignIn() {
    setError(null)
    try {
      await requestAccessToken({ silent: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-700">Google account</h2>
        {isSignedIn ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Signed in{email ? <> as <span className="font-medium">{email}</span></> : null}
            </p>
            <button
              onClick={signOut}
              className="rounded-md border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={handleSignIn}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Sign in with Google
            </button>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-700">Google Sheet</h2>
        <label className="block text-sm text-slate-600">
          Spreadsheet ID (from the sheet's URL, between <code>/d/</code> and <code>/edit</code>)
          <input
            type="text"
            value={sheetIdInput}
            onChange={(e) => setSheetIdInput(e.target.value)}
            placeholder="1_1xMUsJELeuyqetilZJm4uD4YdH71WS6OgPWAwvFLFk"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <button
          onClick={() => setSheetId(sheetIdInput.trim())}
          className="mt-3 rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Save
        </button>
        {sheetId && <p className="mt-2 text-sm text-emerald-700">Saved.</p>}
      </section>

      {isSignedIn && sheetId && (
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-1 font-semibold text-slate-700">Sheet schema</h2>
          <p className="mb-3 text-sm text-slate-500">
            Creates the app's tabs (Recipes, Ingredients, Categories, RecipeIngredients, Calendar,
            ShoppingList) in your sheet if they don't already exist. Never touches or deletes any
            existing tabs.
          </p>
          <button
            onClick={handleEnsureSchema}
            disabled={schemaBusy}
            className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {schemaBusy ? 'Working…' : 'Set up / check sheet tabs'}
          </button>
          {schemaStatus && <p className="mt-2 text-sm text-slate-600">{schemaStatus}</p>}
        </section>
      )}

      {isSignedIn && sheetId && (
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-1 font-semibold text-slate-700">Migrate old ingredient data</h2>
          <p className="mb-3 text-sm text-slate-500">
            One-time import: reads your old <code>Ingredienten</code> tab, de-dupes it, cross-checks
            every category against Albert Heijn's current real category names, and writes the
            cleaned result into <code>Ingredients</code> and <code>Categories</code>. Only runs if
            those tabs are still empty — safe to click once.
          </p>
          <button
            onClick={handleMigrateIngredients}
            disabled={migrateBusy}
            className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {migrateBusy ? 'Working…' : 'Migrate ingredient / category data'}
          </button>
          {migrateError && <p className="mt-2 text-sm text-red-600">{migrateError}</p>}
          {migrateResult && (
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                Imported <span className="font-medium">{migrateResult.imported}</span> ingredients
                {migrateResult.duplicatesSkipped > 0 && (
                  <> ({migrateResult.duplicatesSkipped} duplicate rows skipped)</>
                )}
                .
              </p>
              {migrateResult.conflicts.length > 0 && (
                <div>
                  <p className="font-medium text-amber-700">
                    {migrateResult.conflicts.length} ingredient(s) had conflicting categories (kept
                    the first one seen):
                  </p>
                  <ul className="ml-4 list-disc">
                    {migrateResult.conflicts.map((c) => (
                      <li key={c.ingredient}>
                        {c.ingredient}: kept "{c.keptCategory}", ignored "{c.ignoredCategory}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {migrateResult.unmatchedCategories.length > 0 && (
                <div>
                  <p className="font-medium text-amber-700">
                    {migrateResult.unmatchedCategories.length} category name(s) didn't match AH's
                    current categories exactly (kept as-is — review in the Ingredients admin page):
                  </p>
                  <ul className="ml-4 list-disc">
                    {migrateResult.unmatchedCategories.map((u) => (
                      <li key={u.original}>
                        "{u.original}"{u.suggestion && <> — maybe "{u.suggestion}"?</>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {isSignedIn && sheetId && (
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-1 font-semibold text-slate-700">Fix drifted category names</h2>
          <p className="mb-3 text-sm text-slate-500">
            Applies the 3 known renames from the migration above: "Groenten, aardappelen" →
            "Groente, aardappelen", "Aperitiefhapjes, chips, snacks" → "Borrel, chips, snacks", and
            folds "Bakbenodigdheden" into "Koek, snoep, chocolade". Safe to click more than once.
          </p>
          <button
            onClick={handleFixCategories}
            disabled={fixBusy}
            className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {fixBusy ? 'Working…' : 'Fix drifted categories'}
          </button>
          {fixError && <p className="mt-2 text-sm text-red-600">{fixError}</p>}
          {fixResult && (
            <p className="mt-2 text-sm text-emerald-700">
              Updated {fixResult.ingredientsUpdated} ingredient row(s), removed{' '}
              {fixResult.categoryRowsRemoved} redundant category row(s).
            </p>
          )}
        </section>
      )}

      {isSignedIn && sheetId && (
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-1 font-semibold text-slate-700">Add recipe image column</h2>
          <p className="mb-3 text-sm text-slate-500">
            Adds an "Image" header to the <code>Recipes</code> tab (column C) so future imports can
            carry a thumbnail. Safe to click more than once.
          </p>
          <button
            onClick={handleAddImageColumn}
            disabled={imageColBusy}
            className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {imageColBusy ? 'Working…' : 'Add Image column'}
          </button>
          {imageColStatus && <p className="mt-2 text-sm text-slate-600">{imageColStatus}</p>}
        </section>
      )}
    </div>
  )
}
