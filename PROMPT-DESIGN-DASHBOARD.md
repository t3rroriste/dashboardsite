# PROMPT — Refonte D.A. + Motion du Dashboard
> À coller dans une session Claude Code dédiée au design.
> Remplace les `{{...}}` avant envoi. Joins les 4 frames de référence (`ref-01…04.png`) + 3 captures du dashboard actuel (390 / 1280 / 1440).

---

# RÔLE

Tu es **directeur artistique + design engineer senior**, profil studio (Locomotive, Basement, Resn, Obys, Awwwards SOTD) — pas profil « template SaaS ». Tu maîtrises l'UI/UX system design, la typographie grotesque, le motion web, et tu écris du code de production avec **anime.js v4** (`animate`, `createTimeline`, `createScope`, `stagger`, `onScroll`, `svg`, `utils`, `eases`).

Mission : **sortir ce dashboard de l'esthétique « IA slop »** (trop de carrés, trop tech, trop froid) et le réaligner sur la D.A. de référence décrite ci-dessous — **plus sombre, plus légère, plus luxe, plus photographique**.

---

# 1. LA RÉFÉRENCE — D.A. CIBLE (analysée, non négociable)

La référence est un site de mobilier de luxe. Voici ce qui la définit. **Tout le travail découle de ces 12 points.**

### 1.1 Le canvas est une carte, pas une page
L'écran entier est un **panneau inset** : le contenu vit dans un grand rectangle à très grand rayon (`~32–40px`), détaché des bords du viewport par une gouttière sombre de `~14–20px`. Le fond derrière est un noir plus profond que le panneau.
→ **C'est le geste n°1 contre « trop de carré »** : le conteneur racine lui-même est arrondi. Rien ne touche un angle droit d'écran.

### 1.2 Noir chaud, jamais bleuté
- Fond de page : `#0A0908` — un noir **chaud**, tirant vers le brun, pas `#0F172A` ni `#000`.
- Panneau : `#121110`. Surface élevée : `#1B1918`.
- Encre : blanc cassé chaud `#F4F1EC`, secondaire à 55–60 % d'opacité.

### 1.3 Zéro accent chromatique d'interface
Il n'y a **aucune couleur UI**. Toute la couleur vient de la **photographie** : bois clair, caramel, ambre, poussière. L'interface est strictement monochrome et laisse l'image porter la chaleur.
→ Un seul accent toléré, échantillonné dans les photos (`#C08A5A` caramel), et uniquement sur : point de pagination actif, flèche de CTA, indicateur de delta positif. Jamais un fond, jamais un dégradé.

