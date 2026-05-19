<?php
/**
 * modeles/ContenuModele.php
 * ---------------------------------------------------------------------------
 * Gère les "blocs de contenu" rattachés à une section.
 * Un contenu = un couple (clé, valeur) -> facile à éditer dynamiquement.
 * ---------------------------------------------------------------------------
 */
class ContenuModele {
    private PDO $db;
    public function __construct() { $this->db = getPDO(); }

    /** Récupère tous les contenus d'une section sous forme [cle => valeur]. */
    public function parSection(int $sectionId): array {
        $stmt = $this->db->prepare("SELECT cle, valeur, type FROM contenus WHERE section_id = ?");
        $stmt->execute([$sectionId]);
        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $out[$row['cle']] = $row;
        }
        return $out;
    }

    /**
     * Enregistre (insert ou update) un contenu.
     * "ON DUPLICATE KEY UPDATE" est une syntaxe MySQL/MariaDB pratique
     * pour faire un "upsert" en une seule requête préparée.
     */
    public function enregistrer(int $sectionId, string $cle, string $valeur, string $type = 'texte'): bool {
        $sql = "INSERT INTO contenus (section_id, cle, valeur, type)
                VALUES (:sid, :cle, :val, :type)
                ON DUPLICATE KEY UPDATE valeur = VALUES(valeur), type = VALUES(type)";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':sid' => $sectionId, ':cle' => $cle,
            ':val' => $valeur, ':type' => $type,
        ]);
    }
}
