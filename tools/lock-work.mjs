#!/usr/bin/env node
// Encrypts the Work section HTML so it can sit safely in this public repo.
// Usage:  WORK_CODE='your-code' node tools/lock-work.mjs path/to/work-section.html
// Keep work-section.html (the readable version) OUTSIDE this repo.
// The script rewrites the encrypted block inside index.html.
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const ITERATIONS = 600000; // PBKDF2-HMAC-SHA256
const code = process.env.WORK_CODE;
const src = process.argv[2];
if (!code || !src) {
  console.error("Usage: WORK_CODE='your-code' node tools/lock-work.mjs work-section.html");
  process.exit(1);
}
const plain = readFileSync(src);
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
  base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain));
const b64 = (u) => Buffer.from(u).toString("base64");
const payload = JSON.stringify({ v: 1, iter: ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(data) });

const file = new URL("../index.html", import.meta.url);
const html = readFileSync(file, "utf8");
const re = /(<script type="application\/json" id="work-locked">)[\s\S]*?(<\/script>)/;
if (!re.test(html)) { console.error("work-locked block not found in index.html"); process.exit(1); }
writeFileSync(file, html.replace(re, (_, a, b) => a + payload + b));
console.log("index.html updated with newly encrypted Work section.");
