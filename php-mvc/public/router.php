<?php
/**
 * public/router.php
 * ---------------------------------------------------------------------------
 * Routeur unique du portfolio (utilisé par le serveur PHP intégré).
 *
 * RÔLE :
 *  - Sert les fichiers statiques (css, js, images, uploads) directement.
 *  - Sinon, redirige tout vers index.php (Front Controller du modèle MVC).
 *
 * AVANT : plusieurs fichiers PHP (accueil.php, contact.php, ...) -> dispersé.
 * APRÈS : un seul point d'entrée (index.php) -> propre, MVC.
 * ---------------------------------------------------------------------------
 */
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1) Fichiers statiques existants : on laisse PHP les servir tels quels
$publicFile = __DIR__ . $uri;
if ($uri !== '/' && file_exists($publicFile) && !is_dir($publicFile)) {
    return false; // -> servi directement
}

// 2) Dossiers /css, /js, /uploads à la racine du projet
foreach (['/css', '/js', '/uploads'] as $prefix) {
    if (strpos($uri, $prefix . '/') === 0) {
        $file = dirname(__DIR__) . $uri;
        if (file_exists($file) && !is_dir($file)) {
            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            $mimes = [
                'css' => 'text/css', 'js' => 'application/javascript',
                'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
                'gif' => 'image/gif', 'svg' => 'image/svg+xml', 'webp' => 'image/webp',
                'pdf' => 'application/pdf',
            ];
            if (isset($mimes[$ext])) header('Content-Type: ' . $mimes[$ext]);
            readfile($file);
            return true;
        }
    }
}

// 3) Tout le reste -> Front Controller
require_once __DIR__ . '/index.php';
