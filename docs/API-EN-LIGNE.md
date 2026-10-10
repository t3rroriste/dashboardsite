# Mettre l'API en ligne — api.cyqbot.eu

Le panneau ne lit et n'enregistre rien tant qu'une API ne répond pas.
L'hébergement mutualisé LWS ne sert que des fichiers : il ne peut pas la
faire tourner. Elle va donc sur la machine qui exécute déjà le bot, et
reçoit son propre sous-domaine.

```
cyqbot.eu              vitrine              LWS mutualisé   (fichiers)
dashboard.cyqbot.eu    panneau              LWS mutualisé   (fichiers)
api.cyqbot.eu          API + sessions       machine du bot  (Python)
```

## Pourquoi un sous-domaine de cyqbot.eu, et pas un autre domaine

`api.cyqbot.eu` et `dashboard.cyqbot.eu` sont deux **origines** différentes,
mais un seul **site** : même domaine enregistrable. Le cookie de session
reste donc un cookie première partie, et un simple `SameSite=Lax` suffit.

Sur un autre domaine — `cyq-api.fr`, une adresse d'hébergeur — il faudrait
`SameSite=None`, que Safari et les navigateurs stricts refusent par défaut.
La connexion marcherait chez toi et nulle part ailleurs. C'est le genre de
panne qu'on ne reproduit jamais sur sa propre machine.

---

## 1. Le DNS

Panneau client LWS → *Domaines* → `cyqbot.eu` → **Zone DNS** :

| Type | Nom | Valeur |
|---|---|---|
| `A` | `api` | l'adresse IP de la machine du bot |

Compte quelques minutes de propagation. Pour vérifier :

```bash
nslookup api.cyqbot.eu
```

## 2. Les fichiers sur la machine

Copie le dossier `api/` (sans son `.env`) sur la machine, par exemple dans
`/opt/cyq-api`. Python 3.11 ou plus suffit : **aucune dépendance à
installer**.

```bash
sudo mkdir -p /opt/cyq-api && sudo chown $USER /opt/cyq-api
# depuis ta machine :
scp -r api/server.py api/README.md utilisateur@IP:/opt/cyq-api/
```

## 3. Le fichier `.env`

Sur la machine, dans `/opt/cyq-api/.env` :

```ini
DISCORD_CLIENT_ID=1521589617521070240
DISCORD_CLIENT_SECRET=<le secret, jamais ailleurs que sur cette machine>
DISCORD_BOT_TOKEN=<le jeton du bot>

PORT=3000
ENV=production
PUBLIC_URL=https://api.cyqbot.eu
APP_URL=https://dashboard.cyqbot.eu
ALLOWED_ORIGINS=https://dashboard.cyqbot.eu,https://cyqbot.eu
```

Ce que font les quatre dernières lignes :

- **`ENV=production`** — le cookie de session devient `Secure`, donc il ne
  circule plus qu'en HTTPS.
- **`PUBLIC_URL`** — l'adresse de retour envoyée à Discord se construit
  dessus. Elle doit correspondre au caractère près à ce qui est déclaré
  dans le portail.
- **`APP_URL`** — où renvoyer le navigateur à la fin de la connexion. Sans
  elle, l'API renverrait sur elle-même, où le panneau n'existe pas.
- **`ALLOWED_ORIGINS`** — qui a le droit d'appeler l'API depuis une autre
  origine. Une origine absente de cette liste ne reçoit aucun en-tête CORS,
  donc le navigateur jette la réponse. Jamais `*` : la norme l'interdit
  avec les cookies, et le navigateur refuserait tout.

```bash
chmod 600 /opt/cyq-api/.env     # le secret ne se lit pas par-dessus l'épaule
```

## 4. Le service

`/etc/systemd/system/cyq-api.service` :

```ini
[Unit]
Description=API du panneau CreateYourQueue
After=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/cyq-api
ExecStart=/usr/bin/python3 /opt/cyq-api/server.py
Restart=always
RestartSec=3
User=cyq

# Le service n'a besoin d'écrire que dans son dossier de données.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/cyq-api/data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cyq-api
sudo systemctl status cyq-api
journalctl -u cyq-api -f          # les journaux, en direct
```

## 5. Le HTTPS

Le serveur Python écoute en clair sur 3000 ; il ne doit **jamais** être
exposé tel quel. Caddy obtient et renouvelle le certificat tout seul.

`/etc/caddy/Caddyfile` :

```
api.cyqbot.eu {
    reverse_proxy 127.0.0.1:3000
}
```

```bash
sudo systemctl reload caddy
```

Avec nginx déjà en place, c'est un `proxy_pass http://127.0.0.1:3000;` et
`certbot --nginx -d api.cyqbot.eu`. L'important est le même : rien
n'atteint le port 3000 depuis l'extérieur.

```bash
sudo ufw allow 80,443/tcp         # et surtout PAS 3000
```

## 6. Discord

Portail développeur → ton application → **OAuth2 → Redirects** → ajouter :

```
https://api.cyqbot.eu/api/auth/callback
```

Au caractère près. Les autres adresses déjà déclarées peuvent rester.

## 7. Le site

Une seule ligne à changer, dans **les deux** copies de `config.js`
(`live/assets/js/` et `live/dashboard.cyqbot.eu/assets/js/`) :

```js
API_BASE: 'https://api.cyqbot.eu/api',
```

Puis, depuis le dépôt :

```bash
powershell -ExecutionPolicy Bypass -File bump-version.ps1 -Dossier live
powershell -ExecutionPolicy Bypass -File bump-version.ps1 -Dossier live/dashboard.cyqbot.eu
git add -A && git commit -m "Brancher le panneau sur api.cyqbot.eu" && git push
```

**À faire en dernier.** Tant que l'API ne répond pas, cette ligne ferait
partir chaque visiteur sur une adresse morte : le panneau afficherait des
erreurs au lieu de ses états vides.

## 8. Vérifier

```bash
curl -i https://api.cyqbot.eu/api/me
#   401 {"error": "UNAUTHORIZED"}  -> l'API répond et refuse, c'est juste

curl -s -o /dev/null -w "%{http_code}\n" https://api.cyqbot.eu/api/auth/login
#   302  -> la connexion part vers Discord

curl -i -H "Origin: https://dashboard.cyqbot.eu" https://api.cyqbot.eu/api/me | grep -i access-control
#   Access-Control-Allow-Origin: https://dashboard.cyqbot.eu
#   Access-Control-Allow-Credentials: true
```

Puis dans un navigateur : `https://dashboard.cyqbot.eu/login.html`,
connexion Discord, et le panneau doit charger tes serveurs.

---

## Ce qui reste après ça

- **Les sessions vivent en mémoire.** Redémarrer le service déconnecte tout
  le monde. Acceptable au début ; à sortir du processus le jour où l'API
  tournera en plusieurs exemplaires.
- **Les réglages sont dans `data/guilds.json`.** Seules `lire_reglages()`
  et `ecrire_reglages()` y touchent : passer à une base ne change que ces
  deux fonctions. À faire avant d'ouvrir à du monde — un fichier JSON
  réécrit en entier à chaque enregistrement ne tient pas la charge.
- **`/api/guilds/:id` ne parle pas encore au bot.** Il renvoie ce que
  Discord sait, plus le fichier. Les permissions réelles du bot, sa place
  dans la hiérarchie des rôles et les presets ne peuvent venir que du bot
  lui-même : c'est le branchement suivant, et c'est pour ça que l'API a sa
  place sur cette machine-là.
