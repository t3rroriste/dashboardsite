/* ==========================================================================
   Atelier — motion
   One timeline for the entry, one scroll observer per reveal. Nothing here
   touches layout properties: transform, opacity and SVG draw only.
   ========================================================================== */

import { animate, createTimeline, stagger, onScroll, svg, utils } from 'animejs';

const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Hidden states live behind html.js, so the page is readable if this module
   never runs. Everything below assumes it did. */
root.classList.add('js');

const ALL_HIDDEN =
  '.line__in, .reveal, .hero__figure, .rail, .hero__card, .hero__wordmark, ' +
  '.kpi, .card, .table tbody tr, .chart__axis, .foot';

const EASE = 'outExpo';

/* -------------------------------------------------------------------------
   Build stamp — proves which deploy is live.
   ---------------------------------------------------------------------- */
const stamp = document.getElementById('stamp');
if (stamp) {
  stamp.textContent = `Build ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

/* -------------------------------------------------------------------------
   Counters — at most four run at once, per the motion budget.
   ---------------------------------------------------------------------- */
const nf = new Intl.NumberFormat('fr-FR');
/* Seven-digit figures do not fit on one line at display size, so the money
   KPI is shown compact (1,28 M €) while the raw value stays in the markup. */
const cf = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 2 });

const fmt = (el, n) =>
  (el.dataset.compact !== undefined ? cf : nf).format(n) + (el.dataset.suffix || '');

function countUp(el, duration = 1100, delay = 0) {
  const target = Number(el.dataset.count || 0);
  const state = { v: 0 };
  const render = (n) => { el.textContent = fmt(el, Math.round(n)); };

  render(0);
  return animate(state, {
    v: target,
    duration,
    delay,
    ease: EASE,
    onUpdate: () => render(state.v),
    onComplete: () => render(target),
  });
}

function fillCountersInstantly() {
  utils.$('[data-count]').forEach((el) => {
    el.textContent = fmt(el, Number(el.dataset.count || 0));
  });
}

/* -------------------------------------------------------------------------
   SVG curves draw themselves. If the drawable API is unavailable the lines
   are shown statically rather than left invisible.
   ---------------------------------------------------------------------- */
function drawLines(selector, duration, delayStart) {
  try {
    const lines = svg.createDrawable(selector);
    utils.set(lines, { opacity: 1 });
    animate(lines, {
      draw: ['0 0', '0 1'],
      duration,
      delay: stagger(80, { start: delayStart }),
      ease: EASE,
    });
  } catch (err) {
    console.warn('[motion] draw unavailable, curve shown statically', err);
    utils.set(selector, { opacity: 1 });
  }
}

/* -------------------------------------------------------------------------
   Reduced motion — show everything, animate nothing.
   ---------------------------------------------------------------------- */
function staticRender() {
  utils.set(ALL_HIDDEN, { opacity: 1, translateY: 0, scale: 1 });
  utils.set('.hero__wordmark', { opacity: 0.09 });
  utils.set('.hero__figure', { opacity: 0.11 });
  fillCountersInstantly();
}

/* -------------------------------------------------------------------------
   Entry — a single timeline, ≤1600ms, interactive from ~400ms.
   ---------------------------------------------------------------------- */
function playEntry() {
  utils.set('.line__in', { translateY: '110%', opacity: 1 });
  utils.set('.hero__inner .reveal', { opacity: 0, translateY: 16 });
  utils.set('.hero__figure', { opacity: 0, scale: 1.14 });
  utils.set('.rail', { opacity: 0, translateY: 18 });
  utils.set('.hero__card', { opacity: 0, scale: 0.92 });
  utils.set('.hero__wordmark', { opacity: 0, translateY: '55%' });

  const tl = createTimeline({ defaults: { ease: EASE } });

  tl.add('.shell', { scale: [0.96, 1], duration: 900 }, 0)
    .add('.nav', { translateY: [-24, 0], opacity: [0, 1], duration: 700 }, 120)
    .add('.hero__inner .reveal', { opacity: 1, translateY: 0, duration: 700 }, 180)
    .add('.line__in', { translateY: '0%', duration: 1000, delay: stagger(80) }, 200)
    .add('.hero__figure', { opacity: 0.11, scale: 1, duration: 1400 }, 300)
    .add('.rail', { opacity: 1, translateY: 0, duration: 700 }, 620)
    .add('.hero__wordmark', { opacity: 0.09, translateY: '0%', duration: 1200 }, 550)
    .add('.hero__card', { opacity: 1, scale: 1, duration: 700 }, 700);

  return tl;
}

/* -------------------------------------------------------------------------
   One-shot reveal trigger. A scroll observer that also reverses on leave
   would re-fade content the reader has already seen, so reveals fire once
   and stay put; only the scrubbed effects below stay bound to scroll.
   ---------------------------------------------------------------------- */
function once(target, fn) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  if (!('IntersectionObserver' in window)) { fn(); return; }

  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      fn();
    },
    { rootMargin: '0px 0px -15% 0px' }
  );
  io.observe(el);
}

/* -------------------------------------------------------------------------
   Scroll — reveals, recede, parallax, chart draw.
   ---------------------------------------------------------------------- */
function bindScroll() {
  /* Section headers and bodies. */
  utils.$('.panel').forEach((panel) => {
    const heads = panel.querySelectorAll('.reveal');
    if (!heads.length) return;
    utils.set(heads, { opacity: 0, translateY: 24 });
    once(panel, () => {
      animate(heads, {
        opacity: 1, translateY: 0, duration: 700, delay: stagger(80), ease: EASE,
      });
    });
  });

  /* KPI: reveal, then count, then draw the sparklines. */
  const kpis = utils.$('.kpi');
  if (kpis.length) {
    utils.set(kpis, { opacity: 0, translateY: 24 });
    once('#performance', () => {
      animate(kpis, {
        opacity: 1, translateY: 0, duration: 700,
        delay: stagger(80, { start: 100 }), ease: EASE,
      });
      utils.$('[data-count]').forEach((el, i) => countUp(el, 1100, 150 + i * 80));
      drawLines('.spark__line', 1100, 300);
    });
  }

  /* Collection cards, from the centre out. */
  const cards = utils.$('.card');
  if (cards.length) {
    utils.set(cards, { opacity: 0, translateY: 32 });
    once('#collections', () => {
      animate(cards, {
        opacity: 1, translateY: 0, duration: 800,
        delay: stagger(90, { from: 'center' }), ease: EASE,
      });
    });
  }

  /* Chart curve, area, table rows, axis and footer. */
  const rows = utils.$('.table tbody tr, .chart__axis, .foot');
  utils.set(rows, { opacity: 0, translateY: 12 });
  once('#commandes', () => {
    drawLines('.chart__line', 1400, 0);
    animate('.chart__area', {
      opacity: [0, 1], scaleY: [0, 1], duration: 1200, ease: EASE,
    });
    animate(rows, {
      opacity: 1, translateY: 0, duration: 500,
      delay: stagger(40), ease: 'outQuad',
    });
  });

  /* The hero recedes as the next section slides over it. */
  animate('.hero__recede', {
    scale: [1, 0.94],
    opacity: [1, 0.5],
    ease: 'linear',
    autoplay: onScroll({
      target: '.hero',
      enter: 'top top',
      leave: 'bottom top',
      sync: true,
    }),
  });

  /* Parallax: the object drifts, the wordmark rises faster than the section.
     Subtle by design — noticing it consciously means it is too strong. */
  animate('.hero__figure', {
    rotate: [0, 26],
    ease: 'linear',
    autoplay: onScroll({ target: '.hero', enter: 'top top', leave: 'bottom top', sync: true }),
  });

  animate('.hero__wordmark', {
    translateY: ['0%', '-28%'],
    ease: 'linear',
    autoplay: onScroll({ target: '.hero', enter: 'top top', leave: 'bottom top', sync: true }),
  });
}

/* -------------------------------------------------------------------------
   Nav: mark the section in view.
   ---------------------------------------------------------------------- */
function bindNav() {
  const links = utils.$('.nav__link');
  if (!links.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => {
          a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: '-45% 0px -45% 0px' }
  );

  utils.$('.hero, .panel').forEach((s) => io.observe(s));
}

/* -------------------------------------------------------------------------
   Boot. Any failure falls back to the fully visible page rather than a
   blank one — a motion bug must never cost the content.
   ---------------------------------------------------------------------- */
try {
  if (reduced) {
    staticRender();
  } else {
    playEntry();
    bindScroll();
  }
  bindNav();
} catch (err) {
  console.error('[motion] failed, falling back to static render', err);
  staticRender();
}
