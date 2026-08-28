# Sweet Escape Local SEO and Technical SEO Report

Audit and implementation date: August 27, 2026

Production site: https://www.sweetescapememphis.com/

Repository: https://github.com/SweetEscapeMemphis/sweet-escape

Target location: Sweet Escape, 1674 Whitten Rd, Suite 106, Memphis, TN 38134

## Executive summary

The site is a static GitHub Pages project built with HTML, CSS, and vanilla JavaScript. The implementation adds a conversion-focused Visit page, makes Directions the primary action, installs exact GA4 event names, replaces incomplete structured data with one verified `IceCreamShop` entity, adds a branded 404 page, expands the sitemap, and substantially reduces customer-facing image payloads.

The six indexable pages now have unique titles, descriptions, canonicals, social metadata, and one H1 each. The current stock menu remains data-driven; no fixed availability count was inserted into permanent SEO copy.

## Verified business information

The following was verified against the production website and the Google business listing reached by the site's existing directions link:

- Business name: Sweet Escape
- Website address: 1674 Whitten Rd, Suite 106, Memphis, TN 38134
- Phone: (901) 718-5812 / `+1-901-718-5812`
- Hours: Monday-Thursday 12-9 PM; Friday-Sunday 12-10 PM
- Google primary category: Ice cream shop
- Google Maps destination: https://share.google/4KF1GDH3zOARV0nm1
- Coordinates: 35.1710184, -89.836094
- Instagram: https://www.instagram.com/sweet_escape901/
- TikTok: https://www.tiktok.com/@sweetescape901
- Facebook: https://www.facebook.com/p/Sweet-Escape-61578682570988/
- Verified product categories: hand-dipped ice cream, self-serve frozen yogurt, gelato, sorbet/sorbetto, milkshakes, toppings, cookie-based loaded treats, no-sugar-added choices, and vegan gelato choices
- Stock at audit time: 32 items — 16 scoop flavors, 12 yogurt flavors, and 4 gelato flavors

The Google listing displayed 1674 Whitten Rd without Suite 106. The owner should confirm and correct that profile field if Google permits it.

## Baseline problems found

1. No dedicated visit/location page; `/visit` and `/location` returned 404.
2. Directions, call, and menu actions were not consistently available across pages or persistently on mobile.
3. GA4 used a generic `storefront_action` event rather than the requested `directions_click`, `phone_click`, and `menu_view` events.
4. Structured data lacked verified coordinates, contained an unconfirmed price range, and pointed Menu to the catalog rather than current stock.
5. The homepage eagerly loaded 24 original 900 × 900 scoop images. Catalogs also used heavy transparent PNGs.
6. Public images generally lacked intrinsic dimensions and responsive sources, creating excess transfer and layout-shift risk.
7. There was no branded custom 404 page.
8. Internal home links used `index.html`, even though `/` is canonical.
9. The sitemap did not contain a Visit page.
10. Some indexable pages had incomplete Twitter metadata.
11. Flavor catalog counters said “in stock” even though they represented full catalog size.
12. HTTP is not fully forced to HTTPS: the apex HTTP URL reaches an HTTP www page before HTTPS.
13. The Google Business Profile website URL was HTTP and had no campaign tracking.
14. The original favicon was unnecessarily large for browser UI.

Existing strengths preserved: canonical tags, crawlable navigation, useful product/nutrition content, a valid robots file, no self-serving review schema, verified NAP in site footers, and a live data-driven stock system.

## Improvements implemented

### Homepage and local relevance

- Updated the title to `Sweet Escape | Ice Cream, Gelato & Soft Serve in Memphis`.
- Added a full-address, visit-oriented meta description.
- Updated the H1 to “Ice cream, gelato & soft serve in Memphis.”
- Added specific, verified product and Whitten Road copy.
- Improved heading structure for products, in-store experience, menu, nutrition, and location.
- Kept the full address, phone, and verified hours visible.
- Added a Directions button to desktop navigation, hero, location section, footer, and mobile action bar.
- Kept the live menu in the first viewport as a second conversion path.
- Added a responsive three-action mobile bar: Directions, Call, and Menu.

### Visit page

Created `visit.html` with:

