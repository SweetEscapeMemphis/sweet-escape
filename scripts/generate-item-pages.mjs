#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const origin = "https://www.sweetescapememphis.com";
const updated = "2026-09-23";

function load(file) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  return Object.values(context.window)[0];
}

const scoopPayload = load("data/flavors.js");
const yogurtPayload = load("data/yogurt-flavors.js");
const gelatoPayload = load("data/gelato-flavors.js");
const pngScoops = new Set(["rocky-road", "udderly-chocolate"]);

const specialties = [
  {
    id: "cookie-dough-base",
    name: "Cookie Dough Base",
    category: "Warm specialty",
    description: "Freshly baked chocolate-chip cookie dough with your choice of one ice cream scoop on top.",
    image: "assets/specialties/cookie-dough-base.webp",
    alt: "Warm baked chocolate-chip cookie dough topped with a scoop of vanilla ice cream",
    width: 1000,
    height: 1000,
  },
  {
    id: "brownie-base",
    name: "Brownie Base",
    category: "Warm specialty",
    description: "A warm brownie base finished with your choice of one ice cream scoop.",
    image: "assets/specialties/brownie-base.webp",
    alt: "Warm fudgy brownie topped with a scoop of vanilla ice cream",
    width: 1000,
    height: 1000,
  },
  {
    id: "dubai-dream",
    name: "Dubai Dream",
    category: "Signature specialty",
    description: "Two scoops layered with rich Dubai chocolate filling, pistachio cream, and crisp kataifi.",
    image: "assets/specialties/dubai-dream.webp",
    alt: "Two scoops of ice cream layered with pistachio Dubai chocolate filling",
    width: 1000,
    height: 1000,
  },
  {
    id: "ice-cream-nachos",
    name: "Ice Cream Nachos",
    category: "Shareable specialty",
    description: "Two scoops of your choice served with crisp round waffle chips for dipping.",
    image: "assets/specialties/ice-cream-nachos.webp",
    alt: "Two scoops of ice cream surrounded by round waffle chips",
    width: 1000,
    height: 1000,
  },
  {
    id: "cookie-ice-cream-sandwich",
    name: "Cookie Ice Cream Sandwich",
    category: "Hand-built specialty",
    description: "Your choice of ice cream pressed between two chocolate-chip cookies.",
    image: "assets/specialties/cookie-ice-cream-sandwich.webp",
    alt: "Chocolate-chip cookie ice cream sandwich with vanilla ice cream",
    width: 960,
    height: 1440,
  },
  {
    id: "self-serve-frozen-yogurt",
    name: "Self-Serve Froyo & Toppings",
    category: "Self-serve specialty",
    description: "Swirl your frozen yogurt, then visit the self-serve topping station to finish it your way.",
    image: "assets/specialties/self-serve-froyo.webp",
    alt: "Self-serve frozen yogurt cup beside a colorful topping station",
    width: 1000,
    height: 1000,
  },
];

const groups = [
  {
    directory: "scoops",
    stockKey: "scoops",
    label: "Scoop flavors",
    singular: "scoop flavor",
    back: "/flavors.html#flavors",
    items: scoopPayload.flavors,
    image(item) {
      const extension = pngScoops.has(item.id) ? "png" : "webp";
      return { path: `assets/scoops/responsive/${item.id}-600.${extension}`, width: 600, height: 600 };
    },
    description(item) {
      return item.description || `${item.name} is a documented ${String(item.category).toLowerCase()} flavor in the Sweet Escape scoop catalog.`;
    },
    details: scoopDetails,
  },
  {
    directory: "yogurt",
    stockKey: "yogurt",
    label: "Yogurt flavors",
    singular: "frozen yogurt flavor",
    back: "/yogurt.html#yogurt-flavors",
    items: yogurtPayload.flavors,
    image(item) { return { path: item.image, width: 600, height: 600 }; },
    description(item) { return item.description; },
    details: yogurtDetails,
  },
  {
    directory: "gelato",
    stockKey: "gelato",
    label: "Gelato & sorbetto",
    singular: "gelato or sorbetto flavor",
    back: "/gelato.html#gelato-flavors",
    items: gelatoPayload.flavors,
    image(item) { return { path: item.image, width: 512, height: 512 }; },
    description(item) { return item.description; },
    details: gelatoDetails,
  },
  {
    directory: "specialties",
    stockKey: "specialties",
    label: "Specialties",
    singular: "Sweet Escape specialty",
    back: "/specialties.html#specialties-menu",
    items: specialties,
    image(item) { return { path: item.image, width: item.width, height: item.height, alt: item.alt }; },
    description(item) { return item.description; },
    details: specialtyDetails,
  },
];

