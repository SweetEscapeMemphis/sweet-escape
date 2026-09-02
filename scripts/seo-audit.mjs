#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const origin = "https://www.sweetescapememphis.com";
const sitemapPath = path.join(root, "sitemap.xml");
const errors = [];
const warnings = [];

const decodeEntities = (value = "") => value
  .replace(/&amp;/g, "&")
  .replace(/&apos;|&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
  .replace(/\s+/g, " ")
  .trim();

const getAttr = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match ? decodeEntities(match[2]) : "";
};

const pageFile = (url) => {
  const pathname = decodeURIComponent(new URL(url, origin).pathname);
  if (pathname === "/") return "index.html";
  if (pathname.endsWith("/")) return `${pathname.slice(1)}index.html`;
  return pathname.slice(1);
};

const pageUrl = (file) => {
  if (file === "index.html") return `${origin}/`;
  if (file.endsWith("/index.html")) return `${origin}/${file.slice(0, -10)}`;
  return `${origin}/${file}`;
};

const sitemap = fs.readFileSync(sitemapPath, "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());
const sitemapFiles = sitemapUrls.map(pageFile);

if (new Set(sitemapUrls).size !== sitemapUrls.length) {
  errors.push("sitemap.xml contains duplicate URLs");
}

const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();

for (const [index, file] of sitemapFiles.entries()) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    errors.push(`${file}: sitemap target does not exist`);
    continue;
  }

  const html = fs.readFileSync(absolute, "utf8");
  const title = decodeEntities(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  const description = getAttr(metas.find((tag) => getAttr(tag, "name").toLowerCase() === "description") ?? "", "content");
  const robots = getAttr(metas.find((tag) => getAttr(tag, "name").toLowerCase() === "robots") ?? "", "content").toLowerCase();
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  const canonical = getAttr(links.find((tag) => getAttr(tag, "rel").toLowerCase() === "canonical") ?? "", "href");
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;

  if (/^blog\/.+\.html$/.test(file) && file !== "blog/index.html") {
    const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? "";
    const articleText = decodeEntities(article.replace(/<[^>]+>/g, " "));
    const wordCount = articleText ? articleText.split(/\s+/).length : 0;
    if (wordCount < 500 || wordCount > 800) {
      errors.push(`${file}: article length is ${wordCount} words; expected 500-800`);
    }
  }

  if (!title) errors.push(`${file}: missing title`);
  if (!description) errors.push(`${file}: missing meta description`);
  if (!canonical) errors.push(`${file}: missing canonical`);
  if (canonical && canonical !== sitemapUrls[index]) {
    errors.push(`${file}: canonical ${canonical} does not match sitemap URL ${sitemapUrls[index]}`);
  }
  if (!robots.includes("index") || !robots.includes("follow")) {
    errors.push(`${file}: expected index, follow robots directive`);
  }
  if (h1Count !== 1) errors.push(`${file}: expected one H1, found ${h1Count}`);
  if (title.length < 30 || title.length > 65) warnings.push(`${file}: title length is ${title.length}`);
  if (description.length < 70 || description.length > 160) warnings.push(`${file}: description length is ${description.length}`);

  for (const [value, map, label] of [
    [title, titles, "title"],
    [description, descriptions, "description"],
    [canonical, canonicals, "canonical"],
  ]) {
    if (!value) continue;
    if (map.has(value)) errors.push(`${file}: duplicate ${label} also used by ${map.get(value)}`);
    else map.set(value, file);
  }

  for (const [scriptIndex, match] of [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].entries()) {
    const json = match[1].trim();
    try {
      JSON.parse(json);
    } catch (error) {
      errors.push(`${file}: JSON-LD block ${scriptIndex + 1} is invalid (${error.message})`);
    }
    if (/&(?:amp|apos|quot|lt|gt|#\d+|#x[0-9a-f]+);/i.test(json)) {
      errors.push(`${file}: JSON-LD block ${scriptIndex + 1} contains an HTML entity`);
    }
  }

  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    if (!/\balt\s*=/i.test(tag)) errors.push(`${file}: image is missing an alt attribute`);
    if (!/\bwidth\s*=/i.test(tag) || !/\bheight\s*=/i.test(tag)) {
      warnings.push(`${file}: image lacks intrinsic width or height (${getAttr(tag, "src")})`);
    }
  }

  const references = [];
  for (const tag of html.match(/<(?:a|link|script|img|source)\b[^>]*>/gi) ?? []) {
    for (const attribute of ["href", "src"]) {
      const value = getAttr(tag, attribute);
      if (value) references.push(value);
    }
    const srcset = getAttr(tag, "srcset");
    if (srcset) references.push(...srcset.split(",").map((item) => item.trim().split(/\s+/)[0]));
  }

  for (const reference of references) {
    if (/^(?:tel:|mailto:|javascript:|data:)/i.test(reference) || reference === "#") continue;
    let resolved;
    try {
      resolved = new URL(reference, pageUrl(file));
    } catch {
      errors.push(`${file}: invalid URL ${reference}`);
      continue;
    }
    if (resolved.origin !== origin) continue;
    const targetFile = pageFile(resolved);
    const targetPath = path.join(root, targetFile);
    if (!fs.existsSync(targetPath)) {
      errors.push(`${file}: broken internal reference ${reference} -> ${targetFile}`);
      continue;
    }
    if (resolved.hash && targetFile.endsWith(".html")) {
      const id = decodeURIComponent(resolved.hash.slice(1));
      const target = fs.readFileSync(targetPath, "utf8");
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const hasStaticTarget = new RegExp(`\\bid=["']${escaped}["']`, "i").test(target);
      const hasDataTarget = (target.match(/<script\b[^>]*\bsrc=["'][^"']+["'][^>]*>/gi) ?? [])
        .map((tag) => getAttr(tag, "src"))
        .filter(Boolean)
        .map((source) => new URL(source, pageUrl(targetFile)))
        .filter((source) => source.origin === origin)
        .map((source) => path.join(root, pageFile(source)))
        .filter((source) => fs.existsSync(source))
        .some((source) => new RegExp(`["']id["']\\s*:\\s*["']${escaped}["']`, "i")
          .test(fs.readFileSync(source, "utf8")));
      if (!hasStaticTarget && !hasDataTarget) {
        errors.push(`${file}: missing fragment target ${reference}`);
      }
    }
  }
}

const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) {
  errors.push("robots.txt does not declare the canonical sitemap URL");
}

console.log(`Audited ${sitemapFiles.length} indexable pages from sitemap.xml.`);
console.log(`Unique titles: ${titles.size}; descriptions: ${descriptions.size}; canonicals: ${canonicals.size}.`);
if (warnings.length) {
  console.log(`Warnings (${warnings.length}):`);
  for (const warning of warnings) console.log(`- ${warning}`);
}
if (errors.length) {
  console.error(`Errors (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("SEO audit passed with no errors.");
}
