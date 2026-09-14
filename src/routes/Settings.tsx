import { useState } from 'react'
import { requestAccessToken, signOut } from '../lib/google/auth'
import { ensureSchema } from '../lib/google/schema'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'

export default function Settings() {
  const { accessToken, email } = useAuthStore()
  const { sheetId, setSheetId } = useSettingsStore()
  const [sheetIdInput, setSheetIdInput] = useState(sheetId)
  const [error, setError] = useState<string | null>(null)
  const [schemaStatus, setSchemaStatus] = useState<string | null>(null)
  const [schemaBusy, setSchemaBusy] = useState(false)

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
    </div>
  )
}
