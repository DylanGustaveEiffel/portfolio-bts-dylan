<?php
/**
 * modeles/AttestationModele.php
 * ---------------------------------------------------------------------------
 * Gestion des attestations de stage (1ère et 2ème année).
 * Le fichier physique (PDF en général) est stocké sous /uploads/attestations.
 * ---------------------------------------------------------------------------
 */
class AttestationModele {
    private PDO $db;
    public function __construct() { $this->db = getPDO(); }

    public function toutes(): array {
        return $this->db->query(
            "SELECT * FROM attestations ORDER BY annee ASC, date_ajout DESC"
        )->fetchAll();
    }

    public function ajouter(string $annee, array $d): int {
        if (!in_array($annee, ['annee1','annee2'], true)) $annee = 'annee1';
        $sql = "INSERT INTO attestations (annee, titre, organisme, periode_debut, periode_fin, fichier, type_mime)
                VALUES (:a, :t, :o, :pd, :pf, :f, :m)";
        $this->db->prepare($sql)->execute([
            ':a'  => $annee,
            ':t'  => (string)($d['titre'] ?? ''),
            ':o'  => (string)($d['organisme'] ?? ''),
            ':pd' => !empty($d['periode_debut']) ? $d['periode_debut'] : null,
            ':pf' => !empty($d['periode_fin'])   ? $d['periode_fin']   : null,
            ':f'  => (string)($d['fichier'] ?? ''),
            ':m'  => (string)($d['type_mime'] ?? ''),
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function supprimer(int $id): bool {
        $stmt = $this->db->prepare("SELECT fichier FROM attestations WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if ($row && !empty($row['fichier'])) {
            $p = dirname(__DIR__) . '/' . ltrim($row['fichier'], '/');
            if (is_file($p)) @unlink($p);
        }
        return $this->db->prepare("DELETE FROM attestations WHERE id = ?")->execute([$id]);
    }
}
