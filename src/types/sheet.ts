export interface Recipe {
  name: string
  link: string
}

export interface Ingredient {
  name: string
  category: string
}

export interface Category {
  category: string
  sortOrder: number
}

export interface RecipeIngredient {
  recipe: string
  ingredient: string
  quantity: string
  unit: string
}

export interface CalendarEntry {
  date: string
  recipe: string
  calendarEventId: string
}

export interface ShoppingListItem {
  ingredient: string
  quantity: string
  unit: string
  category: string
  checked: boolean
}