- Unique title, description, canonical, Open Graph, and Twitter metadata
- One locally focused H1
- Complete address, verified hours, and click-to-call phone number
- Prominent exact-location Google Maps actions
- Embedded map using verified coordinates
- Responsive product imagery already owned by the site
- Useful Memphis/Bartlett service-area context
- Six visible visit-planning FAQs
- No unverified parking, accessibility, entrance, landmark, or payment claims
- No FAQ schema

### Analytics

Preserved GA4 property `G-H90X0LXRD3` and added a delegated, privacy-conscious click tracker for:

- `directions_click`
- `phone_click`
- `menu_view`

Parameters are limited to link text, destination without query parameters, and page path. `order_click` and `rewards_click` were not added because no real order or rewards links were verified.

### Structured data

The homepage now contains one `IceCreamShop` entity with verified:

- Name, URL, logo, image, phone
- Postal address
- Coordinates
- Opening hours
- Exact map destination
- Menu URL
- Cuisine/product categories
- Social profiles

The unverified `priceRange` was removed. No review or `aggregateRating` markup was added.

### Technical SEO and UX

- Added `404.html` with Menu, Home, Directions, and mobile actions.
- Added the Visit page to `sitemap.xml`; the sitemap now contains only six canonical, indexable URLs.
- Replaced public `index.html` links with `/`.
- Added complete Open Graph/Twitter tags across indexable pages.
- Added optimized 32 × 32 and 180 × 180 site icons.
- Corrected catalog labels from “in stock” to “flavors.”
- Improved the gelato H1 for Memphis search intent.
- Preserved `noindex` on the redirect and private stock manager.
- Kept the admin route disallowed in `robots.txt`.
- Added cache-busting asset versions for changed CSS, data, and scripts.
- Kept system fonts; no new render-blocking font dependency was added.

### Image and Core Web Vitals work

- Generated 300 px and 600 px responsive WebP variants for all 71 scoop images.
- Converted 27 unique yogurt transparent PNGs to 600 px WebP.
- Converted 33 gelato PNGs to 512 px WebP.
- Added `srcset`, `sizes`, dimensions, lazy loading, and async decoding where appropriate.
- Constrained hero image grids so intrinsic dimensions do not expand layout.
- Kept below-the-fold animation frames proximity-loaded by the existing IntersectionObserver logic.

Asset comparison:

| Image set | Before | Customer-facing optimized set |
| --- | ---: | ---: |
| 71 scoop originals | 18.58 MB | 1.74 MB at 300 px or 5.95 MB at 600 px |
| 27 yogurt product PNGs | 30.45 MB | 0.77 MB |
| 33 gelato product PNGs | 11.65 MB | 1.26 MB |

Browsers download one responsive scoop candidate, not both sets.

## Files changed

Core pages and crawl controls:

- `index.html`
- `stock.html`
- `flavors.html`
- `yogurt.html`
- `gelato.html`
- `visit.html` (new)
- `404.html` (new)
- `soft-serve.html`
- `stock-manager.html`
- `sitemap.xml`
- `SEO-REPORT.md` (new)

Styles and behavior:

- `home.css`
- `visit.css` (new)
- `site-actions.css` (new)
- `home.js`
- `analytics.js` (new)
- `script.js`
- `stock-page.js`
- `yogurt.js`
- `gelato.js`

Data and image assets:

- `data/yogurt-flavors.js`
- `data/gelato-flavors.js`
- `assets/scoops/responsive/` (new)
- `assets/yogurt/scoops-webp/` (new)
- `assets/gelato/scoops-webp/` (new)
- `assets/favicon-32.png` (new)
- `assets/apple-touch-icon.png` (new)

## Target keyword and page mapping

| Page | Primary topic | Supporting intent |
| --- | --- | --- |
| `/` | Ice cream shop in Memphis | ice cream near me, dessert shop Memphis, family dessert place Memphis, soft serve Memphis, milkshakes Memphis |
| `/visit.html` | Visit Sweet Escape on Whitten Road | ice cream on Whitten Road, ice cream near Bartlett, directions, hours, phone |
| `/stock.html` | Current Sweet Escape menu | products available today, scoop flavors, yogurt, gelato |
| `/flavors.html` | Ice cream flavors and nutrition | ice cream flavors Memphis, allergens, ingredients, nutrition |
| `/yogurt.html` | Frozen yogurt in Memphis | self-serve frozen yogurt, soft serve, sorbet |
| `/gelato.html` | Gelato and sorbetto in Memphis | gelato Memphis, sorbetto, vegan gelato |

