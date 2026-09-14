import SheetGate from '../components/SheetGate'
import { useSheetData, type SheetData } from '../hooks/useSheetData'

export default function IngredientsAdmin() {
  const { data, isLoading, error } = useSheetData()

  return (
    <SheetGate isLoading={isLoading} error={error}>
      <IngredientsAdminContent data={data!} />
    </SheetGate>
  )
}

function IngredientsAdminContent({ data }: { data: SheetData }) {
  const sortOrderByCategory = new Map(data.categories.map((c) => [c.category, c.sortOrder]))

  const byCategory = new Map<string, string[]>()
  for (const ingredient of data.ingredients) {
    const list = byCategory.get(ingredient.category) ?? []
    list.push(ingredient.name)
    byCategory.set(ingredient.category, list)
  }

  const categories = [...byCategory.keys()].sort(
    (a, b) => (sortOrderByCategory.get(a) ?? 999) - (sortOrderByCategory.get(b) ?? 999),
  )

  if (categories.length === 0) {
    return <p className="text-sm text-slate-400">No ingredients yet.</p>
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category} className="rounded-lg border bg-white p-4">
          <h2 className="mb-2 font-semibold text-slate-700">{category}</h2>
          <ul className="flex flex-wrap gap-2 text-sm text-slate-600">
            {byCategory
              .get(category)!
              .sort((a, b) => a.localeCompare(b))
              .map((name) => (
                <li key={name} className="rounded-full bg-slate-100 px-3 py-1">
                  {name}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
