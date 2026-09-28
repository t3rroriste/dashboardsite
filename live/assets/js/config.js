/* =========================================================================
   CreateYourQueue — configuration du site
   C'est le SEUL fichier à modifier avant la mise en ligne.
   ========================================================================= */

window.CYQ_CONFIG = {

  /* --- Discord ---------------------------------------------------------
     CLIENT_ID : l'identifiant de ton application, dans le portail
     développeur Discord → ton application → General Information.
     Ce n'est PAS un secret : il apparaît de toute façon dans l'URL OAuth.
     Ne mets jamais le CLIENT_SECRET ici, il n'a rien à faire côté site.   */
  CLIENT_ID: '1521589617521070240',

  /* L'adresse de retour n'est plus construite ici : c'est le serveur qui
     la connaît, et lui seul. Il l'affiche au démarrage, c'est cette
     valeur-là qu'il faut déclarer dans le portail Discord → OAuth2 →
     Redirects. Laissée ici pour les pages servies sans API.               */
  REDIRECT_URI: window.location.origin + '/api/auth/callback',

  /* L'adresse de retour du flux SANS back-end, celui qu'utilise login.html.
     Discord renvoie le jeton dans le fragment de cette URL, et exige
     qu'elle soit déclarée AU CARACTÈRE PRÈS dans le portail développeur →
     OAuth2 → Redirects. Avec www ici, il faut www là-bas.                 */
  OAUTH_REDIRECT_URI: window.location.origin + '/login.html',

  /* Permissions demandées à l'installation du bot (somme des bits Discord).
     Par défaut : voir/écrire/gérer les salons, gérer les rôles, gérer les
     messages, connexion vocale, mentionner @everyone.
     Recalcule-les dans le portail Discord → OAuth2 → URL Generator.       */
  INVITE_PERMISSIONS: '1099780064336',

  /* --- Back-end --------------------------------------------------------
     URL de ton API. Laisse la chaîne vide tant que tu n'en as pas :
     le site fonctionne, se navigue, et affiche ses états vides réels
     au lieu d'inventer des données.
     Exemple : 'https://api.cyq.gg'                                        */
  /* VIDE, et c'est voulu : l'hébergement LWS est statique, il ne sert que
     des fichiers. Rien ne répond sous /api. Tant que cette chaîne contenait
     '/api', chaque « Se connecter » et chaque écran du panneau partaient
     sur une adresse qui renvoie 404. Vide, le site bascule sur le flux
     Discord sans back-end (login.html) et le panneau affiche ses états
     « pas d'API » au lieu d'une page d'erreur du serveur.
     Le jour où l'API de cogs/dashboard_api.py est joignable, mets son
     adresse ici : tout le site la reprend sans autre changement.          */
  API_BASE: '',

  /* --- Divers ---------------------------------------------------------- */
  SITE_NAME: 'CreateYourQueue',
  DOCS_URL: 'guide.html',
  COMMANDS_URL: '#',
  /* Invitation vers ton serveur Discord d'entraide. Alimente le lien
     « Support » de la navigation et celui du pied de page.
     Exemple : 'https://discord.gg/xxxxxxx'                                */
  SUPPORT_URL: '#',
  STATUS_URL: '#',
  PRIVACY_URL: '#',

  /* Langue de repli si celle du navigateur n'est pas gérée. */
  DEFAULT_LANG: 'fr',

  /* Thème au premier chargement : 'dark' ou 'light'. */
  DEFAULT_THEME: 'dark'
};

/* --- Réglage depuis la page ---------------------------------------------
   En ligne, on n'a pas toujours la main sur ce fichier. Le bandeau de
   l'accueil enregistre le CLIENT_ID et l'API dans le navigateur, et c'est
   ici qu'ils sont relus : avant app.js, qui lit la config une seule fois.

   Deux valeurs seulement, et aucune des deux n'est un secret. Le
   CLIENT_SECRET n'a rien à faire côté site, il n'est pas accepté ici.
   Ce qui est écrit dans ce fichier reste la valeur par défaut : effacer
   le réglage local suffit à y revenir.                                    */
(function (cfg) {
  try {
    var local = JSON.parse(localStorage.getItem('cyq:config') || '{}');
    ['CLIENT_ID', 'API_BASE'].forEach(function (k) {
      if (typeof local[k] === 'string' && local[k]) cfg[k] = local[k];
    });
  } catch (e) {
    /* stockage refusé (navigation privée, cookies bloqués) : on garde le fichier */
  }
})(window.CYQ_CONFIG);
