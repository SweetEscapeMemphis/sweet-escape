# Safe technical/live SEO audit — November 9, 2026

Monday scheduled review, before the new blueberry article. Repository baseline aefdafd732be6825d076e386df548b89568046f6. Read-only checks; no account or crawler-rate settings changed.

## Scope and results

- Local repository SEO audit: 321 indexable sitemap pages; 321 unique titles, descriptions and canonicals; no errors. One existing low-priority warning: blog/ice-cream-flavor-tasting-guide.html title is 73 characters. No unrelated title rewrite made.
- Live public sitemap crawl completed at 2026-11-09T17:24:20.751Z, four concurrent requests. All 321 canonical URLs fetched. 320 initially returned HTTP 200 with expected self-canonical, one H1 and no noindex. /scoops/tennessee-toffee/ returned one transient 503.
- Targeted recheck at 17:27:37.206Z: 25 pages passed HTTP 200, expected self-canonical, one H1, nonempty description and no noindex, including Tennessee Toffee. The other 24 were formatting false positives from an overly strict initial metadata matcher (line breaks between attributes); corrected tag/attribute parsing confirmed the existing descriptions. No website metadata fix was needed.
- No persistent HTTP/canonical/noindex/H1 failure observed across the 321 prepublication sitemap URLs after targeted rechecks.
- JSON-LD parsed on successful live responses; repository SEO audit also passed. These are syntax/on-page checks, not a rich-result eligibility or indexing guarantee.
- 12,710 root-relative local links/assets checked across sitemap pages; zero missing local targets. This verifies file targets, not all external links or every fragment.
- HTTP apex, HTTPS apex and HTTP www homepage variants all resolved to https://www.sweetescapememphis.com/ with final HTTP 200.
- sitemap.xml and blog/feed.xml parsed with xmllint; RSS contains the newest 20 posts.
- All ten calculator regression tests passed. Broader JavaScript syntax/new-article links/rendering checks recorded with publication.
- robots.txt permits all named major search and AI discovery/training user agents plus wildcard at root; only /stock-manager.html intentionally disallowed. Canonical sitemap and RSS locations advertised.
- Complete item directory: 200 unique catalog item paths; regenerated identically after latest stock sync. Products/stock/ordering integration left unchanged.
- Recent malt, freezer and maraschino-cherry articles included in full live crawl; no persistent crawlability defect found.

## Access limits and interpretation

GSC Wizard tracker API read returned subscription_required/payment_required. Existing authenticated Search Console browser tab was found, but normal and alternate supported state routes failed before inspection. No Google-selected canonical, tracker status, coverage, search performance, actual crawler logs or Bing Webmaster account evidence available. No repeated blocked API calls, subscription purchase, reconnect or account-setting mutation. To restore GSC Wizard, owner would need active plan/trial plus connected Search Console account and reconnect through app settings if required.

These public HTTP/on-page checks do not establish observed indexing, Core Web Vitals, ranking, citation or inclusion by any engine or AI service. No Google Indexing API used for blogs. No unchanged URLs resubmitted as part of the audit.

## Follow-up

Continue scheduled recent-post crawl/index evidence checks; inspect authenticated coverage when access works. Investigate the Tennessee Toffee endpoint only if 5xx recurs; one transient response resolved without a site change. Existing title-length warning is nonblocking housekeeping. Next full scheduled Monday review November 16, or sooner if a material technical issue appears.
