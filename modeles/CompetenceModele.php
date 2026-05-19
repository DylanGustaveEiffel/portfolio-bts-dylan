<?php
/**
 * modeles/CompetenceModele.php
 * ---------------------------------------------------------------------------
 * Modèle des compétences du Bloc 1 (référentiel officiel E5).
 * Enrichi avec :
 *  - sous-compétences (puces du référentiel)
 *  - indicateurs de performance (critères d'évaluation officiels)
 * ---------------------------------------------------------------------------
 */
class CompetenceModele {
    private PDO $db;
    public function __construct() { $this->db = getPDO(); }

    public function toutes(): array {
        $comps = $this->db->query("SELECT * FROM competences ORDER BY code ASC")->fetchAll();
        // Enrichissement
        foreach ($comps as &$c) {
            $c['sous_competences'] = $this->sousCompetencesDe((int)$c['id']);
            $c['indicateurs']      = $this->indicateursDe((int)$c['id']);
        }
        return $comps;
    }

    private function sousCompetencesDe(int $compId): array {
        $stmt = $this->db->prepare(
            "SELECT id, libelle FROM sous_competences WHERE competence_id = ? ORDER BY ordre, id"
        );
        $stmt->execute([$compId]);
        return $stmt->fetchAll();
    }

    private function indicateursDe(int $compId): array {
        $stmt = $this->db->prepare(
            "SELECT id, libelle FROM indicateurs_performance WHERE competence_id = ? ORDER BY ordre, id"
        );
        $stmt->execute([$compId]);
        return $stmt->fetchAll();
    }
}
