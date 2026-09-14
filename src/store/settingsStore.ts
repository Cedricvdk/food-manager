import { create } from 'zustand'

const SHEET_ID_KEY = 'fm_sheet_id'

interface SettingsState {
  sheetId: string
  setSheetId: (id: string) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  sheetId: localStorage.getItem(SHEET_ID_KEY) ?? '',
  setSheetId: (id) => {
    localStorage.setItem(SHEET_ID_KEY, id)
    set({ sheetId: id })
  },
}))
