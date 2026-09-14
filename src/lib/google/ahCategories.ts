// Albert Heijn's current top-level category names, in their real ah.nl navigation order.
// Fetched from https://www.ah.nl/producten "Ons assortiment per categorie" — used as the
// canonical AH-categorie list and the default shopping-list sort order.
export const AH_CATEGORIES: string[] = [
  'Groente, aardappelen',
  'Fruit, verse sappen',
  'Maaltijden, salades',
  'Vlees',
  'Vis',
  'Vegetarisch, vegan en plantaardig',
  'Vleeswaren',
  'Kaas',
  'Zuivel, eieren',
  'Bakkerij',
  'Glutenvrij',
  'Borrel, chips, snacks',
  'Pasta, rijst, wereldkeuken',
  'Soepen, sauzen, kruiden, olie',
  'Koek, snoep, chocolade',
  'Ontbijtgranen, beleg',
  'Tussendoortjes',
  'Diepvries',
  'Koffie, thee',
  'Frisdrank, sappen, water',
  'Bier, wijn, aperitieven',
  'Drogisterij',
  'Gezondheid en sport',
  'Huishouden',
  'Baby en kind',
  'Huisdier',
  'Koken, tafelen, vrije tijd',
  'AH Bloemenshop',
]

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Exact match (normalized) against the canonical list, or null if none. */
export function matchAhCategory(value: string): string | null {
  const target = normalize(value)
  return AH_CATEGORIES.find((c) => normalize(c) === target) ?? null
}

/** Best-guess canonical category by shared-word overlap, for flagging drifted names to a human. */
export function suggestAhCategory(value: string): string | null {
  const targetWords = new Set(normalize(value).split(' ').filter((w) => w.length > 2))
  if (targetWords.size === 0) return null

  let best: { category: string; score: number } | null = null
  for (const category of AH_CATEGORIES) {
    const words = normalize(category).split(' ').filter((w) => w.length > 2)
    const overlap = words.filter((w) => targetWords.has(w)).length
    if (overlap > 0 && (!best || overlap > best.score)) {
      best = { category, score: overlap }
    }
  }
  return best?.category ?? null
}
