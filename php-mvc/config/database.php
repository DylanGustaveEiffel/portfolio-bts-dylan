<?php
/**
 * config/database.php
 * ---------------------------------------------------------------------------
 * Connexion sécurisée à MySQL/MariaDB via PDO.
 *
 * POURQUOI PDO ?
 *  - PDO est une couche d'abstraction qui permet d'utiliser des "requêtes
 *    préparées". Ces requêtes empêchent les injections SQL (sécurité++).
 *  - Au programme du BTS SIO !
 *
 * AVANT / APRÈS
 *  - AVANT : on aurait pu utiliser mysqli_query avec des chaînes concaténées
 *            -> dangereux (injection SQL).
 *  - APRÈS : PDO + prepare()/execute() -> sécurisé et propre.
 * ---------------------------------------------------------------------------
 */

// Paramètres (idéalement à mettre dans un .env — ici en clair pour la lisibilité pédagogique)
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'portfolio_btssio');
define('DB_USER', 'portfolio');
define('DB_PASS', 'portfolio_pwd_2026');
define('DB_CHARSET', 'utf8mb4');

/**
 * Retourne une instance PDO unique (pattern Singleton simplifié).
 * On évite ainsi d'ouvrir plusieurs connexions par requête HTTP.
 */
function getPDO(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // erreurs -> exceptions
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,        // tableaux associatifs
            PDO::ATTR_EMULATE_PREPARES   => false,                    // vraies requêtes préparées
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // En production : logger ; ici on coupe proprement
            http_response_code(500);
            die('Erreur de connexion à la base : ' . htmlspecialchars($e->getMessage()));
        }
    }
    return $pdo;
}
