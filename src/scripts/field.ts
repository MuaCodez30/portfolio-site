// Ambient network background: a sparse field of points that grows out of the
// static dot grid, links nearby points with thin lines and responds gently to
// the mouse. Abstract decoration only — it does not depict any real model.
//
// Runs only on wide screens with a fine pointer. Phones, tablets, no-JS and
// unsupported browsers keep the static CSS dot grid (.backdrop).

type Point = { x: number; y: number; vx: number; vy: number; ox: number; oy: number; w: number };

const GRID = 22; // matches the CSS dot grid, so points start on its dots
const LINK = 140; // max link length, px
const LINK2 = LINK * LINK;
const REACH = 160; // pointer influence radius, px
const REACH2 = REACH * REACH;
const PUSH = 14; // max displacement near the pointer, px
const MAX_DPR = 1.5;
const MAX_POINTS = 80;
const QUIET = 0.32; // visibility multiplier behind text columns

const root = document.documentElement;
const wideMQ = matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let glow: HTMLCanvasElement | null = null;
let pts: Point[] = [];
let w = 0;
let h = 0;
let dpr = 1;
let raf = 0;
let last = 0;
let animating = false;

// Pointer state (fed by ui.ts through setPointer, one listener for the page)
let px = -1e4;
let py = -1e4;
let pointerIn = false;
let influence = 0; // eases 0..1 so the highlight fades in and out

// Horizontal text columns, measured on resize only (no layout reads per frame)
let quiet: [number, number][] = [];
let ink = "#17191a";
let accent = "#0d7a6f";
let dark = false;

function readTheme() {
  const cs = getComputedStyle(root);
  ink = cs.getPropertyValue("--text").trim() || ink;
  accent = cs.getPropertyValue("--accent").trim() || accent;
  dark = root.dataset.theme === "dark";
  glow = makeGlow();
}

function makeGlow(): HTMLCanvasElement {
  // Pre-rendered soft light, drawn with drawImage so frames allocate nothing
  const size = REACH * 2;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(REACH, REACH, 0, REACH, REACH, REACH);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, "transparent");
  g.globalAlpha = dark ? 0.045 : 0.04;
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

function measureColumns() {
  quiet = [];
  for (const sel of [".side", "main"]) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    quiet.push([r.left, r.right]);
  }
}

// 1 in empty margins, QUIET behind text, with a soft 56px ramp; also fades
// toward the bottom of the viewport like the CSS dot mask.
function weightAt(x: number, y: number): number {
  let m = 1;
  for (let i = 0; i < quiet.length; i++) {
    const [l, r] = quiet[i];
    const d = x < l ? l - x : x > r ? x - r : 0;
    const k = d >= 56 ? 1 : QUIET + (1 - QUIET) * (d / 56);
    if (k < m) m = k;
  }
  const fy = y / h;
  return fy < 0.55 ? m : m * (1 - 0.6 * ((fy - 0.55) / 0.45));
}

function seed() {
  const n = Math.min(MAX_POINTS, Math.max(28, Math.round((w * h) / 17000)));
  pts = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 3 + Math.random() * 6; // px per second: slow drift
    pts.push({
      x: Math.round((Math.random() * w) / GRID) * GRID,
      y: Math.round((Math.random() * h) / GRID) * GRID,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      ox: 0,
      oy: 0,
      w: 1,
    });
  }
}

function resize() {
  if (!canvas || !ctx) return;
  const nw = innerWidth;
  const nh = innerHeight;
  const ndpr = Math.min(devicePixelRatio || 1, MAX_DPR);
  const reseed = !pts.length || Math.abs(nw * nh - w * h) > w * h * 0.25;
  w = nw;
  h = nh;
  dpr = ndpr;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  measureColumns();
  if (reseed) seed();
  if (!animating) draw();
}

function step(dt: number) {
  const ease = 1 - Math.exp(-dt * 5); // frame-rate independent smoothing
  influence += ((pointerIn ? 1 : 0) - influence) * (1 - Math.exp(-dt * 3));
  if (bt > 0) bt = Math.max(0, bt - dt);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < -20) p.x += w + 40;
    else if (p.x > w + 20) p.x -= w + 40;
    if (p.y < -20) p.y += h + 40;
    else if (p.y > h + 20) p.y -= h + 40;

    let tx = 0;
    let ty = 0;
    if (pointerIn) {
      const dx = p.x - px;
      const dy = p.y - py;
      const d2 = dx * dx + dy * dy;
      if (d2 < REACH2 && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const f = (1 - d / REACH) ** 2 * PUSH;
        tx = (dx / d) * f;
        ty = (dy / d) * f;
      }
    }
    if (bt > 0) {
      const dx = p.x - bx;
      const dy = p.y - by;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const front = (1.1 - bt) * 900; // ring expands at ~900 px/s
      const k = Math.max(0, 1 - Math.abs(d - front) / 120) * 34 * (bt / 1.1);
      tx += (dx / d) * k;
      ty += (dy / d) * k;
    }
    p.ox += (tx - p.ox) * ease;
    p.oy += (ty - p.oy) * ease;
    p.w = weightAt(p.x + p.ox, p.y + p.oy);
  }
}

