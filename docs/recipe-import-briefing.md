# Recipe import briefing (paste into any Claude chat)

I use a personal meal-planner web app backed by a Google Sheet. When I give you a recipe URL or pasted text, extract the ingredients and output ONE JSON block in this exact shape — nothing else, no commentary needed beyond the JSON:

```json
{
  "name": "Recipe Name",
  "link": "https://source-url",
  "image": "https://source-url/hero-photo.jpg",
  "ingredients": [
    { "name": "ingredient", "quantity": "800", "unit": "gram", "category": "AH Category Name" }
  ]
}
```

## Rules

1. **Fetch the URL** if given one (read the page directly). If you can't fetch it, ask me to paste the recipe text instead.
2. **Image**: grab the page's `og:image` meta tag value (the recipe's hero photo) and hotlink that URL directly — don't download or re-host it. Leave it out if there's no clear hero image.
3. **Units**: many sites already give metric (grams, ml, °C) — use that as-is. Only convert when the source is US customary (cups, tbsp/tsp are fine as-is, oz, lb, °F → metric).
4. **Never include**: water, salt, pepper, or small/background amounts of cooking oil (e.g. oil used for roasting or sautéing). These are kitchen staples, not shopping-list items.
5. **Don't overthink quantities.** Round to sensible numbers. If an amount is vague ("a splash", "a small glass"), estimate a reasonable real-world quantity rather than leaving it blank.
6. **Ingredient names**: use Dutch names (the sheet is in Dutch) — e.g. "ui" not "onion", "knoflook" not "garlic", "aubergine" not "eggplant".
7. **Category**: must be exactly one of this list (Albert Heijn's real current top-level categories):

   ```
   Groente, aardappelen
   Fruit, verse sappen
   Maaltijden, salades
   Vlees
   Vis
   Vegetarisch, vegan en plantaardig
   Vleeswaren
   Kaas
   Zuivel, eieren
   Bakkerij
   Glutenvrij
   Borrel, chips, snacks
   Pasta, rijst, wereldkeuken
   Soepen, sauzen, kruiden, olie
   Koek, snoep, chocolade
   Ontbijtgranen, beleg
   Tussendoortjes
   Diepvries
   Koffie, thee
   Frisdrank, sappen, water
   Bier, wijn, aperitieven
   Drogisterij
   Gezondheid en sport
   Huishouden
   Baby en kind
   Huisdier
   Koken, tafelen, vrije tijd
   AH Bloemenshop
   ```

8. **Copyright**: only extract the factual ingredient list (name/quantity/unit) — never copy the recipe's descriptive text, headnote, or step-by-step method into your output.
9. If an ingredient might already exist in my sheet under a slightly different category than you'd pick, don't worry about it — the app skips adding a duplicate ingredient row if the name already exists, so a "wrong" category guess on an existing ingredient has no effect.

## What I do with the output

I paste your JSON block into the "Import recipe" panel on the Recipes page of my app, which writes it into my Google Sheet. You don't need to do anything beyond producing the JSON.
