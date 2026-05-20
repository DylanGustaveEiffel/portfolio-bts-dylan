<?php
/**
 * modeles/RealisationModele.php
 * ---------------------------------------------------------------------------
 * CRUD complet pour les réalisations (projets/stages à présenter à l'oral E5).
 *
 * Méthodes :
 *  - toutes()          : liste avec compétences associées
 *  - parId($id)        : détail
 *  - creer($data)      : ajout d'une réalisation vide
 *  - modifier($id,...) : édition via l'éditeur
 *  - supprimer($id)    : suppression (CASCADE supprime preuves & liens)
 *  - lierCompetence()  : associe compétence + justification (oral E5)
 * ---------------------------------------------------------------------------
 */
class RealisationModele {
    private PDO $db;
    public function __construct() { $this->db = getPDO(); }

    public function toutes(): array {
        $stmt = $this->db->query(
            "SELECT * FROM realisations ORDER BY ordre ASC, periode_debut DESC, id DESC"
        );
        $reals = $stmt->fetchAll();
        // On enrichit chaque réalisation avec ses compétences et preuves
        foreach ($reals as &$r) {
            $r['competences'] = $this->competencesDe((int)$r['id']);
            $r['preuves']     = $this->preuvesDe((int)$r['id']);
        }
        return $reals;
    }

    public function parId(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM realisations WHERE id = ?");
        $stmt->execute([$id]);
        $r = $stmt->fetch();
        if (!$r) return null;
        $r['competences'] = $this->competencesDe($id);
        $r['preuves']     = $this->preuvesDe($id);
        return $r;
    }

    public function creer(array $d): int {
        $catIn = $d['categorie'] ?? 'formation';
        $cat = in_array($catIn, ['formation','pro_annee1','pro_annee2'], true) ? $catIn : 'formation';
        $sql = "INSERT INTO realisations
                (titre, contexte, description, contribution_personnelle, travail_equipe,
                 technologies, lien, date_realisation, categorie, periode_debut, periode_fin)
                VALUES (:t, :c, :d, :cp, :te, :tec, :l, :dr, :cat, :pd, :pf)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':t'  => $d['titre'] ?? 'Nouvelle réalisation',
            ':c'  => $d['contexte'] ?? '',
            ':d'  => $d['description'] ?? '',
            ':cp' => $d['contribution_personnelle'] ?? '',
            ':te' => !empty($d['travail_equipe']) ? 1 : 0,
            ':tec'=> $d['technologies'] ?? '',
            ':l'  => $d['lien'] ?? '',
            ':dr' => !empty($d['date_realisation']) ? $d['date_realisation'] : null,
            ':cat'=> $cat,
            ':pd' => !empty($d['periode_debut']) ? $d['periode_debut'] : null,
            ':pf' => !empty($d['periode_fin'])   ? $d['periode_fin']   : null,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function modifier(int $id, array $d): bool {
        $catIn = $d['categorie'] ?? 'formation';
        $cat = in_array($catIn, ['formation','pro_annee1','pro_annee2'], true) ? $catIn : 'formation';
        $sql = "UPDATE realisations SET
                    titre = :t, contexte = :c, description = :d,
                    contribution_personnelle = :cp, travail_equipe = :te,
                    technologies = :tec, lien = :l, date_realisation = :dr,
                    categorie = :cat, periode_debut = :pd, periode_fin = :pf
                WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':t'  => $d['titre'] ?? '',
            ':c'  => $d['contexte'] ?? '',
            ':d'  => $d['description'] ?? '',
            ':cp' => $d['contribution_personnelle'] ?? '',
            ':te' => !empty($d['travail_equipe']) ? 1 : 0,
            ':tec'=> $d['technologies'] ?? '',
            ':l'  => $d['lien'] ?? '',
            ':dr' => !empty($d['date_realisation']) ? $d['date_realisation'] : null,
            ':cat'=> $cat,
            ':pd' => !empty($d['periode_debut']) ? $d['periode_debut'] : null,
            ':pf' => !empty($d['periode_fin'])   ? $d['periode_fin']   : null,
            ':id' => $id,
        ]);
    }

    public function supprimer(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM realisations WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function lierCompetence(int $realId, int $compId, string $justification = ''): bool {
        $sql = "INSERT INTO realisation_competence (realisation_id, competence_id, justification)
                VALUES (:r, :c, :j)
                ON DUPLICATE KEY UPDATE justification = VALUES(justification)";
        return $this->db->prepare($sql)->execute([':r' => $realId, ':c' => $compId, ':j' => $justification]);
    }

    public function delierCompetence(int $realId, int $compId): bool {
        $stmt = $this->db->prepare(
            "DELETE FROM realisation_competence WHERE realisation_id = ? AND competence_id = ?"
        );
        return $stmt->execute([$realId, $compId]);
    }

    /** Compétences associées à une réalisation (avec libellé pour l'affichage). */
    private function competencesDe(int $realId): array {
        $sql = "SELECT c.id, c.code, c.libelle, rc.justification
                FROM realisation_competence rc
                JOIN competences c ON c.id = rc.competence_id
                WHERE rc.realisation_id = ?
                ORDER BY c.code";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$realId]);
        return $stmt->fetchAll();
    }

    private function preuvesDe(int $realId): array {
        $stmt = $this->db->prepare(
            "SELECT id, titre, fichier, type_mime, description, date_ajout
             FROM preuves WHERE realisation_id = ? ORDER BY date_ajout DESC"
        );
        $stmt->execute([$realId]);
        return $stmt->fetchAll();
    }
}
