#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const origin = "https://www.sweetescapememphis.com";
const host = "www.sweetescapememphis.com";
const key = "c471a4f8e22b4dc7981a6f4d7b0e3912";
const keyFile = path.resolve(import.meta.dirname, "..", `${key}.txt`);
const keyLocation = `${origin}/${key}.txt`;
const endpoint = "https://api.indexnow.org/indexnow";
const urls = [...new Set(process.argv.slice(2))];

if (!fs.existsSync(keyFile) || fs.readFileSync(keyFile, "utf8").trim() !== key) {
  throw new Error(`IndexNow key file is missing or does not match: ${keyFile}`);
}

if (!urls.length) {
  throw new Error("Pass at least one new or meaningfully updated production URL.");
}

for (const value of urls) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== host) {
    throw new Error(`Refusing to submit a URL outside ${origin}: ${value}`);
  }
}

const keyResponse = await fetch(keyLocation, { cache: "no-store" });
const publishedKey = keyResponse.ok ? (await keyResponse.text()).trim() : "";
if (!keyResponse.ok || publishedKey !== key) {
  throw new Error(`Published IndexNow key is not ready at ${keyLocation} (HTTP ${keyResponse.status}).`);
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList: urls }),
});

if (![200, 202].includes(response.status)) {
  const body = (await response.text()).trim();
  throw new Error(`IndexNow rejected the submission (HTTP ${response.status})${body ? `: ${body}` : "."}`);
}

console.log(`IndexNow accepted ${urls.length} URL${urls.length === 1 ? "" : "s"} (HTTP ${response.status}).`);
for (const url of urls) console.log(`- ${url}`);
