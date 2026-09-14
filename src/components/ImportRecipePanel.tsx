import { useState } from 'react'
import { importRecipe, type ImportRecipeInput } from '../lib/google/importRecipe'
import { useSettingsStore } from '../store/settingsStore'

export default function ImportRecipePanel({ onImported }: { onImported: () => void }) {
  const sheetId = useSettingsStore((s) => s.sheetId)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  async function handleImport() {
    setError(null)
    setResult(null)
    let parsed: ImportRecipeInput
    try {
      parsed = JSON.parse(text)
    } catch {
      setError('That is not valid JSON — paste the exact block Claude gave you.')
      return
    }
    setBusy(true)
    try {
      const res = await importRecipe(sheetId, parsed)
      setResult(
        `Imported "${parsed.name}" with ${res.recipeIngredientRows} ingredient row(s)` +
          (res.addedIngredients.length > 0
            ? ` (${res.addedIngredients.length} new ingredient(s) added: ${res.addedIngredients.join(', ')})`
            : ''),
      )
      setText('')
      onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-semibold text-slate-700"
      >
        {open ? '▾' : '▸'} Import recipe (paste from Claude)
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-slate-500">
            Send Claude a recipe link or text in chat, then paste the JSON block it gives you here.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder='{"name": "...", "link": "...", "ingredients": [...]}'
            className="w-full rounded-md border px-3 py-2 font-mono text-xs"
          />
          <button
            onClick={handleImport}
            disabled={busy || !text.trim()}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? 'Importing…' : 'Import'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {result && <p className="text-sm text-emerald-700">{result}</p>}
        </div>
      )}
    </div>
  )
}
