import { appendValues, batchGetValues } from './sheetsClient'

export interface ImportIngredient {
  name: string
  quantity: string
  unit: string
  category: string
}

export interface ImportRecipeInput {
  name: string
  link: string
  ingredients: ImportIngredient[]
}

export interface ImportRecipeResult {
  addedIngredients: string[]
  recipeIngredientRows: number
}

export async function importRecipe(
  spreadsheetId: string,
  recipe: ImportRecipeInput,
): Promise<ImportRecipeResult> {
  const [existingRecipesR, existingIngredientsR] = await batchGetValues(spreadsheetId, [
    'Recipes!A2:A1000',
    'Ingredients!A2:A1000',
  ])

  const existingRecipeNames = new Set(
    (existingRecipesR.values ?? []).map((r) => (r[0] ?? '').trim().toLowerCase()),
  )
  if (existingRecipeNames.has(recipe.name.trim().toLowerCase())) {
    throw new Error(`A recipe named "${recipe.name}" already exists.`)
  }

  const existingIngredientNames = new Set(
    (existingIngredientsR.values ?? []).map((r) => (r[0] ?? '').trim().toLowerCase()),
  )

  const seen = new Set<string>()
  const newIngredients = recipe.ingredients.filter((ing) => {
    const key = ing.name.trim().toLowerCase()
    if (existingIngredientNames.has(key) || seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (newIngredients.length > 0) {
    await appendValues(
      spreadsheetId,
      'Ingredients!A:B',
      newIngredients.map((i) => [i.name, i.category]),
    )
  }

  await appendValues(spreadsheetId, 'Recipes!A:B', [[recipe.name, recipe.link]])
  await appendValues(
    spreadsheetId,
    'RecipeIngredients!A:D',
    recipe.ingredients.map((i) => [recipe.name, i.name, i.quantity, i.unit]),
  )

  return {
    addedIngredients: newIngredients.map((i) => i.name),
    recipeIngredientRows: recipe.ingredients.length,
  }
}
