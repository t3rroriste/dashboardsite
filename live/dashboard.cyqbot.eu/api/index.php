<?php
/* =========================================================================
 * API du panneau CreateYourQueue — version PHP, pour l'hébergement LWS.
 *
 * Pourquoi PHP et pas le server.py du dépôt : l'hébergement mutualisé LWS
 * n'exécute que du PHP. Un programme Python y est impossible, et une API sur
 * une autre machine aurait voulu un sous-domaine, un certificat, du CORS et
 * un cookie tiers. Ici, l'API vit DANS le dossier du panneau : même origine,
 * donc rien de tout cela.
 *
 * Elle fait exactement ce que fait server.py — qui reste, lui, l'outil de
 * développement local :
 *
 *   GET   /api/auth/login              départ vers Discord, avec state
 *   GET   /api/auth/callback           retour, échange du code, session
 *   POST  /api/auth/logout             fin de session
 *   GET   /api/me                      le compte connecté
 *   GET   /api/guilds                  les serveurs qu'on peut gérer
 *   GET   /api/guilds/{id}             un serveur, ses salons, ses rôles
 *   PATCH /api/guilds/{id}/settings    enregistre des réglages
 *
 * Le CLIENT_SECRET n'est pas dans ce fichier : il est lu dans secrets.php,
 * qui n'est pas versionné et se dépose à la main sur le serveur.
 * ========================================================================= */

declare(strict_types=1);

/* L'hebergement peut encore servir du PHP 7.4 : str_starts_with() n'existe
   qu'a partir de 8.0. Deux lignes evitent une panne qu'on ne verrait qu'en
   production, et seulement sur certaines offres. */
if (!function_exists('str_starts_with')) {
    function str_starts_with(string $sujet, string $debut): bool
    {
        return $debut === '' || strncmp($sujet, $debut, strlen($debut)) === 0;
    }
}

const API_DISCORD   = 'https://discord.com/api/v10';
const MANAGE_GUILD  = 0x20;          // le bit « Gérer le serveur »
const DUREE_SESSION = 7 * 24 * 3600;

// ------------------------------- les secrets --------------------------------

$conf = @include __DIR__ . '/secrets.php';
if (!is_array($conf)) {
    // Pas de secrets : on le dit proprement, sans détail exploitable.
    repondre(500, ['error' => 'NOT_CONFIGURED']);
}
$CLIENT_ID     = (string)($conf['client_id'] ?? '');
$CLIENT_SECRET = (string)($conf['client_secret'] ?? '');
$BOT_TOKEN     = (string)($conf['bot_token'] ?? '');

// --------------------------------- réponses ---------------------------------

