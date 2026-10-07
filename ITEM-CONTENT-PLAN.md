# Sweet Escape item indexing and editorial plan

## Goal

Make every verified catalog item crawlable and discoverable, then earn standalone URLs only through useful, original content. Search-engine submission does not guarantee indexing or ranking.

## Current inventory (2026-09-23)

- 87 hand-dipped ice cream and sherbet catalog items
- 29 frozen-yogurt and yogurt-menu sorbet items
- 33 gelato and sorbetto catalog items
- 6 specialty dessert formats
- 155 total documented items exposed in `item-directory.html`

## Permanent copy standard

- Future blogs target approximately 1,500 words of original, polished copy, with useful verified substance throughout. Follow the long-form validation settings in BLOG-PLAN.md. Do not copy or closely paraphrase third-party articles or claim copyright registration or guaranteed exclusive copyright protection.
- Write for a real visitor question or decision; never publish filler merely to cover a keyword.
- Use original, specific, polished copy with a clear local Memphis purpose.
- Do not reuse paragraphs across item pages or articles.
- Verify every product statement against repository data and authoritative first-party sources.
- Preserve nutrition, ingredient, allergen, facility, and cross-contact cautions exactly in meaning.
- Never infer current availability from the catalog; link to the live menu.
- Never invent taste notes, ingredients, manufacturing details, health benefits, prices, offers, or dietary safety.
- Avoid unsupported “best,” “healthiest,” “premium,” or competitor-superiority claims.
- Give standalone pages only to items with enough verified substance to satisfy a visitor. Consolidate closely related or under-documented items into genuinely useful guides instead of producing thin pages.
- Use unique titles, descriptions, headings, canonicals, social metadata, appropriate schema, internal links, and image alt text.
- Cite authoritative sources and include checked dates when third-party facts are used.

## Publishing sequence

1. Keep the complete static item directory current through `scripts/generate-item-directory.mjs`.
2. Finish the already approved competitor-comparison series without exceeding two posts per day.
3. Build item coverage from verified, currently stocked items first, then evergreen catalog groups.
4. Each item-focused run must update this plan with the covered item IDs and URL.
5. Submit only new or meaningfully changed canonical URLs to IndexNow. Keep sitemap, RSS, robots, and `llms.txt` current.
6. Inspect Google Search Console and Bing Webmaster coverage only when authenticated access is available; never claim guaranteed indexing.

## Coverage ledger

- 2026-10-01: `/blog/cherry-amaretto-ice-cream-vs-frozen-yogurt.html` compares the separate `cherry-amaretto` nonfat frozen-yogurt and `amaretto-cherry` ice-cream records. Uses the Honey Hill Farms nonfat-yogurt page, Sweet Escape product pages, nutrition record and September 25 stock snapshot. Makes no same-day availability claim; preserves milk/soy and facility/shared-equipment cautions.

- 2026-10-01: `/blog/regular-premium-super-premium-ice-cream.html` explains the distinction between the U.S. standard of identity for ice cream and San Bernardo's own Premium (12% butterfat) and Super-Premium (14–16%) product-line labels. Sweet Escape's documented Premium item records reviewed: `banana`, `birthday-cake`, `coconut`, `macadamia-nut`, `mint-chocolate-chunk`, `pistachio`, `pralines-cream`, `rum-raisin`. Super-Premium records reviewed: `cactus-pearfection`, `chocolate-peanut-butter-cup-swirl`, `churro`, `coffee`, `espresso-bean-chip`, `cookie-monster`, `cookies-cream`, `cookies-more-cookies-cream`, `dulce-de-leche`, `double-fudge-mint-brownie`, `guanaban-ahhh`, `guava-have-it`, `italian-raspberry-cheesecake`, `loco-4-coco`, `mamey-magic`, `mango-fiesta`, `new-york-cheesecake`, `pina-coolada`, `pistachio-with-nuts`, `quadruple-chocolate`, `sea-salt-caramel-pretzel`, `sea-salt-caramel-truffle`, `s-mores-with-toasted-coconut`, `so-very-strawberry`, `tahitian-vanilla`, `tiramisu`. Verified against `data/flavors.js`, the corresponding product pages, current San Bernardo category pages, and 21 CFR 135.110. Product-line inclusion is not a promise of same-day availability; directs readers to the live menu.

