# Ice-cream sweetness and temperature: source notes

Research checked October 17, 2026, for `/blog/does-ice-cream-taste-sweeter-when-melted.html`.

## Main claims and boundaries

- Temperature can affect perceived sweetness, but the size and direction depend on the stimulus and test conditions. This is a claim about perception, not a claim that warming adds sugar.
- The strongest directly relatable real-food source below tested custard, not ice cream or any Sweet Escape product. Its sample included 22 participants; the article reports the study’s measured warm-versus-frozen result and explicitly notes the small sample and food-specific scope.
- Controlled-solution studies support the broader temperature/sweetness relationship but do not establish how a named commercial dessert tastes as it melts. Their results vary by compound, concentration, temperature, and tasting procedure.
- No quantitative prediction, universal “warmer is sweeter” rule, sugar-content inference, product formula, manufacturing, or health claim is made.

## Sources

1. McNeill, H., Ford, R., Fisk, I., Thibodeau, M., Liu, G., Doyennette, M., & Yang, Q. (2025). “It tastes sweeter when melted: Exploring the impact of food temperature on tongue temperature and perceived sweetness/vanilla.” *Science Talks*, 13, 100424. DOI: [10.1016/j.sctalk.2025.100424](https://doi.org/10.1016/j.sctalk.2025.100424). [University of Nottingham repository record and abstract](https://nottingham-repository.worktribe.com/output/45039086/it-tastes-sweeter-when-melted-exploring-the-impact-of-food-temperature-on-tongue-temperature-and-perceived-sweetnessvanilla). Tested custard served warm, ambient, chilled, and frozen with 22 participants. Reports a weak positive correlation of tongue temperature with sweetness ratings and a higher sweetness rating for warm than frozen custard. Study is not about ice cream.
2. Green, B. G., & Nachtigal, D. (2015). “Temperature Affects Human Sweet Taste via at Least Two Mechanisms.” *Chemical Senses*, 40(6), 391–399. [PubMed record](https://pubmed.ncbi.nlm.nih.gov/25963040/) and [full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC4542652/). Three human experiments examined sugars and artificial sweeteners at different temperatures and exposure times. Supports temperature-sensitive sweetness and adaptation while documenting stimulus-dependent effects; it does not justify a single rule for every food.
3. Bartoshuk, L. M., Rennert, K., Rodin, J., & Stevens, J. C. (1982). “Effects of temperature on the perceived sweetness of sucrose.” *Physiology & Behavior*, 28(5), 905–910. DOI: [10.1016/0031-9384(82)90212-8](https://doi.org/10.1016/0031-9384(82)90212-8). [PubMed record](https://pubmed.ncbi.nlm.nih.gov/7100291/). Human sucrose-solution study reports that the temperature effect diminished as concentration rose and was negligible near 0.5 M, underscoring that concentration matters.

## Sweet Escape verification

- First-party catalog record: `gelato/madagascar-vanilla-bean/index.html` and `data/gelato-flavors.js` identify Madagascar Vanilla Bean as Gelato and give the exact description: “Madagascar bourbon vanilla blended with fresh cream, milk, and pure cane sugar.” The blog attributes only those published catalog facts.
- `data/stock.json` has `updatedAt: 2026-10-14T18:43:43.183Z` and does not establish availability on October 17. The blog makes no same-day availability claim and links to `/stock.html` for the live menu.
- The blog makes no claim that the research tested Sweet Escape, measured this product’s sweetness, describes its formula beyond the catalog description, or establishes a particular serving temperature or manufacturing method.
- No product records changed, so `scripts/generate-item-directory.mjs` was not run.