function repondre(int $code, $donnees = null): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    // Une réponse d'API ne se met jamais en cache : elle dépend de la session.
    header('Cache-Control: no-store');
    if ($donnees !== null) {
        echo json_encode($donnees, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
    exit;
}

function rediriger(string $vers): void
{
    header('Location: ' . $vers, true, 302);
    exit;
}

/* Où vit le panneau, vu du navigateur. L'API est dans son dossier `api/`,
   donc il suffit de remonter d'un cran — et ça marche quel que soit le
   domaine, sans rien écrire en dur. */
function base_panneau(): string
{
    $racine = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/index.php'), '/');  // /api
    $racine = rtrim(dirname($racine), '/');                                      // /
    $hote   = $_SERVER['HTTP_HOST'] ?? 'dashboard.cyqbot.eu';
    return 'https://' . $hote . ($racine === '' ? '' : $racine) . '/';
}

function url_retour(): string
{
    return rtrim(base_panneau(), '/') . '/api/auth/callback';
}

// --------------------------------- session ----------------------------------

/* Les sessions natives de PHP : le jeton d'accès reste sur le serveur, et le
   navigateur ne reçoit qu'un identifiant opaque. `Secure` et `HttpOnly` vont
   de soi ; `SameSite=Lax` suffit puisque l'API et la page sont sur la même
   origine. */
function demarrer_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_set_cookie_params([
        'lifetime' => DUREE_SESSION,
        'path'     => '/',
        'secure'   => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('cyq_sid');
    session_start();
}

function session_ouverte(): ?array
{
    demarrer_session();
    $s = $_SESSION['cyq'] ?? null;
    return is_array($s) && !empty($s['access_token']) ? $s : null;
}

// -------------------------------- Discord -----------------------------------

/* Un seul endroit appelle Discord. `$type` vaut « Bearer » pour le jeton de
   la personne connectée, « Bot » pour celui du bot — les salons et les rôles
   ne sont lisibles qu'avec le second. */
function appel_discord(string $chemin, string $jeton, string $type = 'Bearer'): array
{
    $c = curl_init(API_DISCORD . $chemin);
    curl_setopt_array($c, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            'Authorization: ' . $type . ' ' . $jeton,
            'Accept: application/json',
        ],
        CURLOPT_USERAGENT      => 'CreateYourQueue (https://cyqbot.eu)',
    ]);
    $corps = curl_exec($c);
    $code  = (int)curl_getinfo($c, CURLINFO_HTTP_CODE);
    $err   = curl_error($c);
    curl_close($c);

    if ($corps === false) {
        throw new RuntimeException('curl: ' . $err, 0);
    }
    if ($code >= 400) {
        throw new RuntimeException('discord', $code);
    }
    $json = json_decode((string)$corps, true);
    return is_array($json) ? $json : [];
}

function peut_gerer(array $g): bool
{
    if (!empty($g['owner'])) {
        return true;
    }
    // Les permissions arrivent en chaîne : elles dépassent la taille d'un
    // entier sur les plateformes 32 bits, d'où la comparaison en chaîne.
    $p = $g['permissions'] ?? '0';
    return (((int)$p) & MANAGE_GUILD) === MANAGE_GUILD;
}

function url_icone(string $gid, ?string $h, int $taille = 64): ?string
{
    if (!$h) {
        return null;
    }
    $ext = str_starts_with($h, 'a_') ? 'gif' : 'png';
    return "https://cdn.discordapp.com/icons/$gid/$h.$ext?size=$taille";
}

// ------------------------------ les réglages --------------------------------

/* Un fichier JSON, pas une base — assez pour commencer, et remplaçable sans
   toucher au reste : seules ces deux fonctions y touchent. Le dossier `data`
   est interdit d'accès par son propre .htaccess ; sans lui, les réglages
   seraient lisibles par n'importe qui à l'adresse /api/data/guilds.json. */
function fichier_reglages(): string
{
    $dossier = __DIR__ . '/data';
    if (!is_dir($dossier)) {
        @mkdir($dossier, 0750, true);
    }
    return $dossier . '/guilds.json';
}

function lire_reglages(): array
{
    $f = fichier_reglages();
    if (!is_file($f)) {
        return [];
    }
    $brut = @file_get_contents($f);
    $json = json_decode((string)$brut, true);
    return is_array($json) ? $json : [];
}

/* Lecture-modification-écriture sous verrou : deux onglets qui enregistrent
   en même temps écraseraient sinon l'un les réglages de l'autre. */
