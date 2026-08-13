const header = document.querySelector("[data-header]");
const navMenu = document.querySelector("[data-nav-menu]");
const navToggle = document.querySelector("[data-nav-toggle]");
const year = document.querySelector("[data-year]");
const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = document.querySelectorAll("[data-category]");

function syncHeader() {
  const isScrolled = window.scrollY > 12;
  header?.classList.toggle("is-scrolled", isScrolled);
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

filterButtons.forEach((button) => {
  button.setAttribute("aria-pressed", button.classList.contains("is-active") ? "true" : "false");

  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });

    projectCards.forEach((card) => {
      const categories = card.dataset.category.split(" ");
      card.hidden = filter !== "all" && !categories.includes(filter);
    });
  });
});
