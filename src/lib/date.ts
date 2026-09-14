export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function formatDisplayDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}
