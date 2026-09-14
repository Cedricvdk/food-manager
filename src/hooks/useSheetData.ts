import { useQuery } from '@tanstack/react-query'
import { batchGetValues } from '../lib/google/sheetsClient'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import type { CalendarEntry, Category, Ingredient, Recipe, RecipeIngredient } from '../types/sheet'

export interface SheetData {
  recipes: Recipe[]
  ingredients: Ingredient[]
  categories: Category[]
  recipeIngredients: RecipeIngredient[]
  calendar: CalendarEntry[]
}

export function useSheetData() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const sheetId = useSettingsStore((s) => s.sheetId)

  return useQuery<SheetData>({
    queryKey: ['sheetData', sheetId],
    enabled: !!accessToken && !!sheetId,
    staleTime: 60_000,
    queryFn: async () => {
      const [recipesR, ingredientsR, categoriesR, recipeIngredientsR, calendarR] = await batchGetValues(
        sheetId,
        [
          'Recipes!A2:B1000',
          'Ingredients!A2:B1000',
          'Categories!A2:B1000',
          'RecipeIngredients!A2:D1000',
          'Calendar!A2:C1000',
        ],
      )

      const recipes: Recipe[] = (recipesR.values ?? [])
        .filter((r) => r[0]?.trim())
        .map((r) => ({ name: r[0].trim(), link: (r[1] ?? '').trim() }))

      const ingredients: Ingredient[] = (ingredientsR.values ?? [])
        .filter((r) => r[0]?.trim())
        .map((r) => ({ name: r[0].trim(), category: (r[1] ?? '').trim() }))

      const categories: Category[] = (categoriesR.values ?? [])
        .filter((r) => r[0]?.trim())
        .map((r) => ({ category: r[0].trim(), sortOrder: Number(r[1]) || 0 }))

      const recipeIngredients: RecipeIngredient[] = (recipeIngredientsR.values ?? [])
        .filter((r) => r[0]?.trim())
        .map((r) => ({
          recipe: r[0].trim(),
          ingredient: (r[1] ?? '').trim(),
          quantity: (r[2] ?? '').trim(),
          unit: (r[3] ?? '').trim(),
        }))

      const calendar: CalendarEntry[] = (calendarR.values ?? [])
        .filter((r) => r[0]?.trim())
        .map((r) => ({
          date: r[0].trim(),
          recipe: (r[1] ?? '').trim(),
          calendarEventId: (r[2] ?? '').trim(),
        }))

      return { recipes, ingredients, categories, recipeIngredients, calendar }
    },
  })
}
