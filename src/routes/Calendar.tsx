import { useMutation, useQueryClient } from '@tanstack/react-query'
import SheetGate from '../components/SheetGate'
import { useSheetData } from '../hooks/useSheetData'
import { setCalendarRecipe } from '../lib/google/calendarWrites'
import { formatDisplayDate, toIsoDate } from '../lib/date'
import { useSettingsStore } from '../store/settingsStore'

function nextDays(n: number): string[] {
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return toIsoDate(d)
  })
}

export default function Calendar() {
  const { data, isLoading, error } = useSheetData()
  const sheetId = useSettingsStore((s) => s.sheetId)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ date, recipeName }: { date: string; recipeName: string }) =>
      setCalendarRecipe(sheetId, date, recipeName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sheetData'] }),
  })

  return (
    <SheetGate isLoading={isLoading} error={error}>
      <div className="space-y-2">
        <h1 className="mb-3 text-lg font-semibold text-slate-700">Next 14 days</h1>
        {nextDays(14).map((date) => {
          const entry = data?.calendar.find((c) => c.date === date)
          const recipe = data?.recipes.find((r) => r.name === entry?.recipe)
          return (
            <div
              key={date}
              className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3"
            >
              <span className="w-16 shrink-0 text-sm text-slate-500">{formatDisplayDate(date)}</span>
              {recipe?.image ? (
                <img src={recipe.image} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
              ) : (
                <div className="h-8 w-8 shrink-0 rounded bg-slate-100" />
              )}
              <select
                value={entry?.recipe ?? ''}
                onChange={(e) => mutation.mutate({ date, recipeName: e.target.value })}
                className="flex-1 rounded-md border px-2 py-1.5 text-sm"
              >
                <option value="">Nothing planned</option>
                {(data?.recipes ?? []).map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>
    </SheetGate>
  )
}