“Best ice cream in Memphis” was not presented as an unsupported objective claim.

## Validation results

- JavaScript: every repository `.js` file passed `node --check`.
- Git whitespace validation: `git diff --check` passed.
- Static SEO validator: passed for six public pages.
  - Unique title, description, and canonical on every indexable page
  - Exactly one H1 per indexable page
  - All referenced local links/assets present
  - Valid JSON-LD syntax and required verified business fields
  - Valid sitemap with the exact canonical URL set
  - Canonical sitemap declaration in robots
  - No remaining internal `index.html` links
- Browser route checks:
  - Stock: 32 current product images
  - Scoop catalog: 71 cards/images
  - Yogurt catalog: 29 cards and 29 product images
  - Gelato catalog: 33 cards plus three hero images
  - Visit and 404 pages: correct H1 and usable recovery/conversion actions
- Local request log: core pages, scripts, data, responsive images, icons, map assets, and animation frames returned successfully; no missing local asset requests were observed.
- Desktop visual review: homepage, Visit page, map/address section, catalogs, and 404 rendered without observed layout regression at 1280 × 720.
- Responsive implementation: mobile breakpoints and the fixed three-action bar are present at 760 px and below. The in-app test browser did not honor its requested 390 × 844 viewport override, so a real-device/mobile-emulation spot check remains prudent after deployment.
- PageSpeed Insights API returned a public quota error during the audit, so no synthetic Lighthouse score is claimed. Field LCP/INP/CLS should be reviewed after enough post-deployment traffic accrues.
- This static repository has no build, lint, type-check, or test scripts; direct syntax, SEO, asset, route, and visual checks were used instead.

## Remaining owner/external actions

1. In Google Business Profile, confirm name, address (including Suite 106), phone, regular hours, primary category, and special hours.
2. Keep “Ice cream shop” as the primary category if it remains the most accurate; add only accurate secondary categories.
3. Update the profile website URL to the HTTPS Visit page with tracking, for example:
   `https://www.sweetescapememphis.com/visit.html?utm_source=google&utm_medium=organic&utm_campaign=gbp`
4. Add current products, storefront/interior/product photos, accurate attributes, and holiday hours.
5. Enable **Enforce HTTPS** in GitHub Pages and verify all HTTP/host variants redirect to `https://www.sweetescapememphis.com/`.
6. Connect Google Search Console, submit `https://www.sweetescapememphis.com/sitemap.xml`, and request indexing for the homepage and Visit page after deployment.
7. Confirm GA4 receives `directions_click`, `phone_click`, and `menu_view`; mark the events as key events when appropriate.
8. Earn legitimate citations and links from relevant Memphis/Bartlett organizations, directories, events, chambers, and local media.
9. Encourage honest customer reviews without incentives or review gating, and respond professionally.
10. Confirm price range, parking, accessibility, entrance, payment methods, and holiday hours before adding those facts to the site or schema.
11. Periodically confirm the visible 4.8/130+ Google review summary if it remains on the homepage because ratings and counts change.

## 30/60/90-day measurement plan

### First 30 days

- Record Search Console impressions, clicks, CTR, average position, indexed pages, and non-brand local queries.
- Record GA4 directions, phone, and menu actions by landing page and device.
- Review Google Business Profile directions, calls, website clicks, and discovery terms.
- Verify HTTPS, sitemap discovery, canonical selection, and Visit-page indexing.
- Run Lighthouse on mobile and desktop; monitor field LCP, INP, and CLS as data becomes available.

### By 60 days

- Compare local-query impressions and CTR for the homepage and Visit page.
- Compare directions and calls per organic landing-page session.
- Identify menu pages that assist visits even when they are not the entrance page.
- Refresh only genuinely changed products, hours, photos, and customer-help content.

### By 90 days

- Evaluate qualified growth using organic directions, calls, menu views, and in-store attribution—not rankings alone.
- Improve titles/descriptions for queries with strong impressions but weak CTR.
- Review Core Web Vitals field data when enough Chrome UX data is available.
- Audit citation consistency, local links earned, review velocity, and response coverage.
- Keep nearby-area relevance on the single useful Visit page unless the business opens another staffed location.