const urls = [];
for (const group of groups) {
  group.items.forEach((item, index) => {
    const previous = group.items[(index - 1 + group.items.length) % group.items.length];
    const next = group.items[(index + 1) % group.items.length];
    const directory = path.join(root, group.directory, item.id);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, "index.html"), renderPage(group, item, previous, next));
    urls.push(`${origin}/${group.directory}/${encodeURIComponent(item.id)}/`);
  });
}

updateSitemap(urls);
console.log(`Generated ${urls.length} standalone item pages and updated sitemap.xml.`);

function renderPage(group, item, previous, next) {
  const image = group.image(item);
  const relativeImage = `/${image.path}`;
  const imageUrl = `${origin}${relativeImage}`;
  const canonical = `${origin}/${group.directory}/${encodeURIComponent(item.id)}/`;
  const description = group.description(item);
  const detailedTitle = `${item.name} ${item.category} | Sweet Escape Memphis`;
  const title = detailedTitle.length <= 65 ? detailedTitle : `${item.name} | Sweet Escape`;
  const metaDescription = `See ${item.name} ${group.singular} details and current menu availability at Sweet Escape in Memphis, Tennessee.`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${item.name} at Sweet Escape`,
    description,
    url: canonical,
    isPartOf: { "@type": "WebSite", name: "Sweet Escape", url: `${origin}/` },
    about: {
      "@type": "MenuItem",
      name: item.name,
      category: item.category,
      description,
      image: imageUrl,
    },
  };
  const imageAlt = image.alt || `${item.name} ${String(item.category).toLowerCase()}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-H90X0LXRD3"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-H90X0LXRD3");</script>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
    <title>${escape(title)}</title>
    <meta name="description" content="${escape(metaDescription)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Sweet Escape">
    <meta property="og:title" content="${escape(title)}">
    <meta property="og:description" content="${escape(metaDescription)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:alt" content="${escape(imageAlt)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escape(title)}">
    <meta name="twitter:description" content="${escape(metaDescription)}">
    <meta name="twitter:image" content="${imageUrl}">
    <meta name="twitter:image:alt" content="${escape(imageAlt)}">
    <script type="application/ld+json">${JSON.stringify(schema)}</script>
    <link rel="stylesheet" href="/home.css?v=20260903-2">
    <link rel="stylesheet" href="/site-actions.css?v=20260827-1">
    <link rel="stylesheet" href="/item-detail.css?v=20260923-1">
    <script defer src="/item-detail.js?v=20260923-1"></script>
    <script defer src="/analytics.js?v=20260923-2"></script>
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to item details</a>
    ${header()}
    <main class="item-main" id="main-content">
      <div class="item-shell">
        <nav class="item-breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="${group.back}">${group.label}</a><span aria-hidden="true">/</span><span>${escape(item.name)}</span></nav>
        <article>
          <div class="item-hero">
            <div class="item-art"><img src="${relativeImage}" alt="${escape(imageAlt)}" width="${image.width}" height="${image.height}" decoding="async"></div>
            <div class="item-copy">
              <p class="eyebrow">${escape(item.category)}</p>
              <h1>${escape(item.name)}</h1>
              <p class="item-description">${escape(description)}</p>
              <p class="item-status" data-item-status data-group="${group.stockKey}" data-item-id="${escape(item.id)}">Checking today’s published menu…</p>
              <div class="item-actions"><a class="home-button primary" href="/stock.html">Check today’s menu</a><a class="home-button secondary" href="${group.back}">Browse all ${group.label.toLowerCase()}</a></div>
            </div>
          </div>
          ${group.details(item)}
        </article>
        <nav class="item-pagination" aria-label="More ${escape(group.label.toLowerCase())}">
          <a href="/${group.directory}/${encodeURIComponent(previous.id)}/"><span>Previous</span><strong>← ${escape(previous.name)}</strong></a>
          <a href="/${group.directory}/${encodeURIComponent(next.id)}/"><span>Next</span><strong>${escape(next.name)} →</strong></a>
        </nav>
      </div>
    </main>
    ${quickActions()}
    ${footer()}
  </body>
