# DESIGN-SYSTEM — accueil

Ce document couvre `index.html` uniquement. Le tableau de bord et le
sélecteur de serveur ont leur propre système, dans `assets/css/app.css` :
les deux feuilles restent séparées, et une retouche ici ne déplace toujours
rien dans la console.

**Ce qui a changé depuis :** la console reprend désormais la *palette*, la
*matière* et le *détail* de cette D.A. — le même noir chaud, la même encre,
les mêmes filets, la même coque arrondie. Les deux systèmes ne partagent
aucun fichier, mais ils partagent des valeurs. Voir
[§8, la console](#8-la-console--ce-qui-est-repris-et-ce-qui-ne-lest-pas).

Fichier des tokens : `assets/css/home.css`, bloc `:root`.

## 1. Couleur

| Token | Valeur | Emploi | Contraste sur `--panel` |
|---|---|---|---|
| `--bg` | `#0A0908` | fond derrière la coque | — |
| `--panel` | `#121110` | la coque | — |
| `--raised` | `#1B1918` | sections paires, carte flottante | — |
| `--raised-2` | `#242120` | vignette dans la carte | — |
| `--ink` | `#F4F1EC` | titres, texte fort | 17,8:1 |
| `--ink-60` | `rgba(244,241,236,.60)` | **tout le texte courant** | **6,5:1 — mesuré** |
| `--ink-40` | `rgba(244,241,236,.40)` | wordmark, numéros de liste | 3,5:1 |
| `--hair` | `rgba(244,241,236,.08)` | filets | — |
| `--accent` | `#C08A5A` | voir ci-dessous | 6,3:1 |

Le noir est **chaud** : il tire vers le brun, jamais vers le bleu. C'est ce
qui sépare visuellement cette D.A. d'un thème sombre générique.

**Le piège de la §5.4 est évité.** Le prompt avertissait que l'encre à 55 %
risquait d'échouer en AA. J'ai posé le texte courant à **60 %**, mesuré à
6,5:1 sur le panneau — largement au-dessus des 4,5:1 exigés. À 55 % on
serait encore passé (5,6:1), mais 60 % laisse de la marge si le panneau
s'éclaircit un jour.

`--ink-40` est à 3,5:1 : **il ne porte jamais de texte courant.** Il est
réservé au wordmark géant et aux numéros de liste de 11 px, qui sont du
décor ou de la redondance. Cette contrainte est écrite en commentaire dans
le CSS pour qu'on ne la perde pas.

**L'accent, trois emplois et pas un de plus.** `--accent` n'apparaît que sur
la flèche `↗` dans le disque du CTA, et sur le code de langue actif dans le
menu. Jamais un fond, jamais un dégradé, jamais deux fois dans le même
écran. Il est échantillonné dans le caramel de la référence ; faute de
photo sur ce site, il est le seul rappel de sa chaleur.

## 2. Typographie

Une seule famille : **Geist**, avec **Archivo** en repli. Deux `<link>`
séparés vers Google Fonts, pour qu'un éventuel refus sur l'un ne fasse pas
tomber l'autre.

| Rôle | Taille | Graisse | Détail |
|---|---|---|---|
| Titre héros | `clamp(2.5rem, 4.4vw, 4.25rem)` | 500 | `line-height: 1.02`, `letter-spacing: -.03em`, **bas de casse**, ragged right |
| Titre de section | `clamp(2rem, 3.4vw, 3.25rem)` | 500 | bas de casse |
| Chiffre marquant | `clamp(2.5rem, 4vw, 4rem)` | 500 | `tabular-nums` |
| Corps | 15 px | 400 | `line-height: 1.6` |
| UI | 13–14 px | 400–500 | |
| Label | 11 px | 500 | `letter-spacing: .06em`, capitales |

Ratio titre / corps : **4,8×** au repos, jusqu'à 6,5× sur grand écran.

Le titre n'est pas justifié et n'utilise pas `text-wrap: balance` : les
lignes **doivent** rester inégales. Elles sont découpées à l'exécution par
`anime.splitText`, après le chargement des polices — un découpage fait avant
mesurerait les lignes sur la police de repli, puis les recomposerait. Le
découpage est refait au redimensionnement, et il conserve une copie
accessible du texte complet pour les lecteurs d'écran.

## 3. Formes

Quatre familles, aucun rectangle.

| Forme | Rayon | Emploi |
|---|---|---|
| Coque | `36px` | le panneau racine, détaché de 16 px des bords |
| Carte | `24px` | carte flottante, bloc de configuration |
| Média | `20px` | vignette |
| Pilule | `999px` | navigation, boutons primaire et secondaire |
| Disque | `50%` | contrôles, flèche du CTA |
| Section empilée | `32px 32px 0 0` | coins hauts seulement — elle vient de sous l'écran |

Aucune bordure sur les cartes : la séparation se fait par contraste de fond
(`--panel` contre `--raised`) ou par filet à 8 %. Une seule ombre dans tout
le système, très large et très diffuse : `0 60px 120px -60px rgba(0,0,0,.9)`.

Grain : `feTurbulence` en SVG inline, à **3 %**, `pointer-events: none`, sur
toute la coque.

## 4. Respiration

`8 / 16 / 32 / 64 / 120 / 200`. Aucune valeur intermédiaire.

## 5. Mouvement

| Rôle | Courbe | Durée |
|---|---|---|
| Entrées | `cubicBezier(.16,1,.3,1)` | 600–1300 ms |
| Micro | `outQuad` | 120–260 ms |
| Ressort | `outBack(1.2)` | 700 ms — **une seule fois**, sur la carte flottante |
| Scrub | `linear` | lié au défilement |

Séquence d'ouverture, en **une** `createTimeline()` :

```
t=0    coque      scale .96 → 1, radius 64 → 36px      900 ms
t=120  navigation y -24 → 0, opacité 0 → 1             700 ms
t=200  titre      ligne par ligne, y 110% → 0          1000 ms, stagger 80
t=350  matière    scale 1.12 → 1, blur 12 → 6px        1300 ms
t=550  wordmark   y 55% → 6%, opacité 0 → .08          1200 ms
t=600  texte      y 14 → 0, opacité                    600 ms, stagger 60
t=700  carte      scale .92 → 1                        700 ms, outBack
```

Interface cliquable à **400 ms** (vérifié). Aucun déplacement ne dépasse
40 px, le wordmark excepté, exprimé en pourcentage. Seuls `transform`,
`opacity` et `filter` sont animés.

## 6. Trois pièges rencontrés, et leur cause

Ils sont documentés ici parce qu'ils se reproduiront à la prochaine
modification.

**anime.js gère toute la chaîne `transform`.** Une navigation centrée par
`transform: translateX(-50%)` en CSS se retrouve décalée à droite dès qu'on
anime `y` : la bibliothèque réécrit la propriété entière. La pilule est donc
centrée par `left: 0; right: 0; margin: 0 auto; width: max-content`, sans
transform.

**Une section `sticky` a un rectangle figé.** Une fois épinglée, elle ne
bouge plus par rapport à l'écran, donc elle ne peut pas servir de référence
à un calcul de progression au défilement. Chaque section est précédée d'un
repère `.sec-mark` de hauteur nulle, resté dans le flux, et c'est lui qu'on
mesure. Sur un repère de hauteur nulle, les seuils **par défaut** de
`onScroll` donnent exactement « du bas de l'écran au haut ».

**Les seuils `enter`/`leave` personnalisés cassent le scrub sans rien dire.**
`onScroll({ enter: 'top bottom' })` laisse la progression bloquée à 0, sans
erreur en console. On garde les valeurs par défaut et on choisit l'élément
cible en conséquence.

Enfin, le déclenchement des révélations se fait par **test de position**, pas
par `IntersectionObserver` : celui-ci ne se déclenche jamais sur un élément
déjà dépassé, et une arrivée par ancre (`#sys-3`) ou un rechargement qui
restaure la position laissait la section vide.

## 7. Accessibilité

- Contraste AA mesuré sur toutes les couleurs de texte (§1).
- Focus visible : anneau 2 px `--ink`, `outline-offset: 3px`, jamais supprimé.
- Cibles ≥ 44 px, disques compris.
- `prefers-reduced-motion` : drapeau lu **une fois** en JS, pas de
  duplication de code. Empilement, scrub et parallaxe désactivés, sections
  repassées en `position: static`, tout le contenu immédiatement visible,
  compteurs posés à leur valeur finale. Vérifié.
- Sans JavaScript : `page-home.js` sort immédiatement si anime.js manque, et
  aucun état initial n'est posé en CSS — la page reste lisible et navigable.

## 8. La console — ce qui est repris, et ce qui ne l'est pas

`dashboard.html` est un panneau de configuration : neuf sections numérotées,
des interrupteurs, des combos, des champs bornés, une barre de sauvegarde.
Il se **scanne**, il ne se lit pas. Transposer l'accueil tel quel — un point
focal par écran, des titres de 4 rem, un défilement narratif — l'aurait
rendu impraticable. Ce qui a été repris est donc la matière, pas la mise en
scène.

### Repris

| De l'accueil | Dans la console |
|---|---|
| Noir chaud `#0A0908` / `#121110` / `#1B1918` / `#24211F` | Les mêmes valeurs, dans `app.css :root` |
| Encre crème `#F4F1EC` et ses paliers | `--fg` `#F4F1EC`, `--fg-2` `#A9A29A` (7,6:1), `--fg-3` `#857E76` (4,9:1) |
| Le filet à 8 % plutôt qu'un gris opaque | `--hair`, sur les groupes, la latérale, la barre supérieure, les tableaux |
| La coque détachée, à grand rayon | `.app`, rayon 24 px, gouttière 14 px, sur un noir plus profond (`--void`) |
| Quatre familles de formes | coque 24 · bloc 12 · contrôle 6 · pilule 999 · disque 50 % |
| Le grain à 3 % | `body::after`, thème sombre uniquement |
| Aucune ombre dure | `0 40px 80px -40px` sur les panneaux flottants |

### Volontairement pas repris

- **Les grands titres.** Le titre de section reste à 21 px / 600. Le ratio
  titre-corps de l'accueil (> 4×) supposerait un seul point focal par écran ;
  ici il y en a douze.
- **La faible densité.** Les lignes de réglage gardent leurs 34 px et leur
  échelle de 6 à 24 px. C'est le point où la console doit diverger, et le
  brief de ce projet le posait déjà : « la densité est le vrai problème de
  design ici ».
- **Le défilement narratif, l'empilement de sections, la parallaxe.** Un
  écran de réglages ne raconte rien ; il doit répondre.
- **L'index numéroté.** Les sections de l'accueil sont numérotées ; celles
  de la console ne le sont plus. La latérale les donne déjà dans l'ordre et
  chaque écran porte son titre : le chiffre ne disait rien que la page ne
  disait déjà. Le caramel, qui n'avait que cet emploi, a disparu avec lui —
  la console est strictement monochrome, hors couleurs d'état et couleurs
  d'équipe, qui sont des données.
- **La police unique.** Archivo pour le texte, IBM Plex Mono pour les
  chiffres, les identifiants et les clés de réglage (`log.voice`,
  `#file-attente`). L'accueil s'en tient à une famille ; ici la seconde est
  fonctionnelle — elle aligne les colonnes de nombres et distingue une
  valeur technique d'une phrase. C'est un écart assumé au brief.

### Le thème clair

Il n'est pas une inversion : le fond devient un papier chaud (`#E7E3DB`),
les panneaux le crème (`#F5F2EC`), et le caramel s'assombrit à `#7A5528`
pour tenir le AA (6,6:1). Les deux thèmes sont mesurés, pas estimés.

### Vérifié dans Chromium

Sur les dix sections, en 1440 px et 390 px, thème sombre et thème clair :

- **Contraste** : aucun texte sous son seuil AA. Mesuré sur le rendu, pas
  sur les tokens — l'opacité et le fond réel sont pris en compte.
- **Cibles tactiles** : aucune sous 44 px à 390 px. Cinq l'étaient avant.
- **Aucune erreur console**, hors le refus des polices Google dans
  l'environnement de test, qui n'a pas d'accès réseau vers `fonts.gstatic`.
- **`prefers-reduced-motion`** : contenu immédiatement visible.
