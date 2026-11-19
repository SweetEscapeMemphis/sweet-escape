# Why Does Ice Cream Shrink in the Freezer? — verification notes

- Canonical: https://www.sweetescapememphis.com/blog/why-ice-cream-shrinks.html
- November 19, 2026 PM America/Chicago run; second scheduled article after the morning frozen yogurt post. The full blog archive and editorial plans showed no dedicated shrinkage article. The existing icy-texture story follows ice crystal growth; the particle-accelerator and butter articles use different research questions; the planning guide distinguishes volume and weight.

## Sources checked November 19, 2026

- [VanWees, Rankin and Hartel, “Shrinkage in frozen desserts”](https://pubmed.ncbi.nlm.nih.gov/34954889/): definition, historical work, air-phase collapse and possible causes, without identifying a single universal mechanism.
- [Chang and Hartel, “Stability of air cells in ice cream during hardening and storage”](https://www.sciencedirect.com/science/article/abs/pii/S0260877401002424): direct microscopy, merging adjacent cells, disproportionation and drainage.
- [University of Guelph, Overrun calculations](https://books.lib.uoguelph.ca/icecreamtechnologyebook/chapter/overrun-calculations/): percent increase relative to mix volume. Illustrative 1 to 2 cups is 100% overrun; 2 to 1.75 cups is a separate 12.5% loss relative to the finished dessert. No local measurements.
- [OpenStax, Ideal Gas Law](https://openstax.org/books/chemistry/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law): constant-temperature, fixed gas quantity pressure/volume relationship. [Hartel, Rankin and Bradley, 2017](https://www.journalofdairyscience.org/article/S0022030217310512/pdf): frozen-dessert distribution over mountains as an example, with pressure-drop expansion and a return toward normal pressure. No claims about local routes or a particular tub.
- [VanWees, UW–Madison dissertation](https://asset.library.wisc.edu/1711.dl/APOTML42FZD578S/R/file-2fe48.pdf): §2.8.3 on temperature versus pressure; §3.5.3.1 and Fig. 3.5.1 on chilled-water displacement, measurement calibration and accounting for tongs; §§4.5.1.2 and 4.5.3 and Table 4.5.9 on microscopic air channels and recipe-specific shrinkage; §§4.5.4.2–3 on distinct meltdown and storage measures. [VanWees, Rankin and Hartel, 2026](https://pubmed.ncbi.nlm.nih.gov/41645806/): original controlled air network and storage stability comparisons. Conditions and results are specific to the tested frozen desserts. Not a home experiment.
- [USDA FSIS, “What is freezer burn?”](https://ask.fsis.usda.gov/article/What-is-freezer-burn): surface drying is distinct from frozen-foam volume loss. No conclusion about food safety from a gap or a pictured surface.

## Sweet Escape and scope

- Compared `flavors.html`, `item-directory.html`, `visit.html`, `stock.html`, current `data/stock.json` and catalog files, and the existing nutrition and allergen guide. Catalog browsing, live menu and Whitten Road location are separately documented. The reused Vanilla Bean catalog photo is a social illustration, not a statement of air content, storage, formulation or current availability.
- No stock claims, individual items newly covered, product edits, standalone product page, or directory inputs changed. Ingredient, nutrition, current label, facility, equipment, handling and cross-contact cautions retained. No full audit due (last completed 2026-11-16).

## Deployment and discovery

- **Deployed:** `9c2b39f09cbbf614c362d9d6a46b8654c812e4dd`, [GitHub Pages run 44628934006](https://github.com/SweetEscapeMemphis/sweet-escape/actions/runs/44628934006), successful November 19 at 22:29:10 UTC. Validated 1,563 rendered article words, one H1, FAQ/schema parity, metadata, links and fragments, JS syntax, all 10 calculator tests, XML, and diff. Desktop (1440 px) and mobile (390 px) renders inspected; SEO audit passed for 345 URLs with one unrelated legacy title warning. Item directory regeneration yielded the same 202 records.
- **Crawlable:** Live checks at 22:29:15 UTC returned 200 and matched the published article bytes; URL was self-canonical with no noindex meta or header. Blog index linked the article; sitemap, the 20-item RSS feed and llms.txt included it. Live robots rules permit all 20 requested crawlers and disallow only the private stock manager. Three recent articles also returned 200.
- **Submitted:** Repository IndexNow script verified the published key and returned **HTTP 200** at 22:29:20 UTC for the new canonical and the updated blog index only. No duplicate submissions or external account settings changes. GSC Wizard returned `subscription_required`; no authenticated Google or Bing coverage action was available. Public discovery relies on the links and files above; no Apple or AI direct submission claimed.
- **Observed indexed:** Not confirmed for the new article; public checks did not establish indexing for the latest three previous posts either. Lack of an exact public result is not proof of exclusion.