</html>
`;
}

function scoopDetails(item) {
  const nutrition = item.nutrition || {};
  const facts = [
    [nutrition.calories, "Calories"],
    [unit(nutrition.totalFatG, "g"), "Total fat"],
    [unit(nutrition.totalCarbsG, "g"), "Carbohydrates"],
    [unit(nutrition.totalSugarsG, "g"), "Total sugars"],
    [unit(nutrition.proteinG, "g"), "Protein"],
  ].filter(([value]) => value);
  const pdfLink = item.pdfPage
    ? `/assets/sweet-escape-nutrition-facts.pdf#page=${item.pdfPage}`
    : "/assets/sweet-escape-nutrition-facts.pdf";
  return `
          <section class="item-facts" aria-label="Published nutrition summary">${facts.map(([value, label]) => fact(value, label)).join("")}</section>
          <section class="item-section"><h2>Serving and product details</h2><p>Published serving size: ${escape(nutrition.servingSize || "See current label")}.</p><p><a href="${pdfLink}">Open the published nutrition source${item.pdfPage ? ` on page ${escape(item.pdfPage)}` : ""}</a>.</p></section>
          <section class="item-section item-callout"><h2>Allergen information</h2><p><strong>Contains:</strong> ${escape(item.allergens?.contains || "Not listed")}</p><p><strong>Shared equipment note:</strong> ${escape(item.allergens?.equipment || "Not listed")}</p><p>Recipes and labels can change. Ask the shop to verify the current container label before ordering when an allergy matters.</p></section>`;
}

function yogurtDetails(item) {
  const declared = Object.entries(item.allergenStatus || {}).filter(([, status]) => status === "Yes").map(([name]) => name);
  return `
          <section class="item-section"><h2>Flavor details</h2><ul class="item-tags"><li>${escape(item.category)}</li>${item.seasonal ? "<li>Seasonal</li>" : ""}</ul></section>
          <section class="item-section"><h2>Ingredients</h2><p>${escape(item.ingredients || "Ask the shop to verify the current container label.")}</p></section>
          <section class="item-section item-callout"><h2>Allergen information</h2><p><strong>Declared allergens:</strong> ${declared.length ? escape(declared.join(", ")) : "No major allergens declared in the published record"}.</p><p>${escape(item.facilityNote || "Ask the shop to verify the current container label before ordering.")}</p></section>
          <section class="item-section"><h2>Published nutrition label</h2><p><a href="${escape(item.nutritionPdf)}" target="_blank" rel="noopener noreferrer">Open the official nutrition PDF</a>.</p><img class="item-label-image" src="/${escape(item.nutritionImage)}" alt="Nutrition Facts for ${escape(item.name)}" width="900" height="1400" loading="lazy"></section>`;
}

function gelatoDetails(item) {
  const facts = item.nutrition ? [
    [item.nutrition.calories, "Calories"],
    [item.nutrition.fat, "Fat"],
    [item.nutrition.carbs, "Carbohydrates"],
    [item.nutrition.sugars, "Sugars"],
    [item.nutrition.protein, "Protein"],
  ].filter(([value]) => value) : [];
  const sources = [
    item.nutritionSource ? `<a href="${escape(item.nutritionSource)}" target="_blank" rel="noopener noreferrer">Nutrition source</a>` : "",
    item.allergenSource && item.allergenSource !== item.nutritionSource ? `<a href="${escape(item.allergenSource)}" target="_blank" rel="noopener noreferrer">Allergen source</a>` : "",
  ].filter(Boolean).join(" · ");
  return `
          ${facts.length ? `<section class="item-facts" aria-label="Published nutrition summary">${facts.map(([value, label]) => fact(value, label)).join("")}</section>` : ""}
          <section class="item-section"><h2>Published product details</h2><p>${item.nutrition?.serving ? `Serving: ${escape(item.nutrition.serving)}.` : "A complete numeric nutrition label was not available in the published record."}</p>${sources ? `<p>${sources}</p>` : ""}</section>
          <section class="item-section item-callout"><h2>Allergen information</h2><p><strong>Known allergens:</strong> ${item.allergens?.length ? escape(item.allergens.join(", ")) : "No complete statement published online"}.</p>${item.mayContain?.length ? `<p><strong>May contain:</strong> ${escape(item.mayContain.join(", "))}.</p>` : ""}${item.allergenNote ? `<p>${escape(item.allergenNote)}</p>` : ""}<p>Ask the shop to verify the current container label before ordering when an allergy matters.</p></section>`;
}

