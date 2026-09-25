# PROMPT — Refonte D.A. + Motion du Dashboard
> À coller tel quel dans une session Claude Code dédiée au design.
> Remplace les `{{...}}` avant envoi.

---

## ⚠️ AVANT D'ENVOYER — 3 choses à joindre

1. **La vidéo de référence.** Un lien TikTok seul ne suffit pas : l'agent ne peut pas lire un flux vidéo.
   Joins **6 à 12 captures d'écran** extraites de la vidéo, nommées dans l'ordre :
   `ref-01-hero.png`, `ref-02-scroll-25.png`, … `ref-08-footer.png`
   (astuce : `yt-dlp <url> -o ref.mp4` puis `ffmpeg -i ref.mp4 -vf fps=1 ref-%02d.png`).
   Ajoute aussi, si possible, un **screen-record de 5 s en slow-motion de l'entrée de page** — c'est là que se joue la moitié de la D.A.
2. **L'état actuel.** 3 captures du dashboard existant (desktop 1440, laptop 1280, mobile 390) + le chemin des fichiers concernés.
3. **Les contraintes.** Stack réelle (`{{React/Next/Vue/HTML+Vite}}`), librairie CSS (`{{Tailwind/CSS modules/vanilla}}`), et si les assets photo sont modifiables ou non.

---

# RÔLE

Tu es **directeur artistique + design engineer senior**, profil studio éditorial (pense Locomotive, Resn, Basement, Hoverstat, Godly, Awwwards SOTD) — pas profil « template SaaS ». Tu maîtrises l'UI/UX system design, la typographie éditoriale, le motion design web, et tu écris du code de production avec **anime.js v4** (`animate`, `createTimeline`, `createScope`, `stagger`, `onScroll`, `svg`, `utils`, `eases`).

Ta mission : **sortir ce dashboard de l'esthétique « IA slop »** et le réaligner sur la direction artistique de la vidéo de référence fournie.

---

# PHASE 0 — ANALYSE DE LA RÉFÉRENCE (obligatoire, avant toute ligne de code)

Étudie les frames fournies et **rends un rapport écrit** structuré exactement comme suit. Ne saute aucune ligne ; si une info est indéterminable depuis les frames, écris `indéterminé` et propose ta meilleure hypothèse.

### 0.1 Identité visuelle
- **Palette** : extrais les 6–8 couleurs dominantes en HEX + leur rôle (fond / fond secondaire / encre / encre douce / accent / accent chaud / bordure). Précise la température générale (froide bleutée = signal IA/tech à éviter, chaude ivoire/sable/os = signal éditorial).
- **Ratio d'encre** : quel pourcentage de la surface est vide ? (une D.A. « classe » tourne à 55–70 % de vide).
- **Texture** : grain / noise / papier / dégradé maillé / aucun ? Intensité perçue.
- **Typographie** : catégorie des titres (serif éditorial ? grotesque néo-brutaliste ? humaniste ?), catégorie du corps, contraste de graisse, taille du plus grand titre en % de la hauteur de viewport, tracking (serré négatif ? large ?), casse (capitales ? bas de casse ?).

### 0.2 Formes & photos — le point clé
Pour chaque image/média visible, décris :
- **Le masque** : rectangle ? **arche** (radius 50% en haut seulement) ? cercle ? ellipse ? radius asymétrique ? forme organique en `clip-path` ? bord perdu (full-bleed) ?
- **Le rayon exact estimé** en px ou % (ex : `border-radius: 200px 200px 12px 12px`).
- **Le ratio** : 4:5, 3:4, 1:1, 16:9, panoramique 21:9 ?
- **Le traitement** : N&B ? désaturation partielle ? grain ? duotone ? ombre portée douce ou absence totale d'ombre ?
- **Le rapport au texte** : la photo chevauche-t-elle le texte ? sort-elle de la grille ? est-elle recadrée par le bord de l'écran ?
- **La rotation** : les médias sont-ils légèrement inclinés (−3° à +3°) ?

### 0.3 Animation d'entrée (page load)
Décris la chorégraphie **plan par plan, avec timings estimés en ms** :
- Y a-t-il un écran de transition / rideau / masque qui se lève ?
- Ordre d'apparition des éléments (titre → média → nav → UI ?).
- Nature des transitions : `clip-path` qui s'ouvre ? masque vertical ? translation Y ? scale depuis 1.06 ? blur qui se résorbe ? letter-by-letter ? line-by-line ?
- Durée totale de la séquence avant état stable.
- Courbe perçue : sèche et rapide ? élastique ? très amortie (out-expo) ?

