# dashboardsite

Le site **cyqbot.eu** et sa chaîne de publication.

Le site vit dans **`live/`**. Ce dossier est le miroir exact de la racine web
sur l'hébergement LWS : ce qui est dans `live/` sur la branche `main` est ce
qui est en ligne.

---

## Développer depuis n'importe quel PC

```bash
git clone https://github.com/t3rroriste/dashboardsite.git
cd dashboardsite
```

Deux secondes, et tu as tout : les pages, le CSS, le JavaScript, les
traductions, l'historique. Plus rien à télécharger en FTP.

**Voir le site en local**, sans rien installer :

```bash
cd live
python3 -m http.server 8123
```

puis ouvre <http://127.0.0.1:8123/dashboard.html>. Le panneau se navigue sans
back-end : il affiche ses états vides au lieu d'inventer des données.

**Publier :**

```bash
git add -A
git commit -m "ce que tu as changé"
git push
```

Et c'est en ligne dans la minute. Aucun FileZilla, aucun mot de passe FTP à
retaper.

### Sur un PC neuf

Il faut Git et un accès au dépôt. Le plus simple :

- **Git** : <https://git-scm.com/downloads> (sous Windows, laisse les options
  par défaut).
- **L'accès** : installe [GitHub CLI](https://cli.github.com) et lance
  `gh auth login`, ou [GitHub Desktop](https://desktop.github.com) qui fait
  les deux en une fois. Le dépôt est privé : sans connexion, le `clone`
  échoue avec « repository not found », ce qui ne veut pas dire qu'il
  n'existe pas.

---

## La chaîne, en trois workflows

| Workflow | Quand | Ce qu'il fait |
|---|---|---|
| **Publish live/ to cyqbot.eu** | à chaque push sur `main` qui touche `live/` | envoie `live/` sur la racine web en FTPS |
| **Mirror LWS site into Git** | à la main (onglet *Actions*) | rapatrie le site depuis le FTP dans `live/` et le commite |
| **Deploy to LWS** | à la main | construit la maquette Vite et l'envoie dans `preview/` |

Les trois partagent le même groupe de concurrence : jamais deux transferts
FTP en même temps sur ce compte mutualisé.

### `main` est la production

Un push sur `main` qui touche `live/` publie. Pour préparer quelque chose sans
le mettre en ligne, travaille sur une branche et fusionne quand c'est prêt.

### Quand quelque chose part de travers

Le site est versionné : reviens au commit d'avant et pousse.

```bash
git revert <le commit fautif>
git push
```

Et si le serveur et le dépôt ont divergé — quelqu'un a déposé un fichier en
FTP à la main — lance **Mirror LWS site into Git** : il redescend l'état réel
du serveur et le commite, ce qui rend la différence visible dans l'historique.

---

## Ce qu'il faut savoir sur cet hébergement

- **Le dossier de connexion FTP EST la racine web.** Il n'y a pas de `/www/`
  au-dessus. Un chemin absolu `/www/...` crée un sous-dossier *dans* le site.
- **L'hébergement est mutualisé** : Apache et PHP, pas de runtime Python. Le
  site est donc strictement statique, et l'API du bot ne peut pas y tourner.
  C'est la raison du bandeau « Aucune API connectée » : `API_BASE` est vide
  dans `live/assets/js/config.js`, et le restera tant que l'API n'est pas
  hébergée ailleurs.
- **Les secrets** (`LWS_FTP_SERVER`, `LWS_FTP_USERNAME`, `LWS_FTP_PASSWORD`)
  vivent dans les secrets Actions du dépôt. Ils ne sont pas lisibles après
  création et sont masqués dans les logs.

---

## Le reste du dépôt

- `live/` — le site en ligne. C'est ici qu'on travaille.
- `index.html`, `src/` — une maquette Vite qui a servi de référence de
  direction artistique. Ce n'est pas le produit.
- `live/DESIGN-SYSTEM.md` — les tokens, les formes et les écarts assumés,
  pour l'accueil (§1-7) et pour la console (§8).
- `DEPLOY.md` — la mise en service des secrets LWS.
- `HANDOFF.md` — l'état du chantier, pour reprendre sans rien redemander.