function specialtyDetails(item) {
  return `
          <section class="item-section"><h2>How it’s served</h2><p>${escape(item.description)} Flavor choices, toppings, and availability may change throughout the day.</p></section>
          <section class="item-section item-callout"><h2>Before you order</h2><p>This specialty may combine several products. Ask the shop to verify each current ingredient and container label when an allergy or dietary need matters.</p><p><a href="tel:+19017185812">Call Sweet Escape at (901) 718-5812</a> with questions.</p></section>`;
}

function fact(value, label) {
  return `<div class="item-fact"><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`;
}

function unit(value, suffix) {
  return value === undefined || value === null || value === "" ? "" : `${value}${suffix}`;
}

function header() {
  return `<header class="home-topbar" id="top"><a class="home-brand" href="/" aria-label="Sweet Escape home"><span class="brand-wordmark"><span>Sweet</span> Escape</span></a><nav class="home-nav" aria-label="Primary"><a href="/">Home</a><a href="/stock.html">In stock</a><a href="/flavors.html#flavors">Scoop flavors</a><a href="/yogurt.html">Yogurt flavors</a><a href="/gelato.html">Gelato</a><a href="/specialties.html">Specialties</a><a href="/visit.html">Visit</a><a href="/rewards.html">Rewards</a><a href="/item-directory.html">All items</a></nav></header>`;
}

function quickActions() {
  return `<nav class="mobile-action-bar" aria-label="Quick store actions"><a href="https://share.google/4KF1GDH3zOARV0nm1" target="_blank" rel="noopener noreferrer">Directions</a><a href="tel:+19017185812">Call</a><a href="/stock.html">Menu</a></nav>`;
}

function footer() {
  return `<footer class="home-footer"><a href="/" aria-label="Sweet Escape home"><span class="footer-wordmark"><span>Sweet</span> Escape</span></a><nav aria-label="Footer"><a href="/stock.html">In stock</a><a href="/flavors.html#flavors">Scoops</a><a href="/yogurt.html">Yogurt</a><a href="/gelato.html">Gelato</a><a href="/specialties.html">Specialties</a><a href="/item-directory.html">All items</a><a href="/visit.html">Visit</a><a href="/blog/">Blog</a></nav><address class="footer-contact"><a href="https://share.google/4KF1GDH3zOARV0nm1" target="_blank" rel="noopener noreferrer">1674 Whitten Rd, Suite 106, Memphis, TN 38134</a><a href="tel:+19017185812">(901) 718-5812</a><span>Mon–Thu 12–9 PM · Fri–Sun 12–10 PM</span></address><a class="back-top" href="#top">Back to top</a></footer>`;
}

function updateSitemap(itemUrls) {
  const file = path.join(root, "sitemap.xml");
  let sitemap = fs.readFileSync(file, "utf8");
  sitemap = sitemap.replace(/\s*<url>\s*<loc>https:\/\/www\.sweetescapememphis\.com\/(?:scoops|yogurt|gelato|specialties)\/[^<]+<\/loc>[\s\S]*?<\/url>/g, "");
  const entries = itemUrls.map((url) => `  <url><loc>${url}</loc><lastmod>${updated}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join("\n");
  sitemap = sitemap.replace("</urlset>", `${entries}\n</urlset>`);
  fs.writeFileSync(file, sitemap);
}

function escape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