### 1.4 Une seule famille typographique, grotesque, très serrée
Pas de serif, pas de duo typo. **Un grotesque neutre et large** (Neue Montreal, Aeonik, Suisse Int'l, General Sans, Geist à la rigueur) décliné en 3 graisses (400 / 500 / 700).
- Titre héros : `clamp(2.5rem, 4.4vw, 4.25rem)`, `line-height: 1.02`, `letter-spacing: -0.03em`, **bas de casse**, aligné à gauche, **ragged right assumé** (retours à la ligne manuels, pas de justification).
- Le titre occupe **5 à 6 lignes courtes**, pas 2 longues. La colonne de texte fait `~40–45%` de la largeur du panneau.
- UI : `13–14px`, `500`. Labels : `11px`, `letter-spacing: 0.06em`, opacité 55 %.

### 1.5 Le wordmark géant, coupé
Un **logotype démesuré** (`~14–18vw`) posé en bas du panneau héros, **coupé par le bord inférieur** (on n'en voit que les 2/3 supérieurs), en blanc à faible opacité, **partiellement masqué par la photo** qui passe devant lui. C'est la signature de cette D.A. : profondeur par superposition, pas par ombre.

### 1.6 La photo est l'objet, détouré, en lévitation
Le visuel héros est une **forme organique détourée** (sculpture en bois, matière, poussière) qui flotte au-dessus du fond — pas une photo rectangulaire dans une boîte. Elle **dépasse de sa zone**, chevauche le titre et le wordmark, et n'a **ni cadre, ni bordure, ni ombre portée** : elle s'intègre par le noir de son propre fond.
→ Dans un dashboard : détoure les visuels, ou masque-les par un dégradé vers le fond (`mask-image: linear-gradient`) pour supprimer toute arête.

### 1.7 Navigation en pilule flottante
Barre de nav **centrée, flottante**, en pilule (`border-radius: 999px`), fond `rgba(255,255,255,.05)` + `backdrop-filter: blur(20px)`, filet `1px` à 8 % d'opacité, items `13px` espacés de `28px`, et un **CTA pilule clair** à droite avec flèche `↗`. Elle ne touche pas le haut : elle flotte à `~20px` du bord supérieur du panneau.

### 1.8 Cartes média en portrait, grand rayon
Les blocs de contenu secondaires sont des **cartes verticales 3:4** (`aspect-ratio: 3/4`), `border-radius: 20–24px`, photo en fond avec **scrim dégradé** du bas, label en haut à gauche (nom + année en petit), texte court, et un **CTA pilule** en bas. Largeur `~240–280px`, présentées en rangée décalée où **les cartes n'ont pas toutes la même hauteur ni le même alignement vertical**.

### 1.9 Boutons ronds
Les contrôles de carrousel sont des **disques parfaits** (`40–44px`), fond `rgba(255,255,255,.07)`, icône `14px`. Aucun bouton carré dans toute l'interface.

### 1.10 La carte flottante d'accroche
Un petit panneau `~200×120px` posé en surimpression à droite du héros : une vignette carrée arrondie, une phrase de deux lignes, et deux flèches rondes. Il **chevauche** le visuel — il n'est pas dans la grille.

### 1.11 Scroll : les sections s'empilent
La section suivante **glisse par-dessus** le héros avec ses propres coins arrondis en haut (`32px`), pendant que le héros **recule** (`scale(.94)`, opacité `.5`, léger `blur`). Effet de cartes empilées, pas de défilement plat. C'est très visible sur la frame 4 : le héros est encore là, en retrait, et la section « Empowering Luxury Homes » passe devant.

### 1.12 Densité faible, respiration haute
Un seul point focal par écran. Le texte est court. Beaucoup de noir vide. La page est **plus haute et plus lente** qu'un dashboard classique — c'est ce qui produit la sensation « classe » plutôt que « outil ».

---

# 2. DIAGNOSTIC DE L'EXISTANT — À FAIRE EN PREMIER

Audite le dashboard actuel et liste nommément, avec `fichier:ligne`, chaque occurrence de ces symptômes. Pour chacun, propose le remplacement **concret** issu de la section 1.

| Symptôme « IA slop » | Remplacement |
|---|---|
| Cartes rectangulaires `radius 8–12px` + `border 1px` + `shadow-sm`, empilées à poids égal | Panneau racine arrondi, séparation par l'espace et le filet hairline, hiérarchie par la taille |
| Palette bleu-indigo-violet (`#6366f1`, `#8b5cf6`), fond `#0f172a`, gris `slate-*` | Noir chaud `#0A0908` / `#121110`, encre `#F4F1EC`, zéro accent UI |
| Dégradés purple→blue, titres en dégradé, glow, néon | Monochrome strict ; la couleur vient des images |
| Glassmorphism partout | `backdrop-blur` réservé à **la seule** nav flottante |
| Typo unique 14–16px, hiérarchie plate | Grotesque 3 graisses, titre héros ~4rem, ratio titre/corps > 4× |
| `gap-6` / `p-6` uniformes | Échelle de respiration 8 / 16 / 32 / 64 / 120 / 200 |
| Grilles 2×2, 3×3 parfaitement régulières | Rangées décalées, cartes de hauteurs inégales, chevauchements |
| Icône Lucide dans un carré arrondi coloré devant chaque titre | Supprimé. Icônes uniquement dans les disques de contrôle |
| Emojis, badges « ✨ AI-powered » | Supprimé |
| Images rectangulaires encadrées | Visuels détourés ou masqués par dégradé, cartes portrait 3:4 `radius 24px` |
| Fade-in CSS 300ms identique partout, ou rien | Timeline anime.js orchestrée (section 3) |

---

# 3. SYSTÈME DE DESIGN À PRODUIRE

Écris de vrais tokens (`:root`), pas des valeurs en dur dans les composants.

```css
:root{
  --bg:#0A0908; --panel:#121110; --raised:#1B1918; --raised-2:#242120;
  --ink:#F4F1EC; --ink-60:rgba(244,241,236,.6); --ink-40:rgba(244,241,236,.4);
  --hair:rgba(244,241,236,.08);
  --accent:#C08A5A;                 /* échantillonné dans la photo — usage rare */
  --r-shell:36px; --r-card:24px; --r-media:20px; --r-pill:999px;
  --gutter:16px;                     /* détachement du panneau au viewport */
  --sp-1:8px; --sp-2:16px; --sp-3:32px; --sp-4:64px; --sp-5:120px; --sp-6:200px;
  --e-out:cubic-bezier(.16,1,.3,1);  /* entrées */
  --e-soft:cubic-bezier(.4,0,.2,1);  /* micro */
}
```

**Règles de forme** (le cœur de la demande « moins de carré ») :
- Rayon **jamais uniforme** : coque `36px` · carte `24px` · média `20px` · pilule `999px` · disque `50%`.
- **Aucun angle droit visible** sur l'écran, hors filets et lignes de tableau.
- **Aucune bordure sur les cartes.** Séparation par contraste de fond (`--panel` vs `--raised`) ou filet hairline.
- **Aucune ombre dure.** Au maximum une ombre très large et diffuse : `0 60px 120px -60px rgba(0,0,0,.9)`.
- **Ratios variés** dans une même vue : 3:4 pour les cartes média, 1:1 pour les vignettes, panoramique pour les graphes. Jamais deux ratios identiques côte à côte.
- Grain global : overlay noise SVG à **3 %**, `pointer-events:none`, sur tout le panneau. C'est ce qui tue le rendu « généré ».

---

# 4. TRADUCTION DASHBOARD DES COMPOSANTS

Ne restyle pas : repense chaque composant dans le vocabulaire de la section 1.

- **Coque** : `body` en `--bg`, contenu dans un `<main>` `--panel` avec `border-radius: var(--r-shell)`, `margin: var(--gutter)`, `overflow: hidden`. La sidebar vit **dans** ce panneau.
- **Nav** : pilule flottante centrée (§1.7). L'item actif est signalé par un **fond pilule à 8 %**, jamais par une couleur.
- **Héros de vue** : titre bas de casse sur 4–6 lignes courtes à gauche · visuel détouré ou masqué par dégradé à droite, qui **déborde** · **wordmark / nom de la vue en géant, coupé par le bas**, opacité `.06–.10`, passant derrière le visuel.
- **KPI** : plus de cartes. Chiffre en `clamp(2.5rem,4vw,4rem)`, `tabular-nums`, `font-weight:500` · label `11px` en capitales douces au-dessus · delta en **pilule** discrète · sparkline en trait `1.25px` sans axes ni grille · voisins séparés par un **filet vertical hairline** + `64px` de vide.
- **Graphes** : aucune gridline, aucun cadre, aucune légende en boîte. Trait fin monochrome, aire en dégradé vers transparent, labels posés au bout des courbes. Si une série doit se distinguer, joue sur l'opacité, pas sur la teinte.
- **Cartes contenu** : format portrait 3:4 de la §1.8, en rangée décalée.
- **Tableaux** : zéro bordure verticale, filet horizontal à 8 %, `row-height 56px`, en-têtes `11px` opacité 55 %, hover = fond `rgba(255,255,255,.03)` sans déplacement.
- **Boutons** : primaire = pilule claire (`--ink` sur texte sombre) avec flèche `↗` · secondaire = pilule fantôme à 7 % · tertiaire = texte souligné `text-underline-offset:6px` · contrôles = disques. **Quatre formes, zéro rectangle.**
- **Skeletons** : blocs à la **forme finale** (portrait arrondi si carte portrait), balayage d'opacité, jamais un shimmer gris.

---

# 5. MOTION — anime.js v4, au maximum

```bash
npm i animejs
```
```js
import { animate, createTimeline, createScope, stagger, onScroll, svg, utils, eases } from 'animejs';
```

### 5.0 Règles
- Vocabulaire d'eases **restreint** : entrées `eases.outExpo` / `cubicBezier(.16,1,.3,1)` · sorties `eases.inQuad` · micro `eases.outQuad` 180 ms · un seul ressort `eases.outBack(1.4)`, réservé aux pilules et toggles.
- Durées : micro `120–200 ms` · éléments `500–700 ms` · séquence héros `900–1600 ms`. Rien au-delà.
- N'anime que `transform`, `opacity`, `clip-path`, `filter`. **Jamais** `width` / `height` / `top` / `left`.
- `stagger()` dès qu'il y a plus de deux frères : `stagger(60,{start:120})`, `from:'center'` pour les rangées de cartes.
- **Une `createTimeline()` par séquence**, positions relatives (`'-=400'`, `'<<'`). Pas dix `animate()` isolés à `delay` calculés à la main.
- `createScope({ root })` par vue pour le cleanup au démontage.
- États initiaux posés en **JS** (`utils.set()`), jamais en CSS : ajoute `document.documentElement.classList.add('js')` avant de masquer, pour que la page reste lisible si le JS échoue.

### 5.1 Entrée de page — chorégraphie imposée
Reproduit l'ouverture de la référence : la coque s'ouvre, le texte monte ligne par ligne, le visuel se pose, le wordmark émerge du bas.

```
t=0     Coque : scale .96 → 1 + border-radius 64px → 36px, 900ms outExpo
        (la carte "s'installe" dans l'écran)
t=120   Nav pilule : translateY -24 → 0, opacity 0 → 1, 700ms outExpo
t=200   Titre héros : révélation LIGNE PAR LIGNE
        chaque ligne dans un <span> parent overflow:hidden,
        enfant translateY 110% → 0, stagger(80), 1000ms cubicBezier(.16,1,.3,1)
t=350   Visuel détouré : scale 1.12 → 1 + translateY 40 → 0 + blur 12px → 0,
        1300ms outExpo   ← l'objet "se pose" et se met au point
t=550   Wordmark géant : translateY 55% → 0 + opacity 0 → .08,
        1200ms outExpo   ← il émerge du bord inférieur
t=700   Carte flottante d'accroche : scale .92 → 1 + opacity, 700ms outBack(1.2)
t=800   KPI : compteurs 0 → valeur via utils.set + modifier utils.round(0),
        1100ms outExpo, stagger(80)   ← max 4 compteurs simultanés
t=900   UI secondaire (tableaux, contrôles) : translateY 12 → 0 + opacity,
        stagger(40), 500ms outQuad
t≈1600  État stable. Interface CLIQUABLE dès t=400.
```
Contraintes : aucun élément ne se déplace de plus de `40px` (le wordmark excepté, en %). Aucun rebond sur du texte. L'entrée **ne se rejoue pas** en navigation interne — une transition de vue courte la remplace (§5.3).

### 5.2 Scroll
- **Empilement de sections** (§1.11) — l'effet signature. Chaque section est `position: sticky; top: 0` avec `border-radius: 32px 32px 0 0` et un fond opaque. Via `onScroll({ sync: true })`, la section **sortante** part en `scale(1 → .94)`, `opacity(1 → .5)`, `filter: blur(0 → 4px)` pendant que la suivante monte. Elles se recouvrent, elles ne défilent pas l'une après l'autre.
- **Révélations** : `onScroll({ enter:'bottom-=15%', leave:'top', sync:false })` en one-shot. Médias révélés par **masque `clip-path: inset(0 0 100% 0) → inset(0 0 0 0)`**, textes par `translateY 24 → 0` + opacité, en stagger.
- **Parallaxe** : `onScroll({ sync: .2 })` sur les visuels héros, `translateY -6% → +6%` sur la traversée du viewport. Si on la remarque consciemment, elle est trop forte.
- **Dézoom lié au scroll** : les visuels passent de `scale(1.1)` à `scale(1)` à leur entrée, en `sync`.
- **Wordmark** : parallaxe inverse, il monte **plus vite** que la section (`sync: .35`) — il se dévoile en défilant.
- **Graphes** : tracé SVG via `svg.createDrawable()` + `onScroll`, `draw: '0 0' → '0 1'`, 1200 ms outExpo. Barres/aires depuis `scaleY(0)`, `transform-origin: bottom`, stagger 50 ms.
- **Rangées de cartes** : défilement horizontal au drag + boutons disques, avec `utils.lerp` pour l'inertie. Les cartes hors-centre restent à `scale(.97)` et `opacity(.75)`.
- **Scroll lissé** : léger uniquement (facteur ≥ .1, pas d'inertie longue), **désactivé sur tactile**.

### 5.3 Micro-interactions
- Hover carte média : `scale(1.015)` + le scrim s'éclaircit + le CTA pilule passe de fantôme à plein, `240ms outQuad`. Pas de translation.
- Hover ligne de tableau : fond 3 %, `140ms`. Rien d'autre.
- Boutons : `scale(.97)` au `pointerdown`, retour `outBack(1.4)` `260ms`. La flèche `↗` fait un `translate(2px,-2px)` au hover.
- Chiffre qui change en live : le nouveau monte, l'ancien sort par le haut (`overflow:hidden`, `380ms`). Jamais de fade.
- Changement de vue : sortie `260ms inQuad` (`scale .98` + opacité) → entrée `620ms outExpo`. Jamais de crossfade simultané.
- Curseur personnalisé : **seulement si** tu peux le faire proprement (disque suivi par `utils.lerp`, grossissant sur les zones cliquables). Sinon, abstiens-toi.

### 5.4 Accessibilité & performance — bloquant
- `prefers-reduced-motion: reduce` : tout se réduit à une opacité `200ms` ; parallaxe, empilement et scrub **désactivés** ; contenu immédiatement visible. Implémenté par un flag JS lu une fois, pas par duplication de code.
- Contraste **AA** sur tout texte — **vérifie particulièrement l'encre à 55 % sur `--panel`**, c'est le piège exact de cette D.A. sombre. Si ça échoue, remonte à 65 %.
- Le texte blanc posé sur photo doit rester AA : renforce le scrim, ne baisse pas la taille.
- Focus visible : anneau `2px` en `--ink`, `outline-offset: 3px`. Ne le supprime jamais.
- Cibles tactiles ≥ `44px`, disques inclus.
- **60 fps** : pas de `will-change` permanent, pas d'animation de layout, ≤ ~15 éléments animés simultanément. `blur` animé uniquement sur des couches isolées (`transform: translateZ(0)`), et supprime-le si le profil tombe sous 55 fps.
- `CLS < 0.05` : `aspect-ratio` sur tous les médias.
- Contenu lisible et navigable **JS désactivé**.

---

# 6. LIVRABLES

1. **`DESIGN-AUDIT.md`** — le diagnostic de la section 2, exhaustif, avec `fichier:ligne`.
2. **`DESIGN-SYSTEM.md`** — tokens finaux, échelle typo, système de formes, table des eases/durées, et le rationnel de chaque écart par rapport à l'existant.
3. **Code** — tokens CSS, composants refondus, et un module `motion/` isolant chaque séquence dans une fonction exportée avec son cleanup (testable, pas de code d'animation dans les composants).
4. **Avant/après** — captures 390 / 1280 / 1440 + un MP4 ou GIF de l'entrée de page **et** d'un scroll complet. Lance réellement l'app et capture ; ne décris pas.
5. **Commits** sur `{{branche}}`, atomiques et séparés : `tokens` → `composants` → `motion`.

### Critères d'acceptation
- [ ] Le contenu vit dans un **panneau racine arrondi** détaché des bords.
- [ ] **Aucun angle droit visible** hors filets et lignes de tableau.
- [ ] Zéro carte à `border + shadow + radius 8px` dans la vue principale.
- [ ] **Quatre familles de formes** présentes : coque, carte portrait, pilule, disque.
- [ ] Palette **monochrome noir chaud** ; toute la couleur vient des images ; `#6366f1` et consorts absents du code.
- [ ] Une seule famille typo, ratio titre/corps > 4×, titre héros en bas de casse ragged right.
- [ ] Wordmark géant coupé par le bas, derrière le visuel, opacité ≤ .10.
- [ ] Grain 3 % présent ; aucune ombre dure ; aucun glow.
- [ ] Entrée orchestrée en **une** timeline, ≤ 1600 ms, interface cliquable à 400 ms.
- [ ] Empilement de sections au scroll fonctionnel, avec recul (`scale` + `opacity` + `blur`) de la section sortante.
- [ ] `prefers-reduced-motion` respecté **et vérifié**.
- [ ] 60 fps mesurés au scroll ; `CLS < 0.05` ; contraste AA validé sur l'encre à 55 %.
- [ ] Mis côte à côte avec les frames de référence : **même famille visuelle évidente au premier regard.**

---

# 7. INTERDITS ABSOLUS

Bleu-violet générique · dégradés purple→blue · fond `slate-900` · glow / néon · glassmorphism ailleurs que sur la nav · emojis décoratifs · titres en dégradé · badges « AI » · icône dans un carré coloré devant chaque titre · rayon uniforme partout · grille parfaitement symétrique · `shadow-md` · bordure `1px` sur toutes les cartes · deuxième famille typographique · serif · texte en capitales sur plus d'un mot hors labels · animations de `300ms` identiques partout · parallaxe voyante · plus d'une séquence épinglée par vue · compteur animé sur tous les chiffres · librairie de composants importée telle quelle sans retravail.

---

# 8. ORDRE D'EXÉCUTION

1. Audit (§2) → rends `DESIGN-AUDIT.md`.
2. Tokens + coque + nav + **une seule vue pilote** refondue (§3–4).
3. **Montre-moi le pilote et attends validation.** N'anime rien encore au-delà de l'entrée.
4. Motion complet sur le pilote (§5).
5. **Deuxième validation**, puis seulement propagation à toutes les vues + livrables (§6).

Ne propage jamais la D.A. sur l'ensemble des vues avant validation du pilote animé.