function modifier_reglages(callable $modif): void
{
    $f = fichier_reglages();
    $fp = @fopen($f, 'c+');
    if (!$fp) {
        repondre(500, ['error' => 'STORAGE']);
    }
    try {
        flock($fp, LOCK_EX);
        $brut = stream_get_contents($fp);
        $tout = json_decode((string)$brut, true);
        if (!is_array($tout)) {
            $tout = [];
        }
        $tout = $modif($tout);
        $texte = json_encode($tout, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, (string)$texte);
        fflush($fp);
    } finally {
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}

// --------------------------------- routage ----------------------------------

$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$chemin  = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

/* On ne garde que ce qui suit « /api ». Le dossier peut être ailleurs qu'à la
   racine du domaine, donc on ne suppose pas sa position. */
$prefixe = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/index.php'), '/');
if ($prefixe !== '' && str_starts_with($chemin, $prefixe)) {
    $chemin = substr($chemin, strlen($prefixe));
}
$chemin = '/' . ltrim($chemin, '/');

// ------------------------------- connexion ----------------------------------

if ($chemin === '/auth/login' && $methode === 'GET') {
    if (!$CLIENT_ID) {
        repondre(500, ['error' => 'NOT_CONFIGURED']);
    }
    demarrer_session();
    /* Le `state` est tiré au sort ICI et retrouvé au retour : sans lui,
       n'importe quel site pourrait déclencher la connexion à votre place. */
    $state = bin2hex(random_bytes(16));
    $_SESSION['cyq_state'] = $state;

    /* Un seul écran pour les deux : `identify guilds` ouvre la session, et
       `bot applications.commands` fait apparaître le choix du serveur où
       ajouter le bot. Discord renvoie alors guild_id en plus du code. */
    $q = http_build_query([
        'client_id'     => $CLIENT_ID,
        'response_type' => 'code',
        'redirect_uri'  => url_retour(),
        'scope'         => 'identify guilds bot applications.commands',
        'permissions'   => (string)($conf['invite_permissions'] ?? '1099780064336'),
        'state'         => $state,
    ]);
    rediriger('https://discord.com/oauth2/authorize?' . $q);
}

if ($chemin === '/auth/callback' && $methode === 'GET') {
    demarrer_session();
    $attendu = (string)($_SESSION['cyq_state'] ?? '');
    unset($_SESSION['cyq_state']);
    $panneau = base_panneau();

    if (isset($_GET['error'])) {
        rediriger($panneau . 'servers.html?auth=refus');
    }
    $code  = (string)($_GET['code'] ?? '');
    $state = (string)($_GET['state'] ?? '');
    if ($code === '') {
        rediriger($panneau . 'servers.html?auth=incomplet');
    }
    // Comparaison à temps constant : une comparaison naïve fuit la valeur.
    if ($attendu === '' || !hash_equals($attendu, $state)) {
        rediriger($panneau . 'servers.html?auth=state');
    }

    // --- échange du code contre un jeton ---
    $c = curl_init(API_DISCORD . '/oauth2/token');
    curl_setopt_array($c, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'client_id'     => $CLIENT_ID,
            'client_secret' => $CLIENT_SECRET,
            'grant_type'    => 'authorization_code',
            'code'          => $code,
            'redirect_uri'  => url_retour(),
        ]),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
    ]);
    $corps = curl_exec($c);
    $http  = (int)curl_getinfo($c, CURLINFO_HTTP_CODE);
    curl_close($c);

    if ($corps === false || $http >= 400) {
        // Le corps peut contenir des éléments du secret : on n'en garde rien.
        rediriger($panneau . 'servers.html?auth=echange');
    }
    $jeton = json_decode((string)$corps, true);
    if (!is_array($jeton) || empty($jeton['access_token'])) {
        rediriger($panneau . 'servers.html?auth=echange');
    }

    try {
        $moi = appel_discord('/users/@me', $jeton['access_token']);
    } catch (Throwable $e) {
        rediriger($panneau . 'servers.html?auth=erreur');
    }

    session_regenerate_id(true);   // l'identifiant de session change à la connexion
    $_SESSION['cyq'] = [
        'access_token' => $jeton['access_token'],
        'user_id'      => (string)($moi['id'] ?? ''),
        'user_name'    => (string)($moi['global_name'] ?? $moi['username'] ?? ''),
        'username'     => (string)($moi['username'] ?? ''),
        'avatar_url'   => !empty($moi['avatar'])
            ? 'https://cdn.discordapp.com/avatars/' . $moi['id'] . '/' . $moi['avatar'] . '.png?size=64'
            : null,
    ];

    /* Avec le scope `bot`, Discord indique le serveur où le bot vient d'être
       ajouté. On le NOTE — c'est su, pas deviné — mais on n'y emmène pas
       d'office : on arrive toujours sur le choix du serveur.

       La version précédente ouvrait directement le panneau de ce serveur-là.
       C'est une supposition de trop : on se connecte le plus souvent pour
       régler un serveur DÉJÀ configuré, pas celui qu'on vient d'ajouter, et
       atterrir sans l'avoir demandé dans un panneau vide désoriente. Le
       choix du serveur coûte un clic et montre ce qu'on a. */
    $gid = (string)($_GET['guild_id'] ?? '');
    if ($gid !== '' && ctype_digit($gid)) {
        modifier_reglages(function (array $tout) use ($gid): array {
            $tout[$gid] = array_merge($tout[$gid] ?? [], ['botPresent' => true]);
            return $tout;
        });
    }
    rediriger($panneau . 'servers.html');
}

