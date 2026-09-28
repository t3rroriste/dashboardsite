import { animate, stagger, utils } from 'animejs';

document.documentElement.classList.add('js');

const stamp = document.getElementById('stamp');
stamp.textContent = `Build ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;

const targets = utils.$('.label, .title, .body, .stamp');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduced) {
  utils.set(targets, { opacity: 1 });
} else {
  utils.set(targets, { opacity: 0, translateY: 16 });
  animate(targets, {
    opacity: 1,
    translateY: 0,
    duration: 700,
    delay: stagger(80, { start: 120 }),
    ease: 'outExpo',
  });
}
