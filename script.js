const header = document.querySelector("[data-header]");
const navMenu = document.querySelector("[data-nav-menu]");
const navToggle = document.querySelector("[data-nav-toggle]");
const year = document.querySelector("[data-year]");
const revealItems = document.querySelectorAll(".reveal");

function syncHeader() {
  const forceLight = header?.classList.contains("light");
  const isScrolled = window.scrollY > 12;
  header?.classList.toggle("is-scrolled", Boolean(forceLight || isScrolled));
}

function closeNav() {
  navMenu?.classList.remove("is-open");
  header?.classList.remove("is-open");
  navToggle?.setAttribute("aria-label", "Open navigation");
  navToggle?.setAttribute("aria-expanded", "false");
}

if (year) {
  year.textContent = new Date().getFullYear();
}

navToggle?.setAttribute("aria-expanded", "false");
syncHeader();

window.addEventListener("scroll", syncHeader, { passive: true });

navToggle?.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("is-open");
  header.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeNav);
});

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

// Work section: content is AES-GCM encrypted in index.html and unlocked with an access code.
(function workLock() {
  const store = document.getElementById("work-locked");
  const lock = document.querySelector("[data-work-lock]");
  const target = document.querySelector("[data-work-content]");
  const form = document.querySelector("[data-work-form]");
  if (!store || !lock || !target || !form) return;

  const input = form.querySelector("[data-work-code]");
  const submit = form.querySelector("[data-work-submit]");
  const status = lock.querySelector("[data-work-status]");
  const KEY = "work-access-code";
  const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  function remembered() {
    try { return sessionStorage.getItem(KEY); } catch (e) { return null; }
  }
  function remember(code) {
    try { sessionStorage.setItem(KEY, code); } catch (e) { /* storage unavailable */ }
  }
  function forget() {
    try { sessionStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ }
  }

  async function decrypt(code) {
    const box = JSON.parse(store.textContent);
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: bytes(box.salt), iterations: box.iter, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(box.iv) }, key, bytes(box.data));
    return new TextDecoder().decode(plain);
  }

  async function unlock(code, quiet) {
    if (!window.crypto || !crypto.subtle) {
      status.textContent = "This browser cannot unlock the section. Please open the site over https in a current browser.";
      return;
    }
    submit.disabled = true;
    if (!quiet) status.textContent = "Checking code...";
    try {
      target.innerHTML = await decrypt(code);
      target.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
      target.hidden = false;
      lock.hidden = true;
      remember(code);
    } catch (e) {
      forget();
      if (!quiet) {
        status.textContent = "That code did not work. Please check it and try again.";
        input.select();
      }
    } finally {
      submit.disabled = false;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = input.value.trim();
    if (code) unlock(code, false);
  });

  const saved = remembered();
  if (saved) unlock(saved, true);
})();