### 0.4 Animation au scroll
- Le scroll est-il **lissé / inertiel** (smooth scroll) ou natif ?
- Y a-t-il du **parallaxe** ? Sur quels éléments, et à quelle amplitude relative (px de décalage pour 100vh de scroll) ?
- Les médias se **révèlent-ils par masque** (clip-path/scaleY) ou par fade+translate ?
- Y a-t-il des sections **épinglées** (pinned/sticky) ? Un `scrub` (animation liée à la position du scroll) ou un simple trigger one-shot ?
- Y a-t-il une **échelle d'image liée au scroll** (image qui se dézoome en montant) ?
- Les textes arrivent-ils en **stagger** ? Quel délai inter-élément estimé ?

### 0.5 Synthèse actionnable
Termine par : **10 règles de D.A.** à respecter, formulées à l'impératif, extraites de ton analyse. Ce sont elles qui gouverneront le reste du travail. Puis attends ma validation **uniquement si** une règle contredit le brief ci-dessous ; sinon enchaîne.

---

# PHASE 1 — DIAGNOSTIC « IA SLOP » DE L'EXISTANT

Audite le dashboard actuel et **liste nommément** chaque occurrence de ces symptômes, avec fichier:ligne :

| Symptôme | À bannir |
|---|---|
| **Carré-mania** | Tout est une `card` rectangulaire à `border-radius: 8–12px` avec `border: 1px solid #e5e7eb` et `shadow-sm`. Empilement de boîtes de même poids visuel. |
| **Palette générique** | Bleu-indigo-violet `#6366f1 / #8b5cf6`, dégradés purple→blue, fond `#0f172a`, gris `slate-*` partout. |
| **Glassmorphism réflexe** | `backdrop-blur` + `bg-white/5` + `border-white/10` sans raison. |
| **Typo par défaut** | Inter/Geist en 14–16px partout, une seule police, hiérarchie plate, aucun titre éditorial. |
| **Espacement uniforme** | Tout à `gap-6`, `p-6` : aucun rythme, aucune respiration, aucune tension entre dense et vide. |
| **Grille prévisible** | Grilles 2×2 / 3×3 parfaitement régulières, tout aligné, zéro asymétrie. |
| **Icônes-confettis** | Une icône Lucide dans un carré arrondi coloré devant chaque titre. |
| **Emoji/gradient text** | Titres en dégradé, emojis décoratifs, badges « ✨ AI-powered ». |
| **Motion absent ou bêta** | Aucune animation, ou un `fade-in` CSS de 300 ms identique partout. |
| **Néon/glow** | Halos lumineux, `box-shadow` colorés, effets « tech dark mode ». |

Pour chaque symptôme trouvé, propose le remplacement concret (pas une généralité).

---

# PHASE 2 — DIRECTION ARTISTIQUE CIBLE

> **Le mot d'ordre : léger, classe, éditorial, aéré, physique.**
> On quitte « interface de monitoring » pour aller vers **« magazine d'architecture / galerie d'art / maison de couture »** — appliqué à des données.
> Pas moins d'information : **mieux hiérarchisée**.

### 2.1 Fondations (à définir en tokens CSS, `:root` + dark mode)
- **Fond** : quitte le blanc pur et le noir pur. Vise un **blanc chaud** (ivoire / os / lin, ex. `#F7F5F1`, `#FAF8F4`) ou, si la référence est sombre, un **encre chaude** (`#14100D`, `#1A1714`) — jamais `#0F172A`.
- **Encre** : texte principal en brun-noir ou gris chaud, pas `#000`. Texte secondaire à ~55 % d'opacité de l'encre, pas une autre couleur.
- **Accent** : **un seul**, mat, saturé mais pas fluo (terracotta, olive, bleu de Prusse, ocre, bordeaux). Aucun dégradé multicolore.
- **Bordures** : quasi supprimées. Séparer par **l'espace**, par un **filet hairline 0.5px à 8 % d'opacité**, ou par un **changement de fond de section** — pas par des contours de cartes.
- **Ombres** : soit aucune, soit une seule ombre très large et très douce (`0 40px 80px -40px rgba(ink, .12)`), jamais de `shadow-md`.
- **Texture** : un **grain SVG/noise à 2–4 % d'opacité** en overlay `pointer-events:none` sur toute la page. C'est le détail qui tue le rendu « généré ».
- **Radius** : abandonne le radius uniforme. Système à 3 valeurs : `0` (filets, tableaux), `999px` (pilules, boutons, tags), et un **grand radius éditorial** `24–48px` réservé aux médias et aux blocs majeurs.

