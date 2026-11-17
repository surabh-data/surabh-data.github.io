#!/usr/bin/env node
// Publishes a whole page behind the portfolio access code.
// The page is AES-GCM encrypted (key from PBKDF2-SHA256), so its content and source are not readable in this public repo.
// Usage:  WORK_CODE='your-code' node tools/lock-page.mjs path/to/app.html barbos "Barbos"
// Writes <folder>/index.html. Keep the readable app.html OUTSIDE this repo.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const ITERATIONS = 600000;
const code = process.env.WORK_CODE;
const [src, folder, title] = process.argv.slice(2);
if (!code || !src || !folder || !title) {
  console.error("Usage: WORK_CODE='your-code' node tools/lock-page.mjs app.html folder \"Title\"");
  process.exit(1);
}

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
  base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(readFileSync(src, "utf8"))));
const b64 = (u) => Buffer.from(u).toString("base64");
const payload = JSON.stringify({ v: 1, iter: ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(data) });
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)} | Surabh Saxena</title>
<style>
:root{--deep:#0c253b;--ink:#132033;--muted:#5a6778;--line:#d9e4ec;--amber:#bd7f22;--panel:#fff;--bad:#b3261e}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--deep);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;display:grid;place-items:center;padding:16px}
.card{background:var(--panel);border-radius:12px;padding:28px 24px;width:100%;max-width:380px;box-shadow:0 20px 48px rgba(0,0,0,.3)}
h1{margin:0 0 6px;font-size:24px;text-wrap:balance}
p{margin:0 0 18px;color:var(--muted)}
label{display:block;font-weight:600;font-size:14px;margin-bottom:6px}
input{width:100%;font:inherit;padding:10px 12px;border:1px solid var(--line);border-radius:8px}
input:focus-visible,button:focus-visible,a:focus-visible{outline:2px solid var(--amber);outline-offset:2px}
button{margin-top:14px;width:100%;font:inherit;font-weight:600;border:0;border-radius:8px;padding:11px;background:var(--amber);color:#fff;cursor:pointer}
button:disabled{opacity:.6;cursor:wait}
.status{min-height:22px;margin:10px 0 0;font-size:14px;color:var(--bad)}
.back{display:inline-block;margin-top:16px;font-size:14px;color:var(--muted)}
</style>
</head>
<body>
<form class="card" id="lock">
  <h1>${esc(title)}</h1>
  <p>This project is private. Enter the access code to open the live demo.</p>
  <label for="code">Access code</label>
  <input id="code" type="password" autocomplete="off" required>
  <button type="submit" id="go">Unlock</button>
  <p class="status" role="status" aria-live="polite" id="status"></p>
  <a class="back" href="/#work">Back to portfolio</a>
</form>
<script type="application/json" id="locked">${payload}</script>
<script>
(function(){
  var KEY="work-access-code",form=document.getElementById("lock"),input=document.getElementById("code"),btn=document.getElementById("go"),status=document.getElementById("status");
  function bytes(b){return Uint8Array.from(atob(b),function(c){return c.charCodeAt(0);});}
  function get(){try{return sessionStorage.getItem(KEY);}catch(e){return null;}}
  function set(c){try{sessionStorage.setItem(KEY,c);}catch(e){}}
  function forget(){try{sessionStorage.removeItem(KEY);}catch(e){}}
  async function open(code,quiet){
    if(!window.crypto||!crypto.subtle){status.textContent="This browser cannot unlock the page. Please use a current browser.";return;}
    btn.disabled=true;if(!quiet)status.textContent="";
    try{
      var box=JSON.parse(document.getElementById("locked").textContent);
      var base=await crypto.subtle.importKey("raw",new TextEncoder().encode(code),"PBKDF2",false,["deriveKey"]);
      var key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:bytes(box.salt),iterations:box.iter,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["decrypt"]);
      var html=new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:bytes(box.iv)},key,bytes(box.data)));
      set(code);document.open();document.write(html);document.close();
    }catch(e){forget();if(!quiet){status.textContent="That code did not work. Please check it and try again.";input.select();}}
    finally{btn.disabled=false;}
  }
  form.addEventListener("submit",function(e){e.preventDefault();var c=input.value.trim();if(c)open(c,false);});
  var saved=get();if(saved)open(saved,true);else input.focus();
})();
</script>
</body>
</html>
`;
mkdirSync(new URL(`../${folder}/`, import.meta.url), { recursive: true });
writeFileSync(new URL(`../${folder}/index.html`, import.meta.url), page);
console.log(`${folder}/index.html written: page locked.`);