if ($chemin === '/auth/logout' && $methode === 'POST') {
    demarrer_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    repondre(204);
}

// ---------------------------------- api -------------------------------------

$session = session_ouverte();
if (!$session) {
    repondre(401, ['error' => 'UNAUTHORIZED']);
}

if ($chemin === '/me' && $methode === 'GET') {
    repondre(200, [
        'id'        => $session['user_id'],
        'name'      => $session['user_name'],
        'username'  => $session['username'],
        'avatarUrl' => $session['avatar_url'],
    ]);
}

/* Les serveurs de la personne, filtrés sur « Gérer le serveur ». Discord est
   la seule source de vérité ici : on ne se fie jamais à ce que le navigateur
   affirme. */
function mes_guildes(array $session): array
{
    try {
        return appel_discord('/users/@me/guilds', $session['access_token']);
    } catch (RuntimeException $e) {
        if ($e->getCode() === 401) {
            repondre(401, ['error' => 'UNAUTHORIZED']);
        }
        if ($e->getCode() === 429) {
            repondre(429, ['error' => 'RATE']);
        }
        repondre(502, ['error' => 'DISCORD_UNAVAILABLE']);
    }
}

if ($chemin === '/guilds' && $methode === 'GET') {
    $brut = mes_guildes($session);
    $reglages = lire_reglages();
    $liste = [];
    foreach ($brut as $g) {
        if (!peut_gerer($g)) {
            continue;
        }
        $enr = $reglages[$g['id']] ?? [];
        $liste[] = [
            'id'                 => $g['id'],
            'name'               => $g['name'],
            'iconUrl'            => url_icone($g['id'], $g['icon'] ?? null),
            'memberCount'        => $g['approximate_member_count'] ?? null,
            'canManage'          => true,
            'botPresent'         => (bool)($enr['botPresent'] ?? false),
            'configured'         => !empty($enr['settings']),
            'updatedAt'          => $enr['updatedAt'] ?? null,
            'missingPermissions' => $enr['missingPermissions'] ?? [],
        ];
    }
    repondre(200, $liste);
}

/* Toutes les routes qui suivent portent sur UN serveur. On vérifie à chaque
   fois que la personne le gère vraiment : sans ce contrôle, n'importe quel
   compte connecté lirait et modifierait la configuration de n'importe quelle
   guilde en changeant l'identifiant dans l'URL. */
