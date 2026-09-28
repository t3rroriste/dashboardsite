/* =========================================================================
   CreateYourQueue — l'écran d'accueil animé
   Le logo joue sa séquence, l'anneau se remplit sur 5 secondes, puis le
   panneau s'ouvre. C'est le seul écran du site dont la sortie est un
   minuteur : le lien « Ouvrir maintenant » est donc obligatoire, et il
   reste cliquable du début à la fin.

   anime.js v4 en UMD, comme le reste du site : les exports nommés sont lus
   sur le global `anime`, et la page doit rester lisible si la
   bibliothèque n'a pas chargé.
   ========================================================================= */
(function () {
  'use strict';

  var ATTENTE = 5000;          // les 5 secondes demandées
  var ATTENTE_CALME = 1500;    // sans animation, rien à regarder : on abrège

  var $ = function (s) { return document.querySelector(s); };

  var logo  = $('[data-logo]');
  var arc   = $('[data-arc]');
  var halo  = $('[data-halo]');
  var titre = $('[data-title]');
  var lead  = $('[data-lead]');
  var skip  = $('[data-skip]');

  /* ------------------------------------------------------ la destination */

  /* Le panneau a besoin d'un serveur : sans lui il ne sait pas quoi
     afficher. login.html passe l'identifiant choisi, et s'il manque on
     renvoie vers le sélecteur plutôt que vers un panneau vide. */
  function destination() {
    var guild = new URLSearchParams(location.search).get('guild');
    return guild ? 'dashboard.html?guild=' + encodeURIComponent(guild) : 'servers.html';
  }

  var cible = destination();
  var parti = false;

  function ouvrir(ev) {
    if (ev) ev.preventDefault();
    if (parti) return;
    parti = true;
    location.replace(cible);
  }

  var lien = $('[data-go]');
  if (lien) {
    lien.setAttribute('href', cible);
    lien.addEventListener('click', ouvrir);
  }

  /* ------------------------------------------------------------- motion */

  var A = window.anime;
  var force = document.documentElement.classList.contains('motion-force');
  var calm  = !force && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Le périmètre de l'anneau : 2πr, r=63 comme dans le SVG. Il sert de
     longueur de tiret, et l'animation ne fait que déplacer le décalage. */
  var PERIMETRE = 2 * Math.PI * 63;

  function anneauFige() {
    if (!arc) return;
    arc.style.strokeDasharray = PERIMETRE + ' ' + PERIMETRE;
    arc.style.strokeDashoffset = '0';
  }

  if (!A || calm) {
    /* Sans bibliothèque ou sans mouvement : tout est déjà à sa place, on
       remplit l'anneau d'un coup et on part. */
    anneauFige();
    setTimeout(ouvrir, calm ? ATTENTE_CALME : ATTENTE);
    return;
  }

  var utils = A.utils;
  var OUT = A.cubicBezier(.16, 1, .3, 1);

  A.createScope({ root: document.body }).add(function () {

    /* États de départ posés en JS, jamais en CSS : si le script tombe, la
       page reste lisible au lieu de rester invisible. */
    utils.set(logo,  { opacity: 0, scale: .62, rotate: -14, filter: 'blur(10px)' });
    utils.set(halo,  { opacity: 0, scale: .7 });
    utils.set([titre, lead, skip], { opacity: 0, y: 12 });
    if (arc) {
      utils.set(arc, { strokeDasharray: PERIMETRE + ' ' + PERIMETRE, strokeDashoffset: PERIMETRE });
    }

    var tl = A.createTimeline({ defaults: { ease: OUT } });

    // t=0 — la coque s'installe, comme sur l'accueil
    tl.add('.shell', { scale: [.97, 1], borderRadius: ['56px', '36px'], duration: 900 }, 0)

      // t=60 — le halo s'ouvre sous le logo
      .add(halo, { opacity: 1, scale: 1, duration: 1400 }, 60)

      /* t=140 — le logo arrive : il se dévoile en tournant d'une dizaine de
         degrés et en perdant son flou. Un seul ressort par écran (règle du
         design system), et c'est celui-ci. */
      .add(logo, {
        opacity: 1,
        scale: [.62, 1.06, 1],
        rotate: [-14, 0],
        filter: ['blur(10px)', 'blur(0px)'],
        duration: 1100
      }, 140)

      // t=520 — le nom, puis la phrase, puis l'échappatoire
      .add(titre, { opacity: 1, y: 0, duration: 620 }, 520)
      .add(lead,  { opacity: 1, y: 0, duration: 620 }, 620)
      .add(skip,  { opacity: 1, y: 0, duration: 520 }, 900);

    /* L'anneau est LINÉAIRE et couvre exactement l'attente : c'est un
       compte à rebours, pas une décoration. Une courbe le rendrait
       menteur — il paraîtrait fini avant de l'être. */
    if (arc) {
      tl.add(arc, {
        strokeDashoffset: [PERIMETRE, 0],
        duration: ATTENTE,
        ease: 'linear'
      }, 0);
    }

    /* Une respiration lente du logo pendant l'attente, lancée après
       l'entrée. Elle occupe l'écran sans attirer l'œil. */
    tl.add(logo, {
      scale: [1, 1.035, 1],
      duration: 2600,
      loop: true,
      ease: 'inOutQuad'
    }, 1240);

    return function () { tl.revert && tl.revert(); };
  });

  /* Le minuteur ne dépend PAS de la timeline : un onglet en arrière-plan
     ralentit les animations, et la personne se retrouverait devant un logo
     qui ne part jamais. */
  setTimeout(ouvrir, ATTENTE);
})();