function draw() {
  const c = ctx;
  if (!c) return;
  c.clearRect(0, 0, w, h);
  const lineBase = dark ? 0.15 : 0.12;
  const dotBase = dark ? 0.24 : 0.22;
  const hl = influence;

  if (glow && hl > 0.01) {
    c.globalAlpha = hl;
    c.drawImage(glow, px - REACH, py - REACH);
  }

  c.lineWidth = 1;
  let style = "";
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const ax = a.x + a.ox;
    const ay = a.y + a.oy;
    for (let j = i + 1; j < pts.length; j++) {
      const b = pts[j];
      const bx = b.x + b.ox;
      const by = b.y + b.oy;
      const dx = ax - bx;
      const dy = ay - by;
      const d2 = dx * dx + dy * dy;
      if (d2 > LINK2) continue;
      let alpha = (1 - Math.sqrt(d2) / LINK) * lineBase * Math.min(a.w, b.w);
      let near = 0;
      if (hl > 0.01) {
        const mx = (ax + bx) / 2 - px;
        const my = (ay + by) / 2 - py;
        const m2 = mx * mx + my * my;
        if (m2 < REACH2) near = (1 - Math.sqrt(m2) / REACH) * hl;
      }
      const want = near > 0.05 ? accent : ink;
      if (want !== style) {
        c.strokeStyle = want;
        style = want;
      }
      if (near > 0.05) alpha = Math.min(0.55, alpha * (1 + near * 3.2));
      c.globalAlpha = alpha;
      c.beginPath();
      c.moveTo(ax, ay);
      c.lineTo(bx, by);
      c.stroke();
    }
  }

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const x = p.x + p.ox;
    const y = p.y + p.oy;
    let near = 0;
    if (hl > 0.01) {
      const dx = x - px;
      const dy = y - py;
      const d2 = dx * dx + dy * dy;
      if (d2 < REACH2) near = (1 - Math.sqrt(d2) / REACH) * hl;
    }
    c.fillStyle = near > 0.05 ? accent : ink;
    c.globalAlpha = Math.min(0.9, dotBase * p.w * (1 + near * 2));
    c.beginPath();
    c.arc(x, y, near > 0.05 ? 1.6 : 1.2, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
}

function frame(t: number) {
  raf = 0;
  const dt = Math.min((t - last) / 1000, 0.05); // clamp after tab switches or stalls
  last = t;
  step(dt);
  draw();
  if (animating) raf = requestAnimationFrame(frame);
}

function mount() {
  if (canvas) return;
  const c = document.createElement("canvas");
  const context = c.getContext("2d");
  if (!context) return;
  canvas = c;
  ctx = context;
  c.className = "field";
  c.setAttribute("aria-hidden", "true");
  const backdrop = document.querySelector(".backdrop");
  if (backdrop) backdrop.after(c);
  else document.body.prepend(c);
  root.classList.add("has-field");
  readTheme();
  resize();
}

function unmount() {
  stopLoop();
  canvas?.remove();
  canvas = null;
  ctx = null;
  pts = [];
  w = h = 0;
  root.classList.remove("has-field");
}

function startLoop() {
  if (raf) return;
  animating = true;
  last = performance.now();
  raf = requestAnimationFrame(frame);
}

function stopLoop() {
  animating = false;
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

function sync() {
  if (!wideMQ.matches) {
    unmount();
    return;
  }
  mount();
  // Always animates, except when the visitor's OS asks for reduced motion
  if (!reduceMQ.matches && !document.hidden) {
    startLoop();
  } else {
    stopLoop();
    influence = 0;
    for (const p of pts) {
      p.ox = p.oy = 0;
      p.w = weightAt(p.x, p.y);
    }
    draw(); // one calm static frame
  }
}

export function setPointer(x: number, y: number, inside: boolean) {
  px = x;
  py = y;
  pointerIn = inside && animating;
}

// Hidden detail: a ripple that pushes the network outward from (x, y)
let bx = 0;
let by = 0;
let bt = 0; // seconds of ripple left
export function burst(x: number, y: number) {
  if (!animating) return;
  bx = x;
  by = y;
  bt = 1.1;
}

export function initField() {
  wideMQ.addEventListener("change", sync);
  reduceMQ.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);

  let pending = 0;
  addEventListener(
    "resize",
    () => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        resize();
      });
    },
    { passive: true },
  );

  new MutationObserver(() => {
    if (!canvas) return;
    readTheme();
    if (!animating) draw();
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  sync();
}
