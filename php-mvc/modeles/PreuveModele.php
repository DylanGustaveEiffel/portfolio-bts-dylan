<?php
/**
 * modeles/PreuveModele.php
 * ---------------------------------------------------------------------------
 * Gère les fichiers de preuve (PDF, captures, docs) liés à une réalisation.
 * Le fichier physique est stocké sous /uploads ; on enregistre le chemin.
 * ---------------------------------------------------------------------------
 */
class PreuveModele {
    private PDO $db;
    public function __construct() { $this->db = getPDO(); }

    public function ajouter(int $realId, string $titre, string $fichier, string $mime, string $desc = ''): int {
        $sql = "INSERT INTO preuves (realisation_id, titre, fichier, type_mime, description)
                VALUES (:r, :t, :f, :m, :d)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':r' => $realId, ':t' => $titre, ':f' => $fichier, ':m' => $mime, ':d' => $desc]);
        return (int)$this->db->lastInsertId();
    }

    public function supprimer(int $id): bool {
        // On récupère d'abord le fichier pour le retirer du disque
        $stmt = $this->db->prepare("SELECT fichier FROM preuves WHERE id = ?");
        $stmt->execute([$id]);
        $p = $stmt->fetch();
        if ($p && !empty($p['fichier'])) {
            $path = dirname(__DIR__) . '/' . ltrim($p['fichier'], '/');
            if (is_file($path)) @unlink($path);
        }
        $stmt = $this->db->prepare("DELETE FROM preuves WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
