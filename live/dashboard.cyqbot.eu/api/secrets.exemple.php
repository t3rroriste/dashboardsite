<?php
/* Modèle. À copier en « secrets.php » SUR LE SERVEUR, jamais dans le dépôt.
 *
 * Le CLIENT_SECRET est un vrai secret : il ne doit exister que sur la
 * machine qui sert le site. Ce fichier-ci ne contient que des trous.
 */
return [
    // Portail développeur Discord -> ton application -> General Information
    'client_id'     => '1521589617521070240',

    // Portail -> OAuth2 -> Client Secret. À régénérer s'il a fuité.
    'client_secret' => 'A_REMPLIR',

    // Portail -> Bot -> Token. Facultatif : sans lui la connexion marche,
    // mais les menus de salons et de rôles restent vides.
    'bot_token'     => '',

    // Doit rester aligné sur INVITE_PERMISSIONS dans assets/js/config.js.
    'invite_permissions' => '1099780064336',
];
