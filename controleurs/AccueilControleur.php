<?php
/**
 * controleurs/AccueilControleur.php
 * ---------------------------------------------------------------------------
 * Contrôleur de la page d'accueil (page unique du portfolio).
 *
 * Récupère les données via les MODÈLES, puis charge la VUE principale.
 * On suit ainsi strictement le pattern MVC du référentiel BTS SIO.
 * ---------------------------------------------------------------------------
 */
require_once ROOT . '/modeles/SectionModele.php';
require_once ROOT . '/modeles/ContenuModele.php';
require_once ROOT . '/modeles/RealisationModele.php';
require_once ROOT . '/modeles/CompetenceModele.php';

class AccueilControleur {
    public function index(): void {
        // 1) On interroge les modèles
        $sections     = (new SectionModele())->toutes();
        $contenuMod   = new ContenuModele();
        $realisations = (new RealisationModele())->toutes();
        $competences  = (new CompetenceModele())->toutes();

        // 2) On prépare une map [code_section => contenus] pour la vue
        $contenusParSection = [];
        foreach ($sections as $s) {
            $contenusParSection[$s['code']] = $contenuMod->parSection((int)$s['id']);
        }

        // 3) On charge la vue (qui pourra utiliser ces variables)
        require ROOT . '/vues/accueil.php';
    }
}
