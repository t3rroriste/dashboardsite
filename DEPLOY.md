# Déploiement automatique vers LWS

Chaque push sur `main` déclenche GitHub Actions : le site est construit
(`npm run build`) puis le contenu de `dist/` est envoyé sur l'hébergement LWS
en FTPS. Aucune action manuelle, aucun FileZilla.

Workflow : `.github/workflows/deploy-lws.yml`

---

## Mise en service — 3 secrets à créer

Dans GitHub : **Settings → Secrets and variables → Actions → New repository secret**.
Ne colle jamais ces valeurs dans une conversation ou dans un fichier du repo.

| Nom du secret | Où le trouver dans LWS |
|---|---|
| `LWS_FTP_SERVER` | LWS Panel → *Hébergement* → *Comptes FTP*. C'est le nom d'hôte, par ex. `ftp.tondomaine.fr` ou `ftpXXX.lws-hosting.com`. **Sans** `ftp://` et sans slash. |
| `LWS_FTP_USERNAME` | L'identifiant du compte FTP dans ce même écran. |
| `LWS_FTP_PASSWORD` | Le mot de passe de ce compte FTP. Si tu ne l'as plus, réinitialise-le depuis le panneau — c'est plus sûr que de le chercher. |

### Le dossier cible — important

Par défaut, le workflow déploie dans **`/www/preview/`**, un sous-dossier.
Le site est alors visible sur `https://tondomaine.fr/preview/`.

C'est volontaire : **un site est déjà en ligne sur ce domaine**, et cette valeur
par défaut garantit qu'un déploiement raté ou mal configuré ne peut pas écraser
la page d'accueil.

Pour publier à la racine une fois la chaîne validée et le dashboard prêt :
GitHub → *Settings* → *Secrets and variables* → *Actions* → onglet
**Variables** → *New repository variable* → `LWS_SERVER_DIR` = la racine web.

Cette racine est le dossier qui contient l'`index.html` du site actuel. Selon
l'offre LWS : `/www/`, `/htdocs/` ou `/public_html/`. Vérifie-le en FTP
(FileZilla) avant de basculer — **si le dossier est faux, le workflow sera vert
mais rien ne changera en ligne**, les fichiers auront été déposés ailleurs.

---

## Utilisation

- **Déploiement normal** : tu pousses sur `main`, c'est en ligne en ~1 minute.
- **Déploiement manuel** : onglet *Actions* → *Deploy to LWS* → *Run workflow*.
- **Suivi** : onglet *Actions*. Un job rouge = rien n'a été envoyé, le site en
  ligne reste intact.

Les branches autres que `main` ne déploient pas — c'est voulu : on peut
travailler sans publier.

---

## Sécurité

- Le transfert est en **FTPS** (chiffré), pas en FTP clair.
- `dangerous-clean-slate` est à `false` : le workflow ne vide jamais le dossier
  distant. Il synchronise les fichiers du build. Les fichiers propres à LWS
  (`.htaccess` écrit par le panneau, dossiers de mail, statistiques) ne sont pas
  supprimés.
- Les secrets ne sont pas lisibles après création, et sont masqués dans les logs.
- Si un mot de passe FTP a transité en clair quelque part (chat, e-mail,
  capture), change-le dans le panneau LWS avant de le mettre en secret.

---

## Dépannage

| Symptôme | Cause probable |
|---|---|
| `530 Login authentication failed` | Identifiant ou mot de passe faux, ou compte FTP désactivé. |
| `ECONNREFUSED` / timeout | Mauvais nom d'hôte, ou `ftp://` laissé dans le secret. |
| Workflow vert mais site inchangé | `LWS_SERVER_DIR` pointe au mauvais endroit. |
| Page blanche, erreurs 404 sur les assets | Le site est servi depuis un sous-dossier ; `base` dans `vite.config.js` est déjà en `'./'`, vérifie plutôt le dossier cible. |
| `npm ci` échoue | `package-lock.json` désynchronisé : relance `npm install` en local et commite le lockfile. |

---

## État actuel

`index.html` est une **page placeholder** qui affiche la date du build. Elle sert
uniquement à vérifier la chaîne de bout en bout : modifie son texte, pousse sur
`main`, et regarde le changement apparaître sur `tondomaine.fr/preview/`.

Le site de production actuel n'est pas touché tant que `LWS_SERVER_DIR` n'a pas
été créée. La page placeholder sera remplacée par le dashboard.