- 2026-09-29: `/blog/cookie-monster-vs-cookies-n-cream-froyo.html` compares `cookie-monster` and `cookies-n-cream` yogurt. Verified against yogurt ingredient/allergen records and live stock on September 29; preserves facility cautions and distinguishes cookie base from cookie pieces.

- 2026-09-28: `/blog/espresso-frozen-yogurt-memphis.html` covers `espresso` yogurt, with comparisons to `italian-espresso` and `coffee-chocolate-chip` gelato. Ingredient and allergen details checked against repository product records; no caffeine quantity or gelato availability inferred.

- 2026-09-27: `/blog/pumpkin-pie-frozen-yogurt-memphis.html` spotlights `pumpkin-pie`, with supporting comparisons to `ooey-gooey-cinnamon-bun` and `spiced-apple-pie`.

Existing focused guides cover several specialties and flavor groups. Before each new article, search the blog and ledger to avoid duplicating intent or competing pages.

- 2026-10-04: `/blog/lemon-pie-gelato-vs-lemon-sorbetto.html` compares the distinct published records for Torta Al Limone, Zesty Lemon, and Limoncello. It uses the repository's descriptions and categories; preserves the listed milk, egg, wheat, soy, peanut, and tree-nut cautions for Torta Al Limone; and notes that the two sorbetto records lack complete online major-allergen statements. It does not infer alcohol content, dietary suitability, nutrition values, or current availability.

- 2026-10-02: `/blog/after-school-sweet-escape-dessert-ideas.html` is a family-oriented ordering guide, not a new product claim or availability promise. It uses documented formats for Ice Cream Nachos, Cookie Dough Base, Brownie Base, self-serve frozen yogurt with the topping station, and Cookie Ice Cream Sandwiches; directs readers to live stock and individual ingredient/allergen records.

- 2026-10-02: `/blog/peanut-butter-bullseye-vs-peanut-butter-cup.html` compares `peanut-butter-bullseye` and `peanut-butter-cup`, both included in the stock snapshot timestamped 2026-10-02T19:05:12Z. Uses their separate 2/3 cup (95 g) nutrition records, dated 2019-06-18, and matching declared allergens/equipment cautions. The post does not invent sensory distinctions and directs readers to live availability and current-label verification.

- 2026-10-03: `/blog/butter-pecan-flavors-sweet-escape.html` explains three distinct catalog entries: `butter-pecan`, `butter-pecan-no-sugar-added`, and `maple-roasted-butter-pecan`. Uses the two separate nutrition panels dated June 12 and June 18, 2019, the gelato's published description, and exact allergen/equipment cautions. Does not infer recipe equivalence, sensory qualities, or current availability; preserves the missing gelato nutrition limitation.

- 2026-10-04: `/blog/apple-crisp-ice-cream-vs-gelato.html` compares `apple-crisp` ice cream with `bourbon-vanilla-apple-crisp` gelato. Uses the scoop panel dated June 12, 2019, the gelato's published component description, and separate allergen cautions. Explains that numeric nutrition is unavailable for the gelato and makes no taste ranking or current-availability claim.

- 2026-09-26: Expanded `/blog/cookie-dough-vs-brownie-base.html` into a high-quality comparison and ordering guide covering `cookie-dough-base` and `brownie-base`; retained the existing canonical rather than creating a competing URL.

- 2026-09-29 existing-content refresh: expanded vanilla, mint, chocolate, fruit, cake/cheesecake, and no-sugar-added guides at their existing URLs. Coverage spans the named catalog groups; all examples distinguish catalog records from dated stock. See BLOG-REFRESH-TRACKER.md for exact URLs, counts, and remaining work.

- 2026-10-06: `/blog/why-ice-cream-gets-icy.html` adds broad educational texture coverage and links the scoop catalog, item directory, and specialties. No new individual item claims; product data unchanged, so directory regeneration not required. Sources in research/ice-cream-texture-sources.md.

- 2026-10-07: `/blog/vanilla-orchid-beans-extract.html` supports `madagascar-vanilla-bean` gelato with educational vanilla ingredient context. Exact published description, reference nutrition serving, and milk/current-label caution retained. No sourcing, production-method, supplier, alcohol-content, or availability inference. Product data unchanged.
