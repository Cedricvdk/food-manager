import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'

export default function SheetGate({
  isLoading,
  error,
  children,
}: {
  isLoading: boolean
  error: Error | null
  children: ReactNode
}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const sheetId = useSettingsStore((s) => s.sheetId)

  if (!accessToken || !sheetId) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        <p className="mb-2">Sign in and set your Sheet ID first.</p>
        <Link to="/settings" className="text-emerald-700 underline">
          Go to Settings
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Loading…</div>
  }

  if (error) {
    return <p className="rounded-lg border bg-white p-4 text-sm text-red-600">{error.message}</p>
  }

  return <>{children}</>
}
