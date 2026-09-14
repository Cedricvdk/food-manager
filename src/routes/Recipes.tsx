import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import SheetGate from '../components/SheetGate'
import ImportRecipePanel from '../components/ImportRecipePanel'
import { useSheetData } from '../hooks/useSheetData'

export default function Recipes() {
  const { data, isLoading, error } = useSheetData()
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const recipes = (data?.recipes ?? []).filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <SheetGate isLoading={isLoading} error={error}>
      <div className="space-y-3">
        <ImportRecipePanel
          onImported={() => queryClient.invalidateQueries({ queryKey: ['sheetData'] })}
        />
        <input
          type="text"
          placeholder="Search recipes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <ul className="divide-y rounded-lg border bg-white">
          {recipes.map((r) => (
            <li key={r.name}>
              <Link
                to={`/recipes/${encodeURIComponent(r.name)}`}
                className="block px-4 py-3 hover:bg-slate-50"
              >
                {r.name}
              </Link>
            </li>
          ))}
          {recipes.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">No recipes yet.</li>
          )}
        </ul>
      </div>
    </SheetGate>
  )
}
