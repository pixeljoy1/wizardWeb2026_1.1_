/* Shared page behaviors: theme init, version pill, custom cursor,
   magnetic hovers, scroll reveals. Imported by every page entry. */
import { initTheme } from './theme.js';

export const canHover = matchMedia('(hover: hover)').matches;

export function initCommon() {
  initTheme();

  document.querySelectorAll('.ver-pill').forEach((el) => { el.textContent = __BUILD_VERSION__; });

  /* reveal on scroll */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        revealer.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal-up, .reveal-line').forEach((el) => revealer.observe(el));

  /* custom cursor */
  const cursor = document.getElementById('cursor');
  const dot = document.getElementById('cursorDot');
  if (cursor && dot && canHover) {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%,-50%)`;
    });
    (function follow() {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(follow);
    })();
    document.querySelectorAll('a, button, [data-service]').forEach((el) => {
      el.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
    });
  }

  /* magnetic elements */
  if (canHover) document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}
