# Peanut geocarpy: source and publication record

Checked November 1, 2026 for `/blog/peanuts-grow-underground-not-roots.html`.

## Editorial scope

Reader question: how do peanuts grow underground if they are not roots? An ingredient-botany fact article, not a growing manual, nutrition guide or new-stock announcement. Archive reviewed: no existing peanut-growth/geocarpy angle; the botanical-berries article and the older peanut-product comparison answer different questions. First November 1 post (Chicago); at most one publication this run. Existing article dates remain unchanged.

Original article prose: 1,510 words excluding title, headings, header metadata and final source-check line; 1,623 total article words by the drafting counter. No visible FAQ or FAQ schema: the sectioned explanation already answers the question. Preferred Sources head assets, article aside, footer controls, breadcrumb and schema retained from the latest template.

## Primary and institutional sources

- [Royal Botanic Gardens, Kew: peanut](https://www.kew.org/plants/peanut): Fabaceae, botanical identity, four leaflets and small yellow/orange flowers. Official indexed text verified; direct opening returned 403. No invented species, origin story or culinary superiority.
- [University of Kentucky crop profile](https://publications.mgcafe.uky.edu/ccd-cp-112): shell/pod/hull versus seed/kernel. Dated extension profile used for stable plant anatomy only, not current agricultural recommendations.
- [Clemson Cooperative Extension](https://hgic.clemson.edu/factsheet/peanut/): flower location and peg-mediated belowground pod development.
- [University of Florida IFAS](https://gardeningsolutions.ifas.ufl.edu/plants/edibles/vegetables/peanuts/): geocarpy; aboveground flowers and belowground fruit maturation.
- [Utah State University Extension](https://extension.usu.edu/yardandgarden/research/peanuts-in-the-garden): nitrogen-fixing bacteria and root nodules, separate from pods. No planting or inoculation advice republished.
- [University of Minnesota seed morphology](https://open.lib.umn.edu/horticulture/chapter/9-1-seed-morphology/): fruit wall/shell, seed coat and seed anatomy.
- [University of Georgia peanut-production guide](https://secure.caes.uga.edu/extension/publications/files/pdf/B%201146_2.PDF): two cotyledons and embryo anatomy. No production or food-safety procedure recommended.
- [NC State Plant Toolbox](https://plants.ces.ncsu.edu/plants/arachis-hypogaea/): principal US crop types and common commercial uses. These do not establish any Sweet Escape ingredient's cultivar or supplier.
- [Purdue Extension](https://www.purdue.edu/hla/sites/yardandgarden/peanuts-make-their-way-to-northern-gardens/?cat=17): lifting the plant with attached pods, prolonged flowering and drying. Historical extension description used only for general harvest context.
- [NC State peanut-breeding report, May 6, 2024](https://sustainability.ncsu.edu/blog/2024/05/06/growing-a-homerun-peanut/): pods at different maturities create a harvest challenge.
- [Zhang et al., BMC Genomics 2016, original research](https://link.springer.com/article/10.1186/s12864-016-2857-1): tip/basal peg comparisons, embryo development and gene-expression changes around soil entry. Article distinguishes observations from a proven single-switch mechanism. [Erratum checked](https://link.springer.com/article/10.1186/s12864-016-3181-5): author ordering/affiliations, not a correction of the biological results.
- [FDA major food allergens](https://www.fda.gov/industry/fda-basics-industry/what-major-food-allergen): peanuts and tree nuts separately listed. No individual allergy prediction or dietary-safety promise.

## Sweet Escape verification and boundaries

Read BLOG-PLAN.md, ITEM-CONTENT-PLAN.md, comparison-series sources, archive/recent commits, current product and stock records, item pages/directory, sitemap, RSS, robots and llms.txt before drafting. Clean main fast-forwarded through owner commits `f3c0ea5` (Preferred Sources) and `fcc5397` (stock); original dirty checkout untouched.

- `data/flavors.js` and `/scoops/peanut-butter-bullseye/`: ID `peanut-butter-bullseye`, Ice Cream; contains Milk, Peanuts, Soy; equipment note: tree nuts, wheat and eggs. Label and facility/shared-equipment verification plus possible cross-contact caution retained. No new nutrition or ingredient formulation claims.
- Older `/blog/peanut-butter-bullseye-vs-peanut-butter-cup.html` linked as the product-comparison destination, not duplicated.
- `data/stock.json` owner update `2026-10-31T23:32:58.744Z` preserved. No catalog-to-availability inference; reader directed to `/stock.html`. No supplier, farm, cultivar, roasting, shop manufacturing, health, taste, price, service, review or superiority claim.
- Ran `scripts/generate-item-directory.mjs` after upstream data changes: 200 items (132 scoops, 29 yogurt, 33 gelato, 6 specialties). Generator corrected to retain breadcrumb navigation/schema on every regeneration, in addition to the owner's Preferred Sources integration. Inventory-count summary updated from the dated 155-item snapshot. No product or stock file edited.

## Validation and discovery

Prepublication validation: SEO audit passed for 307 indexable sitemap URLs, with unique titles/descriptions/canonicals; the sole warning is an unchanged legacy 73-character tasting-guide title. XML validation passed; all 26 JS/MJS files passed syntax checks. Internal paths/fragments passed the SEO audit. One H1, valid BlogPosting/BreadcrumbList, four contextual internal links, 20 RSS items and 1,510 prose words confirmed. Desktop 1280px and mobile 390px screenshots reviewed, with no horizontal overflow; mobile CTA/footer and Preferred Sources controls retained. Directory schemas match HEAD semantically, the generator is idempotent, and product/stock and older article files are unchanged. `git diff --check` passed; remote main had no concurrent changes before commit.

GSC Wizard `get_indexnow_settings` returned `payment_required` / `subscription_required` (no active plan/trial); further connector calls would repeat the same refusal. An active GSC Wizard plan plus connected Google account is needed to restore connector workflows; no subscription or account-setting changes made. Use the already-authenticated browser consoles and the existing validated IndexNow script instead.

Last full safe audit October 26; Sunday November 1 is under seven days, so a new full audit is not due. Never use the ordinary-post Google Indexing API or interpret submission acceptance as observed indexing. Deployment/discovery receipts follow after publication.

## Deployment and discovery receipts — November 1, 2026

- **Deployed:** publication commit `19b275394f8d1036c1a49d048c38387493c75459`; clarified the heading to distinguish the whole pod from its shell in `33c35f65d0d3a6f0586b901defb2ea5eebad9e2b`. [Latest article Pages deployment](https://github.com/SweetEscapeMemphis/sweet-escape/actions/runs/41330793137) completed successfully. The live HTML matched the final local article byte-for-byte.
- **Crawlable:** canonical URL returned HTTP 200, declared its intended self-referencing canonical, had no meta/header noindex directive, and was linked from the live blog index. Live sitemap contained 307 URLs including the new canonical; RSS contained the newest 20 including this post; llms.txt included its description. Public robots explicitly permit Googlebot, Bingbot, Applebot, DuckDuckBot, OAI-SearchBot, GPTBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Amazonbot, Google-Extended, CCBot, cohere-ai, meta-externalagent, Bytespider, YandexBot and Baiduspider. Requests using each of those 20 user agents returned HTTP 200. Only `/stock-manager.html` is disallowed. These probes demonstrate access, not actual crawler visits.
- **Submitted:** after deployment and live verification, existing local/public IndexNow key validated. One request to `https://api.indexnow.org/indexnow` accepted exactly these two changed URLs with **HTTP 200**:
  - `https://www.sweetescapememphis.com/blog/peanuts-grow-underground-not-roots.html`
  - `https://www.sweetescapememphis.com/blog/`
  No older unchanged URL or semantically unchanged directory URL was resubmitted. HTTP 200 is key-validated submission acceptance, not indexing.
- Signed-in **Google Search Console** confirmed the canonical sitemap is already submitted: Success, last read October 30, 303 stored discovered pages (a lagging snapshot, not the live sitemap count). The new canonical was unknown/not indexed. One manual Request indexing attempt completed its live-check phase but failed with “We had a problem submitting your indexing request” and “Could not connect to the reCAPTCHA service.” No successful Google manual submission receipt claimed; no CAPTCHA completed or bypassed and no retry loop. Public sitemap/RSS/internal links remain available to Google.
- Signed-in **Bing Webmaster Tools** confirmed sitemap and feed Success, last crawled October 27, stored counts 300 and 20, with zero sitemap errors/warnings. The new canonical was already **discovered November 1 but not crawled**. Live URL test: “URL can be indexed by Bing” and “No SEO/GEO issues found.” Markup insights failed to load, which is not a schema-validation verdict. Request indexing modal showed 100 URLs remaining; submitted this one new canonical once and verified the final **“Indexing requested.”** acknowledgement.
- **Observed indexed:** not confirmed for the new post on Google, Bing or any AI platform. Bing discovery/live eligibility and submission receipts are not index evidence. Read-only recheck of October 31's Baked Alaska post in Google still showed unknown/not indexed, no last crawl; it was not resubmitted.
- No universal submission API exists for Apple or all AI services; verified robots/discovery access instead of claiming direct submission. No account settings changed, no Google ordinary-post Indexing API used. Search/AI inclusion, crawling, ranking and citation are not guaranteed.

Follow-up: recheck this canonical and the recent Baked Alaska post in a later scheduled run without resubmitting unchanged URLs. The existing sitemap submissions are healthy; avoid redundant sitemap submissions. Restoring GSC Wizard's subscription is optional for connector-based history/quota tracking; browser checks remain usable.