### 2.2 Typographie
- **Deux familles maximum** : un **serif éditorial** (Fraunces, Instrument Serif, Newsreader, PP Editorial, Canela) pour les titres et les **chiffres-héros des KPI**, + un **sans humaniste** discret (Inter Tight, Söhne, Suisse, Neue Montreal) pour l'UI et les tableaux.
- **Échelle à fort contraste** : titre de page `clamp(2.75rem, 6vw, 5.5rem)`, tracking `-0.03em`, `line-height: 0.95`. Corps UI `14–15px`. **Le ratio titre/corps doit dépasser 4×.**
- **Yeux** : chiffres en `font-variant-numeric: tabular-nums` partout dans les données.
- **Labels** : petites capitales, `letter-spacing: 0.12em`, `11px`, opacité 50 % — le seul endroit où l'on utilise les capitales.
- Interdiction : texte en dégradé, `font-weight: 900`, italique décoratif.

### 2.3 Grille & composition
- Grille **12 colonnes, asymétrique par principe** : alterne 7/5, 5/7, 8/4. Jamais deux sections consécutives de même découpage.
- **Un seul point focal par écran.** Le reste se subordonne.
- **Respiration verticale généreuse** : `120–200px` entre sections en desktop. La page doit être plus haute qu'aujourd'hui, et c'est voulu.
- **Bord perdu assumé** : au moins un média ou un graphe qui touche/dépasse le bord du viewport.
- **Décalages volontaires** : un élément qui dépasse légèrement de sa colonne, un chevauchement média/texte de 40–80px.

### 2.4 Formes des médias — règle centrale
> C'est le levier n°1 contre l'effet « trop de carré ».

Applique le système de masques dérivé de la référence (Phase 0.2). À défaut de contre-indication :
- **Arche** pour les portraits / visuels héros : `border-radius: 50% 50% 8px 8px / 28% 28% 4px 4px`, ratio **4:5**.
- **Cercle parfait** pour les avatars et les micro-visuels, **sans bordure**.
- **Radius asymétrique** pour les blocs médias secondaires : `border-radius: 32px 4px 32px 4px`.
- **Ellipse / clip-path organique** pour au moins un visuel décoratif :
  `clip-path: ellipse(48% 52% at 50% 48%)`.
- **Ratios variés dans une même page** : ne répète jamais le même ratio deux fois côte à côte (4:5 + 1:1 + 21:9).
- **Traitement photo unifié** : légère désaturation (`saturate(.92)`), contraste doux (`contrast(1.04)`), grain hérité de la page. Toutes les images d'une même vue partagent exactement le même traitement.
- **Inclinaison** : `rotate(-1.5deg)` sur un ou deux médias, jamais plus.
- Les médias **ne portent ni bordure ni ombre dure**.

### 2.5 Traduction des composants dashboard
Chaque composant doit être repensé, pas restylé :
- **KPI** : supprime la carte. Un chiffre-héros en serif `56–88px`, un label en petites capitales au-dessus, un delta en pilule discrète, une sparkline en trait `1px` sans axes ni grille, séparés du voisin par un **filet vertical hairline** et 64px de vide.
- **Graphes** : supprime les gridlines, les bordures d'axes, les légendes en boîte. Trait fin, **une seule couleur + son alpha**, labels directement posés au bout des courbes. Aires en dégradé vertical vers transparent, jamais en couleur pleine.
- **Tableaux** : zéro bordure verticale, lignes séparées par un filet 8 % d'opacité, `row-height 56px`, en-têtes en petites capitales, hover = changement de fond à 3 % **sans** translation.
- **Navigation** : sidebar à fond identique au contenu (pas de panneau contrasté), séparée par un filet ; item actif marqué par un **point** ou un filet à gauche, pas par un rectangle coloré.
- **Boutons** : primaire = pilule pleine en accent mat, texte 13px, `padding 12px 24px`. Secondaire = texte souligné à l'`text-underline-offset: 6px`. Pas de troisième variante.
- **États vides & chargement** : skeletons en blocs de la **forme finale** (arche si arche), animés par un balayage d'opacité, pas par un shimmer gris.

---

# PHASE 3 — MOTION (anime.js v4, au maximum)

