import { Link, useParams } from 'react-router-dom'
import SheetGate from '../components/SheetGate'
import { useSheetData, type SheetData } from '../hooks/useSheetData'

export default function RecipeDetail() {
  const { name } = useParams<{ name: string }>()
  const decodedName = decodeURIComponent(name ?? '')
  const { data, isLoading, error } = useSheetData()

  return (
    <SheetGate isLoading={isLoading} error={error}>
      <RecipeDetailContent name={decodedName} data={data!} />
    </SheetGate>
  )
}

function RecipeDetailContent({ name, data }: { name: string; data: SheetData }) {
  const recipe = data.recipes.find((r) => r.name === name)
  const ingredients = data.recipeIngredients.filter((ri) => ri.recipe === name)

  if (!recipe) {
    return (
      <div className="space-y-3">
        <Link to="/recipes" className="text-sm text-emerald-700 underline">
          ← Back to recipes
        </Link>
        <p className="text-slate-500">Recipe not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <Link to="/recipes" className="text-sm text-emerald-700 underline">
          ← Back to recipes
        </Link>
        {recipe.image && (
          <img
            src={recipe.image}
            alt={recipe.name}
            className="mt-2 h-48 w-full rounded-lg object-cover"
          />
        )}
        <h1 className="mt-2 text-xl font-semibold text-slate-700">{recipe.name}</h1>
        {recipe.link && (
          <a
            href={recipe.link}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-slate-500 underline"
          >
            Source
          </a>
        )}
      </div>
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 font-semibold text-slate-700">Ingredients</h2>
        {ingredients.length === 0 ? (
          <p className="text-sm text-slate-400">No ingredients recorded yet.</p>
        ) : (
          <ul className="space-y-1 text-sm text-slate-600">
            {ingredients.map((ri) => (
              <li key={ri.ingredient}>
                {ri.quantity} {ri.unit} {ri.ingredient}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
