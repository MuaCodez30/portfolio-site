import { initField, setPointer } from "./field";

const root = document.documentElement;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- One pointer listener for the page ---------- */
// Feeds the background field and the card light. Mouse only: touch and pen
// keep ordinary scrolling with no hover-dependent behaviour.
let card: HTMLElement | null = null;
let cx = 0;
let cy = 0;
let cardRaf = 0;

function paintCard() {
  cardRaf = 0;
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty("--mx", `${cx - r.left}px`);
  card.style.setProperty("--my", `${cy - r.top}px`);
}

addEventListener(
  "pointermove",
  (e) => {
    if (e.pointerType !== "mouse") return;
    setPointer(e.clientX, e.clientY, true);
    if (!finePointer.matches) return;
    const next = (e.target as Element | null)?.closest<HTMLElement>(".card") ?? null;
    card = next;
    if (!card) return;
    cx = e.clientX;
    cy = e.clientY;
    if (!cardRaf) cardRaf = requestAnimationFrame(paintCard);
  },
  { passive: true },
);
root.addEventListener("mouseleave", () => setPointer(-1e4, -1e4, false));
addEventListener("blur", () => setPointer(-1e4, -1e4, false));

/* ---------- Active section + progress in the side nav ---------- */
const links = new Map<string, HTMLAnchorElement>();
document.querySelectorAll<HTMLAnchorElement>("[data-nav] a").forEach((a) => links.set(a.hash.slice(1), a));
const sections = [...links.keys()]
  .map((id) => document.getElementById(id))
  .filter((el): el is HTMLElement => !!el);

let tops: number[] = [];
let heights: number[] = [];
let docH = 0;
let current: HTMLAnchorElement | null = null;
let navRaf = 0;

function measureSections() {
  const y = scrollY;
  tops = sections.map((s) => s.getBoundingClientRect().top + y);
  heights = sections.map((s) => s.offsetHeight);
  docH = root.scrollHeight;
  updateNav();
}

function updateNav() {
  navRaf = 0;
  if (!sections.length) return;
  const vh = innerHeight;
  const probe = scrollY + vh * 0.3; // the reading line, 30% down the viewport
  const atEnd = scrollY + vh >= docH - 2;
  let idx = -1;
  for (let i = 0; i < tops.length; i++) if (tops[i] <= probe) idx = i;
  if (atEnd) idx = sections.length - 1; // short last section still lights up
  const link = idx >= 0 ? links.get(sections[idx].id) ?? null : null;
  if (link !== current) {
    current?.removeAttribute("aria-current");
    current?.style.removeProperty("--p");
    link?.setAttribute("aria-current", "true");
    current = link;
  }
  if (link) {
    const p = atEnd ? 1 : Math.min(1, Math.max(0, (probe - tops[idx]) / Math.max(1, heights[idx])));
    link.style.setProperty("--p", p.toFixed(3));
  }
}

if (sections.length) {
  addEventListener(
    "scroll",
    () => {
      if (!navRaf) navRaf = requestAnimationFrame(updateNav);
    },
    { passive: true },
  );
  addEventListener("resize", () => requestAnimationFrame(measureSections), { passive: true });
  const main = document.querySelector("main");
  if (main && "ResizeObserver" in window) new ResizeObserver(() => measureSections()).observe(main);
  document.fonts?.ready.then(measureSections);
  measureSections();
}

/* ---------- One-time reveal on scroll ---------- */
// Content is visible by default. Only with JS and motion allowed do items
// below the fold start hidden, and each one reveals once, never again.
function initReveal() {
  if (reduceMQ.matches || !("IntersectionObserver" in window)) return;
  const items = [...document.querySelectorAll<HTMLElement>(".reveal")];
  const vh = innerHeight;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    },
    { threshold: 0 }, // any pixel in view counts, so content at the very end still reveals
  );
  for (const el of items) {
    if (el.getBoundingClientRect().top < vh) el.classList.add("is-in", "seen"); // already visible: no animation
    else io.observe(el);
  }
  root.classList.add("js-reveal");
  // If the preference changes mid-session, show everything immediately
  reduceMQ.addEventListener("change", () => {
    if (!reduceMQ.matches) return;
    io.disconnect();
    items.forEach((el) => el.classList.add("is-in"));
  });
}

/* ---------- Whole experience card opens "Learn more" ---------- */
// A click anywhere on the card toggles its details, except on links,
// the summary itself (native toggle) or while the user is selecting text.
document.addEventListener("click", (e) => {
  const t = e.target as Element | null;
  const card = t?.closest<HTMLElement>(".job-card.has-more");
  if (!card || t?.closest("a, button, summary, .more .bullets")) return;
  if (getSelection()?.toString()) return;
  const d = card.querySelector<HTMLDetailsElement>("details.more");
  if (d) d.open = !d.open;
});

initReveal();
initField();