Installe et utilise **anime.js v4** (`npm i animejs`). Importe précisément ce dont tu as besoin :
```js
import { animate, createTimeline, createScope, stagger, onScroll, svg, utils, eases } from 'animejs';
```

### 3.0 Règles générales de motion
- **Vocabulaire d'eases limité et cohérent** : entrées `eases.outExpo` ou `cubicBezier(.16,1,.3,1)` ; sorties `eases.inQuad` ; micro-interactions `eases.outQuad` 180 ms ; un seul effet ressort (`eases.outBack(1.4)`) réservé aux pilules/toggles.
- **Durées** : micro 120–200 ms · éléments 500–700 ms · séquences héros 900–1400 ms. Rien au-delà de 1600 ms.
- **N'anime que `transform`, `opacity`, `clip-path`, `filter`.** Jamais `width`/`height`/`top`/`left`.
- **Stagger partout** où il y a plus de deux éléments frères : `stagger(60, { start: 120, from: 'first' })` — et `from: 'center'` pour les grilles de médias.
- **Compose, ne superpose pas** : une `createTimeline()` par séquence, avec des positions relatives (`'-=400'`, `'<<'`), pas dix `animate()` isolés avec des `delay` calculés à la main.
- Encapsule chaque vue dans un `createScope({ root })` pour que les animations se nettoient au démontage.
- `utils.$()` pour les sélections, `utils.set()` pour poser les états initiaux **en JS** (jamais d'opacité 0 en CSS : sinon la page reste vide si le JS échoue — ajoute une classe `js-ready` sur `<html>` avant de masquer).

### 3.1 Animation d'entrée de page — chorégraphie imposée
Reproduis l'esprit de la référence (Phase 0.3). Structure attendue :

```
t=0      Rideau/overlay plein écran (couleur fond) → clip-path inset(0 0 0 0) → inset(0 0 100% 0), 900ms outExpo
t=150    Titre héros : révélation ligne par ligne par masque
         chaque ligne dans un <span> overflow:hidden, translateY 110% → 0
         stagger(90), 1000ms, cubicBezier(.16,1,.3,1)
t=350    Média héros : clip-path inset(0 0 100% 0) → inset(0 0 0 0)
         + scale 1.08 → 1 en simultané, 1200ms outExpo  ← l'effet "photo qui se dévoile"
t=500    Filets/séparateurs : scaleX 0 → 1, transform-origin left, stagger(70), 700ms
t=600    Chiffres KPI : compteur animé via utils.set + modifier utils.round(0),
         de 0 → valeur, 1100ms outExpo, stagger(80)
         (jamais de compteur sur plus de 4 chiffres visibles simultanément)
t=750    UI secondaire (nav, tableaux, contrôles) : opacity 0→1 + translateY 12→0,
         stagger(40), 500ms outQuad
t≈1600   État stable. Le curseur doit être utilisable dès t=400.
```
Contraintes : **aucun élément ne doit bouger plus de 40px** en entrée (au-delà, ça fait démo). Aucun rebond sur le texte. L'entrée ne doit pas se rejouer sur navigation interne.

### 3.2 Scroll
- **Révélation** : chaque section via `onScroll({ enter: 'bottom-=15%', leave: 'top', sync: false })` en one-shot. Médias révélés par **masque `clip-path`**, textes par translateY 24px + opacity, en stagger.
- **Parallaxe lié au scroll** : `onScroll({ sync: 0.2 })` (interpolation lissée) sur les médias héros — translateY de `-8%` à `+8%` sur la traversée du viewport. Amplitude subtile ; si on la remarque consciemment, elle est trop forte.
- **Zoom inverse** : le média héros passe de `scale(1.12)` à `scale(1)` sur son entrée en viewport, en `sync`.
- **Graphes** : tracé des courbes SVG animé avec `svg.createDrawable()` + `onScroll` (`draw: '0 0' → '0 1'`, 1200ms outExpo). Les barres/aires montent depuis `scaleY(0)` avec `transform-origin: bottom`, stagger 50ms.
- **Section épinglée** : maximum **une** par page, avec un scrub `sync: true` qui fait progresser une séquence (ex. les KPI qui se relaient). Au-delà, ça devient une démo, pas un dashboard.
- **Header** : se compacte au scroll (hauteur → `transform: scaleY` sur un fond, opacité du titre) via un `onScroll` unique, pas un listener maison.
- **Scroll lissé** : si et seulement si la référence en a un, ajoute un lissage léger (facteur ≥ 0.1, jamais d'inertie longue) et **désactive-le** sur tactile.

### 3.3 Micro-interactions
- Hover média : `scale(1.02)` + `filter: saturate(1)` 220ms outQuad. Pas de translation.
- Hover ligne de tableau : fond 3 %, 140ms. Rien d'autre.
- Boutons : `scale(.97)` au `pointerdown`, retour en `outBack(1.4)` 260ms.
- Chiffres qui changent en live : le nouveau chiffre monte, l'ancien sort par le haut (masque `overflow:hidden`, 380ms) — pas de fade.
- Curseur : optionnel, un petit disque qui suit avec `utils.lerp` et grossit sur les zones cliquables. À n'ajouter que si la référence en a un.
- Transitions de page/onglet : sortie 260ms `inQuad` → entrée 620ms `outExpo`, jamais de crossfade simultané.

### 3.4 Accessibilité & performance (bloquant)
- `@media (prefers-reduced-motion: reduce)` : toutes les animations réduites à une opacité 200ms, parallaxe et scrub **désactivés**, contenu immédiatement visible. Implémente-le via un flag JS lu une seule fois, pas par duplication de code.
- Contraste **AA minimum** sur tout texte, y compris les labels à 50 % d'opacité (vérifie-les, c'est le piège classique de cette D.A.).
- Focus visible : anneau de 2px en accent, `outline-offset: 3px` — ne le supprime jamais.
- Cible tactile ≥ 44px, y compris les pilules.
- **60 fps obligatoire** : pas de `will-change` permanent, pas d'animation de layout, pas plus de ~15 éléments animés simultanément. `CLS < 0.05` : réserve la place des médias par `aspect-ratio`.
- Le contenu doit être **lisible et utilisable JS désactivé**.

---

# PHASE 4 — LIVRABLES

1. **`DESIGN-ANALYSIS.md`** — le rapport de la Phase 0 + le diagnostic de la Phase 1.
2. **`DESIGN-SYSTEM.md`** — tokens (couleurs, typo, espacements, radius, eases, durées) + les 10 règles de D.A., avec le rationnel de chaque écart par rapport à l'existant.
3. **Le code** : tokens CSS, composants refondus, module `motion/` isolant toutes les séquences anime.js (une fonction exportée par séquence, testable, avec cleanup).
4. **Avant/après** : captures aux 3 breakpoints (390 / 1280 / 1440), plus un GIF ou un MP4 de l'entrée de page et d'un scroll complet — lance l'app et capture réellement, ne décris pas.
5. **Commit** sur `{{branche}}`, messages explicites et atomiques (D.A. / motion / composants séparés).

### Critères d'acceptation
- [ ] Zéro `card` rectangulaire avec bordure + ombre + radius 8px dans la vue principale.
- [ ] Au moins **3 formes de masque différentes** pour les médias, dont une arche ou un cercle.
- [ ] Deux familles typographiques, ratio titre/corps > 4×.
- [ ] Un seul accent chromatique, aucun dégradé multicolore.
- [ ] Grain de page présent, ombres dures absentes.
- [ ] Séquence d'entrée orchestrée en une timeline, ≤ 1600 ms, page utilisable à 400 ms.
- [ ] Révélations au scroll par masque + stagger sur toutes les sections.
- [ ] `prefers-reduced-motion` respecté et vérifié.
- [ ] 60 fps mesurés au scroll, CLS < 0.05.
- [ ] Mis côte à côte avec les frames de référence, **on doit deviner la même D.A.**

---

# INTERDITS ABSOLUS

Bleu-violet générique · dégradés purple→blue · glassmorphism décoratif · néon/glow · emoji décoratifs · titres en dégradé · badges « AI » · icône dans un carré coloré devant chaque titre · radius uniforme partout · grille parfaitement symétrique · `shadow-md` · bordures 1px sur toutes les cartes · une seule police · animations de 300ms identiques partout · parallaxe voyant · plus d'une section épinglée · compteurs animés sur tous les chiffres · librairie de composants importée telle quelle sans retravail.

---

# ORDRE D'EXÉCUTION

Phase 0 (rapport) → Phase 1 (diagnostic) → **présente les 10 règles de D.A. et attends 1 validation** → Phase 2 (tokens + une seule vue en pilote) → montre-moi le pilote → Phase 3 (motion) → Phase 4 (propagation + livrables).
Ne propage la D.A. sur toutes les vues **qu'après** validation du pilote.
