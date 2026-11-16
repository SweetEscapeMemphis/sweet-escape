# Safe technical/live SEO audit — November 16, 2026

Monday scheduled audit. Prepublication baseline: `6e7671a`. No account, search or crawler-rate settings changed.

- At 16:19:39 UTC the public live crawl fetched all 337 sitemap URLs (four concurrent requests); the URL list exactly matched local main. All pages returned 200 with a self-canonical, one H1 and a nonempty description, with no noindex header/tag or malformed JSON-LD. There were no persistent or transient failures. Parsed 473 JSON-LD blocks for syntax, not rich-result eligibility.
- Checked 12,009 root-relative links and asset references across fetched HTML, 623 distinct values, with no missing local path targets. This was not a test of every external link or fragment.
- The HTTP apex, HTTPS apex and HTTP www homepage variants all reached the expected HTTPS www homepage with HTTP 200.
- RSS returned HTTP 200, matched the 20 newest posts in index order, and parsed cleanly with the sitemap. Robots, llms.txt and item directory also returned HTTP 200. All 20 named crawler agents can access the page paths; private stock manager excluded, and sitemap and RSS both advertised by robots.txt.
- Directory regenerated identically: 202 documented items. Owner’s stock-only update preserved. Local SEO audit: 337 pages and one unchanged low-priority warning (legacy tasting-guide title, 73 characters).
- GSC Wizard on-page tool returned `subscription_required` / `payment_required`. Public HTTPS and repository checks substituted. For authenticated coverage, the owner can reconnect GSC Wizard in app settings with an active plan/trial and connected Search Console property; no purchase or setting changes were made. Public crawlability and submission do not demonstrate indexing, actual crawl history, search performance or AI citation. No unchanged URLs submitted.
