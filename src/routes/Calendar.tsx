import SheetGate from '../components/SheetGate'
import { useSheetData } from '../hooks/useSheetData'
import { formatDisplayDate, toIsoDate } from '../lib/date'

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

  return (
    <SheetGate isLoading={isLoading} error={error}>
      <div className="space-y-2">
        <h1 className="mb-3 text-lg font-semibold text-slate-700">Next 14 days</h1>
        {nextDays(14).map((date) => {
          const entry = data?.calendar.find((c) => c.date === date)
          return (
            <div
              key={date}
              className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
            >
              <span className="text-sm text-slate-500">{formatDisplayDate(date)}</span>
              <span className={entry?.recipe ? 'font-medium text-slate-700' : 'text-slate-400'}>
                {entry?.recipe || 'Nothing planned'}
              </span>
            </div>
          )
        })}
      </div>
    </SheetGate>
  )
}
