import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import SheetGate from '../components/SheetGate'
import { useSheetData, type SheetData } from '../hooks/useSheetData'
import { setCalendarRecipe, syncCalendarToGoogle, type CalendarSyncSummary } from '../lib/google/calendarWrites'
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

  return (
    <SheetGate isLoading={isLoading} error={error}>
      <CalendarContent data={data!} sheetId={sheetId} />
    </SheetGate>
  )
}

function CalendarContent({ data, sheetId }: { data: SheetData; sheetId: string }) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['sheetData'] })
  const days = nextDays(14)
  const [syncError, setSyncError] = useState<string | null>(null)

  const assignMutation = useMutation({
    mutationFn: ({ date, recipeName }: { date: string; recipeName: string }) =>
      setCalendarRecipe(sheetId, date, recipeName),
    onSuccess: invalidate,
  })

  const syncMutation = useMutation({
    mutationFn: () => syncCalendarToGoogle(sheetId, days, data.recipes),
    onSuccess: invalidate,
    onError: (err) => setSyncError(err instanceof Error ? err.message : String(err)),
  })

  function summaryText(s: CalendarSyncSummary): string {
    const parts: string[] = []
    if (s.created > 0) parts.push(`${s.created} created`)
    if (s.updated > 0) parts.push(`${s.updated} updated`)
    if (s.deleted > 0) parts.push(`${s.deleted} removed`)
    return parts.join(', ') || 'Nothing to sync.'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-700">Next 14 days</h1>
        <button
          onClick={() => {
            setSyncError(null)
            syncMutation.mutate()
          }}
          disabled={syncMutation.isPending}
          className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {syncMutation.isPending ? 'Syncing…' : 'Sync to Calendar'}
        </button>
      </div>
      {syncError && <p className="text-sm text-red-600">{syncError}</p>}
      {syncMutation.isSuccess && !syncError && (
        <p className="text-sm text-emerald-700">{summaryText(syncMutation.data)}</p>
      )}

      <div className="space-y-2">
        {days.map((date) => {
          const entry = data.calendar.find((c) => c.date === date)
          const recipe = data.recipes.find((r) => r.name === entry?.recipe)
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
                onChange={(e) => assignMutation.mutate({ date, recipeName: e.target.value })}
                className="flex-1 rounded-md border px-2 py-1.5 text-sm"
              >
                <option value="">Nothing planned</option>
                {data.recipes.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
