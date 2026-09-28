# Reprise de session — état au 28/09/2026

> Ce fichier existe pour qu'une nouvelle session reprenne sans rien redemander
> à l'utilisateur. Lis-le en entier avant d'agir.

## Ce qui est fait et fonctionne

**Déploiement automatique.** Tout push sur `main` construit le site
(`npm run build`) et envoie `dist/` sur l'hébergement LWS en FTPS.
Workflow : `.github/workflows/deploy-lws.yml`. Les trois secrets
(`LWS_FTP_SERVER`, `LWS_FTP_USERNAME`, `LWS_FTP_PASSWORD`) sont configurés et
vérifiés — deux déploiements réussis. Cible actuelle : `/www/preview/`, donc
`https://cyqbot.eu/preview/`. La racine n'est **pas** touchée.

**Maquette de dashboard** dans ce repo : Vite + anime.js v4, direction
artistique tirée de captures TikTok fournies par l'utilisateur (noir chaud
monochrome, coque arrondie détachée, Archivo variable auto-hébergée, wordmark
géant rogné, cartes portrait 3:4, sections empilées au scroll).
Contenu **fictif** (marque « Atelier », mobilier). Vérifiée dans Chromium :
contraste AA sur les 5 surfaces, cibles ≥ 44 px, reduced-motion, zéro erreur
console.

**Bug Discord résolu.** L'erreur « redirect_uri OAuth2 non valide » venait des
URL de redirection absentes du portail Discord. Réglé en ajoutant
`https://www.cyqbot.eu/login.html` et `https://cyqbot.eu/login.html`.

## La tâche en cours

L'utilisateur veut la nouvelle direction artistique appliquée **sur son vrai
dashboard**, `https://cyqbot.eu/dashboard.html` — et **surtout pas** en
remplaçant ce fichier par la maquette, qui n'a ni connexion Discord ni données.
Il ne veut pas non plus qu'on touche à `index.html` (la page d'accueil).

### Ce qu'est ce vrai dashboard

Panneau de configuration d'un bot Discord. Dense, utilitaire, très loin d'une
page vitrine : 9 sections numérotées (Langue, Fonctions, Salons, Rôles, MMR,
Queue, Presets, Logs, Sécurité) plus un Diagnostic, avec interrupteurs, combos,
champs numériques bornés, barre de sauvegarde collante, i18n en 5 langues
(fr/en/es/de/ko), thème clair/sombre via `data-theme` + `localStorage`.

Il charge **déjà Archivo** et IBM Plex Mono depuis Google Fonts, numérote déjà
ses sections, et utilise des tokens sémantiques (`--fg-2`, `--fg-3`, `--line`,
`--line-2`, `--panel-3`, `--acc`, `--warn`, `--sans`, `--mono`).

**Ne transpose pas la maquette éditoriale telle quelle** : un écran de réglages
doit rester dense et scannable. Reprends la palette, la typo et le détail
(filets, numéros, petites capitales suivies), pas le scroll narratif ni les
grands titres.

### À récupérer en premier (le réseau doit être ouvert sur cyqbot.eu)

```
https://cyqbot.eu/dashboard.html
https://cyqbot.eu/assets/css/app.css
https://cyqbot.eu/assets/js/app.js
https://cyqbot.eu/assets/js/config.js
https://cyqbot.eu/assets/js/page-dashboard.js
https://cyqbot.eu/index.html
https://cyqbot.eu/login.html
https://cyqbot.eu/servers.html
```

Sans `app.css`, aucun jugement sur le design n'est possible : le HTML ne dit
presque rien du rendu.

## Défauts déjà repérés dans `dashboard.html`

1. `<div class="scrim" hidden-aria>` — `hidden-aria` n'est pas un attribut
   valide et ne fait rien. Probablement `hidden` ou `aria-hidden="true"`.
   Ce scrim doit masquer le fond quand le tiroir latéral s'ouvre.
2. Icônes incohérentes : du SVG partout, sauf `✕` (fermer) et `⚠` (alerte
   rôles) qui sont des caractères texte, au rendu dépendant de l'OS.
3. Beaucoup de `style="..."` en dur (tailles de titres, largeurs, couleurs),
   ce qui rend toute refonte pénible.

## Contexte important

- Le site `cyqbot.eu` n'est **dans aucun repo** : il vit uniquement sur le FTP
  LWS, sans sauvegarde ni historique. Le mettre sous Git est le vrai correctif
  de fond. L'utilisateur a sauvegardé `index.html` sur son Bureau.
- L'hébergement est **mutualisé** : Apache/PHP, pas de runtime Python. Le site
  FastAPI du repo `t3rroriste/createyourqueue` (dossier `site/`) **ne peut pas**
  y tourner. Le dashboard en ligne est du statique, non versionné.
- Dépôts : `t3rroriste/dashboardsite` (ce repo, la maquette + le pipeline) et
  `t3rroriste/createyourqueue` (le bot Python + un site FastAPI inutilisé).
- L'utilisateur écrit en français et préfère des instructions courtes et très
  concrètes. Il s'est perdu plusieurs fois sur FileZilla : évite de lui demander
  des manipulations de fichiers, récupère les choses toi-même.
