<?php
/**
 * modeles/CompetenceModele.php
 * ---------------------------------------------------------------------------
 * Modèle simple pour les compétences du Bloc 1 (référentiel BTS SIO).
 * Pas de création/suppression côté éditeur : les compétences sont officielles.
 * ---------------------------------------------------------------------------
 */
class CompetenceModele {
    private PDO $db;
    public function __construct() { $this->db = getPDO(); }

    public function toutes(): array {
        $stmt = $this->db->query("SELECT * FROM competences ORDER BY code ASC");
        return $stmt->fetchAll();
    }
}
