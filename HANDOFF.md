# Reprise de session — état au 28/09/2026 (mis à jour)

> Ce fichier existe pour qu'une nouvelle session reprenne sans rien redemander
> à l'utilisateur. Lis-le en entier avant d'agir.

## Ce qui est fait et fonctionne

**Le site cyqbot.eu est maintenant dans Git.** C'était le correctif de fond :
il ne vivait que sur le FTP LWS, sans sauvegarde ni historique. Le workflow
`.github/workflows/pull-lws.yml` le rapatrie en FTPS dans `live/` et le
commite. Il se lance à la main (onglet *Actions*), ne fait que **lire** le
serveur, et échoue bruyamment si rien n'est rapatrié.

À savoir sur les chemins FTP de LWS : **le dossier de connexion FTP EST la
racine web**. Il n'y a pas de `/www/` au-dessus. C'est ce qui avait fait
échouer les deux premières tentatives, et ce qui explique que l'ancien
`server-dir: /www/preview/` publiait en réalité dans `www/preview/` **sous**
la racine — donc sur `cyqbot.eu/www/preview/`, pas `cyqbot.eu/preview/`.
Corrigé dans `deploy-lws.yml` ; le dossier `www/` resté sur le serveur peut
être supprimé.

**Déploiement automatique** de la maquette : tout push sur `main` construit
le site (`npm run build`) et envoie `dist/` en FTPS dans `preview/`. Les trois
secrets (`LWS_FTP_SERVER`, `LWS_FTP_USERNAME`, `LWS_FTP_PASSWORD`) sont
configurés et vérifiés.

**Maquette de dashboard** à la racine du repo (Vite + anime.js v4, contenu
fictif « Atelier »). Elle reste une référence de direction artistique, pas le
produit.

**La D.A. est appliquée au vrai dashboard.** `live/dashboard.html` et
`live/assets/css/app.css` reprennent la palette, la matière et le détail de
l'accueil — noir chaud, encre crème, filets à 8 %, coque arrondie détachée,
quatre familles de formes, index de sections numéroté, grain à 3 %, caramel
en un seul emploi. La densité, elle, est conservée : un écran de réglages se
scanne. Le détail de ce qui est repris et de ce qui ne l'est pas est dans
`live/DESIGN-SYSTEM.md`, §8.

Quatre défauts corrigés au passage : `hidden-aria` (qui ne faisait rien) →
`aria-hidden`, les glyphes texte `✕` et `⚠` → SVG, la règle de focus qui
posait un `border-radius` sur l'élément focalisé, et le bouton de fermeture
du tiroir mobile, câblé en JS mais masqué par un `display:none` en dur.
Vérifié dans Chromium sur les dix sections, en 1440 et 390 px, deux thèmes :
contraste AA partout, aucune cible sous 44 px (il y en avait cinq), aucune
erreur console.

**Bug Discord résolu** (pour mémoire) : l'erreur « redirect_uri OAuth2 non
valide » venait des URL de redirection absentes du portail Discord. Réglé en
ajoutant `https://www.cyqbot.eu/login.html` et `https://cyqbot.eu/login.html`.

## Ce qui reste à faire

**Publier.** Les changements sont dans Git, **pas encore en ligne**. Le
workflow `.github/workflows/publish-live.yml` renvoie `live/` sur le site :
onglet *Actions* → *Publish live/ to cyqbot.eu* → *Run workflow* → taper
`publier`. Il ne se déclenche jamais tout seul. Demande d'abord à
l'utilisateur : c'est son site en production.

**Les polices.** `dashboard.html` charge Archivo et IBM Plex Mono depuis
Google Fonts. Les héberger dans `assets/fonts/` supprimerait une dépendance
externe et le petit saut de rendu au chargement. Les `.woff2` d'Archivo sont
déjà dans le repo (`src/fonts/`).

**Le reste du site.** `servers.html`, `guide.html`, `modules.html` et
`welcome.html` utilisent le même `app.css` et ont donc hérité de la palette,
mais leur mise en page n'a pas été revue écran par écran.

## Contexte important

- L'hébergement est **mutualisé** : Apache/PHP, pas de runtime Python. Le site
  FastAPI du repo `t3rroriste/createyourqueue` (dossier `site/`) **ne peut pas**
  y tourner. Le dashboard en ligne est du statique.
- Le dashboard fonctionne **sans API** (`API_BASE: ''` dans
  `live/assets/js/config.js`) : il se navigue et affiche ses états vides. C'est
  ce qui permet de le vérifier en local sans back-end.
- Dépôts : `t3rroriste/dashboardsite` (ce repo) et
  `t3rroriste/createyourqueue` (le bot Python).
- **Le réseau de la session peut bloquer `cyqbot.eu`** : le proxy de sortie ne
  laisse passer que GitHub. D'où le détour par GitHub Actions pour lire et
  écrire sur le FTP. Ne perds pas de temps à retenter un `curl` sur le site.
- Pour vérifier le rendu : `python3 -m http.server 8123` depuis `live/`, et
  Chromium est pré-installé (`/opt/pw-browsers/chromium`) — passe-le en
  `executablePath` à Playwright, la version du paquet npm ne correspond pas.
- L'utilisateur écrit en français et préfère des instructions courtes et très
  concrètes. Il s'est perdu plusieurs fois sur FileZilla : évite de lui
  demander des manipulations de fichiers, récupère les choses toi-même.
