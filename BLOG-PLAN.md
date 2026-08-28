# Sweet Escape Blog — Editorial Plan & Rules for Automated Posts

This file guides the recurring blog-post task. Read it fully before writing any post.

## Business facts (never contradict these)
- Sweet Escape, 1674 Whitten Rd, Suite 106, Memphis, TN 38134 (Goodlett Commons shopping center, minutes from Bartlett)
- Phone: (901) 718-5812 · Hours: Mon–Thu 12–9 PM, Fri–Sun 12–10 PM
- Products: hand-dipped scoop ice cream, self-serve frozen yogurt with toppings, gelato, sorbetto/sorbet, milkshakes, warm cookie treats/loaded creations. Pay-by-weight pricing. Samples on request.
- Socials: TikTok @sweetescape901 · Instagram @sweet_escape901 · Facebook "Sweet Escape"
- NEVER invent: prices, party packages, catering services, delivery promises, new products, events, or discounts. If a topic needs a fact not listed here or on the site, write around it or pick another topic.

## Cadence and format
- 2–3 posts per week (task runs Mon/Wed/Fri).
- 500–800 words. One H1, several H2s. At least 3 internal links (/stock.html, /flavors.html, /yogurt.html, /gelato.html, /visit.html, other posts).
- File: `blog/<kebab-case-slug>.html`. Copy the exact HTML structure of `blog/first-timers-guide.html` (head metas, BlogPosting JSON-LD, header, footer, mobile action bar). Update: title, description, canonical, og/twitter tags, JSON-LD headline/description/dates, kicker, H1, body, CTA.
- Add the new post to the TOP of the list in `blog/index.html` and add a `<url>` entry to `sitemap.xml` with the publish date.
- Tone: warm, plainspoken, local, lightly playful. No hype, no emoji, no clickbait. Write like a friendly neighbor who owns an ice cream shop.
- Local SEO: naturally include Memphis and/or Bartlett in the title or first paragraph when it fits. Never keyword-stuff.

## Topic backlog (work down this list; mark used topics with [x] and the date)
- [ ] Best dessert stop after a Bartlett ballgame: late-night hours explained
- [ ] How we keep our shop spotless (reviewers' favorite thing about us)
- [ ] Building the perfect froyo cup: topping strategy from the pros
- [ ] What is sorbetto? The dairy-free option most people walk past
- [ ] Date night in northeast Memphis: dinner ideas near Goodlett Commons + dessert at ours
- [ ] Why samples are always free at Sweet Escape
- [ ] Kids' first ice cream visit: a parent's cheat sheet
- [ ] Milkshakes 101: how we make them thick
- [ ] No-sugar-added options at Sweet Escape, honestly explained
- [ ] Meet the case: how our flavor rotation works and how to catch your favorite
- [ ] Cookie + scoop: the loaded treat order regulars swear by
- [ ] A short history of gelato (and how ours is served)
- [ ] Rainy-day Memphis: why ice cream weather is a myth
- [ ] How to read our nutrition and allergen notes before you visit
- [ ] Fall flavors we're excited about (only if actually in the live menu — check stock data files)
- After the backlog runs out: seasonal angles (holidays, school events, Memphis weather), new flavor spotlights grounded in `data/` stock files, and expansions of review themes. Repeat a theme no sooner than 90 days with a fresh angle.

## Definition of done for each run
1. New post file in `blog/` matching the template structure exactly.
2. `blog/index.html` updated (new card at top, correct date).
3. `sitemap.xml` updated with the new URL.
4. This file updated: topic checked off with date.
5. All internal links verified to exist. Committed and pushed to main with message: `Blog: <post title>`.
