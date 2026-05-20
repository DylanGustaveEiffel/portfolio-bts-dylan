<?php
/**
 * modeles/SectionModele.php
 * ---------------------------------------------------------------------------
 * Modèle CRUD pour les sections du portfolio.
 *
 * Le MODÈLE est la seule couche qui parle à la base de données.
 * Le contrôleur ne fait JAMAIS de SQL directement -> séparation propre.
 * ---------------------------------------------------------------------------
 */
class SectionModele {
    private PDO $db;

    public function __construct() { $this->db = getPDO(); }

    /** Récupère toutes les sections visibles, triées. */
    public function toutes(): array {
        $stmt = $this->db->query(
            "SELECT * FROM sections WHERE visible = 1 ORDER BY ordre ASC, id ASC"
        );
        return $stmt->fetchAll();
    }

    /** Trouve une section par son code logique (ex: 'hero'). */
    public function parCode(string $code): ?array {
        $stmt = $this->db->prepare("SELECT * FROM sections WHERE code = ?");
        $stmt->execute([$code]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /** Met à jour titre/sous-titre via l'éditeur. Requête préparée = sécurité. */
    public function modifier(int $id, string $titre, string $sousTitre): bool {
        $stmt = $this->db->prepare(
            "UPDATE sections SET titre = :t, sous_titre = :st WHERE id = :id"
        );
        return $stmt->execute([':t' => $titre, ':st' => $sousTitre, ':id' => $id]);
    }
}
