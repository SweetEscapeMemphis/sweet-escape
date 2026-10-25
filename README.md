# Sweet escape
My Sweet Escape website

## Ice cream party calculator

The calculator at `/ice-cream-party-calculator/` provides quick pint/gallon
estimates and an optional detailed sundae bar planner. Quick defaults stay at
16 guests, two planned 4-fluid-ounce scoops each: 8 pints OR 1 gallon.
The independent detailed planner retains ⅓/½/⅔-cup portions, 0–30% extra,
containers, dry toppings, supplies, optional entered USD costs, and legacy links.
The shop estimator retains 5-weight-ounce scoops, $0.80/oz, and optional 4 oz bases.
The existing calculation core and formula assumptions are unchanged.

Each planner has copy, share, validation, manual-copy fallback, and isolated print
output. Quick links use `simpleGuests`/`simpleServing`; detailed and weighted
links keep their original parameters. Invalid and repeated inputs fall back
with warnings. A share link saves that planner's inputs, not checklist checkmarks.

`/ice-cream-party-calculator/embed.html` loads only the quick calculator and local
styles/scripts, without analytics or chat. Its intentional `noindex, follow` and
main-page canonical keep it from becoming a competing search page. The main
page stays `index, follow`. The titled, lazy iframe has optional attribution.
Keep the quick embed markup synchronized when changing the main quick form.

Interaction events use the existing GA4 function: `calculator_use` (valid edits,
throttled per planner), `calculator_results_copied`, `calculator_print`,
`calculator_share_generated`, `calculator_share_copied`,
`calculator_embed_copied`, and `calculator_shop_click`. Planner action payloads
contain only the planner name, page pathname, and beacon transport; no input
values, budgets, clipboard text, or query strings. Shop links use the existing
link-event payload. Copy events require clipboard success, and print events
measure requests. Confirm receipt in GA4 DebugView after publication.

Run focused tests with Node.js 24: `node --test scripts/ice-cream-calculator.test.mjs`.
For browser QA, serve the repository on localhost port 8768 and run
`node scripts/check-ice-cream-calculator-browser.mjs` with Playwright available.
`PLAYWRIGHT_MODULE`, `CHROME_PATH`, and `CALCULATOR_PREVIEW_ORIGIN` support local
runtimes and other origins. No application dependency was added. The existing
GitHub Pages branch deployment remains in use.