if (preg_match('#^/guilds/(\d{5,25})(/settings)?$#', $chemin, $m)) {
    $gid = $m[1];
    $estReglages = isset($m[2]);

    $laGuilde = null;
    foreach (mes_guildes($session) as $g) {
        if ((string)$g['id'] === $gid) {
            $laGuilde = $g;
            break;
        }
    }
    if (!$laGuilde || !peut_gerer($laGuilde)) {
        repondre(403, ['error' => 'FORBIDDEN']);
    }

    // ---- enregistrement ----
    if ($estReglages && $methode === 'PATCH') {
        $brut = file_get_contents('php://input');
        if ($brut === false || strlen($brut) > 262144) {
            repondre(400, ['error' => 'BAD_REQUEST']);
        }
        $corps = json_decode((string)$brut, true);
        if (!is_array($corps)) {
            repondre(400, ['error' => 'BAD_REQUEST']);
        }
        // Les valeurs sont stockées telles quelles, mais les CLÉS sont
        // bornées : sans ça, une clé fantaisiste polluerait le fichier.
        $propre = [];
        foreach ($corps as $k => $v) {
            if (is_string($k) && preg_match('#^[A-Za-z0-9._-]{1,64}$#', $k)
                && (is_scalar($v) || $v === null)) {
                $propre[$k] = is_bool($v) ? ($v ? '1' : '0') : $v;
            }
        }
        modifier_reglages(function (array $tout) use ($gid, $propre): array {
            $actuel = $tout[$gid] ?? [];
            $tout[$gid] = array_merge($actuel, [
                'settings'  => array_merge($actuel['settings'] ?? [], $propre),
                'updatedAt' => gmdate('Y-m-d\TH:i:s\Z'),
            ]);
            return $tout;
        });
        repondre(204);
    }

    // ---- lecture ----
    if (!$estReglages && $methode === 'GET') {
        $enr = lire_reglages()[$gid] ?? [];
        $rep = [
            'id'                 => $laGuilde['id'],
            'name'               => $laGuilde['name'],
            'iconUrl'            => url_icone($gid, $laGuilde['icon'] ?? null, 128),
            'memberCount'        => $laGuilde['approximate_member_count'] ?? null,
            'me'                 => ['name' => $session['user_name']],
            'settings'           => $enr['settings'] ?? null,
            'presets'            => $enr['presets'] ?? [],
            'permissions'        => $enr['permissions'] ?? null,
            'missingPermissions' => $enr['missingPermissions'] ?? [],
            'botRolePosition'    => $enr['botRolePosition'] ?? null,
            'channels'           => [],
            'voiceChannels'      => [],
            'categories'         => [],
            'roles'              => [],
        ];

        /* Salons et rôles ne sont lisibles qu'avec un jeton de BOT : le jeton
           de la personne n'y donne pas accès. Sans jeton de bot, on renvoie
           des listes vides — les menus seront vides, mais rien ne ment. */
        if ($BOT_TOKEN !== '') {
            try {
                $salons = appel_discord("/guilds/$gid/channels", $BOT_TOKEN, 'Bot');
                $roles  = appel_discord("/guilds/$gid/roles", $BOT_TOKEN, 'Bot');
                $nom = fn(array $c) => ['id' => $c['id'], 'name' => $c['name']];
                foreach ($salons as $c) {
                    if (($c['type'] ?? -1) === 0)      { $rep['channels'][]      = $nom($c); }
                    elseif (($c['type'] ?? -1) === 2)  { $rep['voiceChannels'][] = $nom($c); }
                    elseif (($c['type'] ?? -1) === 4)  { $rep['categories'][]    = $nom($c); }
                }
                usort($roles, fn($a, $b) => ($b['position'] ?? 0) <=> ($a['position'] ?? 0));
                foreach ($roles as $r) {
                    if (!empty($r['managed']) || ($r['name'] ?? '') === '@everyone') {
                        continue;
                    }
                    $rep['roles'][] = [
                        'id'       => $r['id'],
                        'name'     => $r['name'],
                        'position' => $r['position'] ?? 0,
                    ];
                }
            } catch (Throwable $e) {
                // Le bot n'est pas sur ce serveur, ou il lui manque un droit.
                // Les listes restent vides, le panneau le montre.
            }
        }
        repondre(200, $rep);
    }

    repondre(405, ['error' => 'METHOD_NOT_ALLOWED']);
}

repondre(404, ['error' => 'NOT_FOUND']);
