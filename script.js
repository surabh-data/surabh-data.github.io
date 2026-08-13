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
