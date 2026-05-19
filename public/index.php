<?php
/**
 * public/index.php
 * ---------------------------------------------------------------------------
 * FRONT CONTROLLER — point d'entrée unique de l'application MVC.
 *
 * ARCHITECTURE MVC (Modèle-Vue-Contrôleur)
 *  - MODÈLE      : interaction avec la base (/modeles)
 *  - VUE         : affichage HTML (/vues)
 *  - CONTRÔLEUR  : reçoit la requête, appelle modèle puis vue (/controleurs)
 *
 * POURQUOI ? Séparer les rôles facilite la lecture, la maintenance et les
 * évolutions. C'est attendu en BTS SIO (oral E5).
 *
 * ROUTING SIMPLE :
 *   /              -> ContrôleurAccueil::index
 *   /api/...       -> Contrôleurs API (JSON) pour l'éditeur visuel
 *   autre          -> 404
 * ---------------------------------------------------------------------------
 */

// Sécurité de base : en-têtes
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Autoload "à la main" : on inclura les classes au besoin
define('ROOT', dirname(__DIR__));
require_once ROOT . '/config/database.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

try {
    // -----------------------------------------------------------------------
    // ROUTES API (JSON) — utilisées par l'éditeur visuel en JavaScript
    // -----------------------------------------------------------------------
    if (strpos($uri, '/api/') === 0) {
        require_once ROOT . '/controleurs/ApiControleur.php';
        $api = new ApiControleur();
        $api->dispatch($uri, $method);
        exit;
    }

    // -----------------------------------------------------------------------
    // PAGE PRINCIPALE (single page) — tout le portfolio est sur une page
    // -----------------------------------------------------------------------
    require_once ROOT . '/controleurs/AccueilControleur.php';
    $ctrl = new AccueilControleur();
    $ctrl->index();
} catch (Throwable $e) {
    http_response_code(500);
    echo '<h1>Erreur serveur</h1><pre>' . htmlspecialchars($e->getMessage()) . '</pre>';
}
