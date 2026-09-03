# Sweet Escape Blog — Editorial Plan & Rules for Automated Posts

This file guides the recurring blog-post task. Read it fully before writing any post.

## Verified business facts (never contradict these)
- Sweet Escape, 1674 Whitten Rd, Suite 106, Memphis, TN 38134
- Phone: (901) 718-5812 · Hours: Mon–Thu 12–9 PM, Fri–Sun 12–10 PM
- Products: hand-dipped ice cream, self-serve frozen yogurt with toppings, gelato, sorbetto/sorbet, milkshakes, cookie-based loaded treats, no-sugar-added choices, and vegan gelato choices
- Service-area context: Memphis and nearby Bartlett
- Socials: TikTok @sweetescape901 · Instagram @sweet_escape901 · Facebook "Sweet Escape"
- Current availability must come from the live stock data. Nutrition, ingredient, and allergen statements must match the published product data and retain any cautions shown there.
- NEVER invent or infer: prices or pricing method, free samples, parking, accessibility, entrance details, payment methods, crowd patterns, party/group capacity, reservations, catering, delivery, staff capabilities, manufacturing methods, health benefits, dietary suitability, cross-contact safety, events, offers, or discounts. If a topic needs an unverified fact, write around it or pick another topic.

## Cadence and format
- Publish at most one post per day. If there is no distinct, useful topic supported by verified information, skip the post and report why; never publish filler to satisfy the schedule.
- 500–800 words. One H1, several H2s. At least 3 internal links (/stock.html, /flavors.html, /yogurt.html, /gelato.html, /visit.html, other posts).
- File: `blog/<kebab-case-slug>.html`. Copy the exact HTML structure of `blog/first-timers-guide.html` (head metas, BlogPosting JSON-LD, header, footer, mobile action bar). Update: title, description, canonical, og/twitter tags, JSON-LD headline/description/dates, kicker, H1, body, CTA.
- Add the new post to the TOP of the list in `blog/index.html` and add a `<url>` entry to `sitemap.xml` with the publish date.
- Add the new post to the TOP of `blog/feed.xml`; keep no more than the 20 newest feed items. Every blog page must retain the RSS discovery link in its `<head>`.
- Tone: warm, plainspoken, local, lightly playful. No hype, no emoji, no clickbait. Write like a friendly neighbor who owns an ice cream shop.
- Local SEO: naturally include Memphis and/or Bartlett in the title or first paragraph when it fits. Never keyword-stuff.
- Before choosing a topic, review existing posts and recent Git history to avoid duplicate intent or keyword cannibalization. Each post should answer one clear visitor question better than the existing pages do.

## Topic backlog (work down this list; mark used topics with [x] and the date)
- [ ] How to check the live menu before a Memphis or Bartlett dessert stop
- [ ] Building a froyo cup: a simple guide to flavors and toppings
- [ ] What is sorbetto? How it appears in the Sweet Escape catalog
- [ ] Kids' first ice cream visit: how to compare the current choices
- [ ] No-sugar-added catalog options and what the labels say
- [ ] Meet the case: how to use the rotating in-stock menu
- [ ] Cookie-based loaded treats: what the site currently lists
- [ ] A short, sourced history of gelato and a guide to the current catalog
- [ ] How to read our nutrition, ingredient, and allergen notes before you visit
- [ ] A current flavor spotlight grounded in `data/stock.json` and the product data files
- After the backlog runs out: seasonal search themes and flavor spotlights grounded in current first-party data. Do not state that a seasonal flavor, event, offer, or service exists unless it is verified in the repository or by the owner. Repeat a theme no sooner than 90 days with a fresh angle.

## Definition of done for each run
1. Sync the latest `main` branch and read this file, the existing posts, the stock data, and recent Git history.
2. Create one new post in `blog/` matching the template, or skip when a useful evidence-based topic is unavailable.
3. Update `blog/index.html`, `sitemap.xml`, and `blog/feed.xml`; mark the topic used here with the date.
4. Run `node scripts/seo-audit.mjs`, JavaScript syntax checks, and focused desktop/mobile visual QA. Fix failures before publishing.
5. Commit and push to `main` with message `Blog: <post title>`, without overwriting concurrent stock updates.
6. Wait for the GitHub Pages deployment to succeed and verify that the new URL returns the expected canonical page.
7. Run `node scripts/submit-indexnow.mjs <new-post-url> https://www.sweetescapememphis.com/blog/` and record the HTTP result. Submit only new or meaningfully changed URLs.
8. Keep the XML sitemap and RSS feed available for Google, Bing, Applebot, and other crawlers. Do not use Google's Indexing API for ordinary blog posts, spam repeated crawl requests, or claim that submission guarantees indexing.
