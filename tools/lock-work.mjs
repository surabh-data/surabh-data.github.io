#!/usr/bin/env node
// Publishes the Work section with its project cards visible and every link locked.
// The real link addresses are AES-GCM encrypted, so they are not readable in this public repo.
// Usage:  WORK_CODE='your-code' node tools/lock-work.mjs path/to/work-section.html
// Keep work-section.html (the version with real links) OUTSIDE this repo.
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const ITERATIONS = 600000; // PBKDF2-HMAC-SHA256
const code = process.env.WORK_CODE;
const src = process.argv[2];
if (!code || !src) {
  console.error("Usage: WORK_CODE='your-code' node tools/lock-work.mjs work-section.html");
  process.exit(1);
}

const urls = [];
const lockIcon = '<svg class="lock-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2H12a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h.5Zm1.5 0h4V5a2 2 0 0 0-4 0v2Z"/></svg>';
const cards = readFileSync(src, "utf8").replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/g, (_, attrs, label) => {
  const href = /href="([^"]*)"/.exec(attrs)?.[1] ?? "";
  const cls = /class="([^"]*)"/.exec(attrs)?.[1];
  urls.push(href);
  return `<a${cls ? ` class="${cls}"` : ""} href="#work" data-locked-link="${urls.length - 1}">${lockIcon}${label.trim()}</a>`;
});

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
  base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(urls))));
const b64 = (u) => Buffer.from(u).toString("base64");
const payload = JSON.stringify({ v: 2, iter: ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(data) });

const file = new URL("../index.html", import.meta.url);
let html = readFileSync(file, "utf8");
const cardsRe = /(<!-- work:start -->\n)[\s\S]*?(\s*<!-- work:end -->)/;
const boxRe = /(<script type="application\/json" id="work-locked">)[\s\S]*?(<\/script>)/;
if (!cardsRe.test(html) || !boxRe.test(html)) { console.error("Work markers not found in index.html"); process.exit(1); }
html = html.replace(cardsRe, (_, a, b) => a + cards.replace(/\s+$/, "") + "\n" + b.replace(/^\s*\n?/, "        "));
html = html.replace(boxRe, (_, a, b) => a + payload + b);
writeFileSync(file, html);
console.log(`index.html updated: ${urls.length} links locked.`);
