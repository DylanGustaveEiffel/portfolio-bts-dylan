<?php
/**
 * modeles/ProfilModele.php
 * ---------------------------------------------------------------------------
 * Profil du candidat (NOM, prénom, n° candidat, SESSION, option SISR/SLAM).
 * Un seul enregistrement (id=1).
 * ---------------------------------------------------------------------------
 */
class ProfilModele {
    private PDO $db;
    public function __construct() { $this->db = getPDO(); }

    public function get(): array {
        $stmt = $this->db->query("SELECT * FROM profil_candidat WHERE id = 1");
        $row = $stmt->fetch();
        return $row ?: [
            'id' => 1, 'nom' => '', 'prenom' => '', 'numero_candidat' => '',
            'session' => '', 'option_sio' => '', 'etablissement' => '',
        ];
    }

    public function modifier(array $d): bool {
        $sql = "UPDATE profil_candidat
                SET nom = :n, prenom = :p, numero_candidat = :nc, session = :s,
                    option_sio = :opt, etablissement = :e
                WHERE id = 1";
        $opt = in_array(($d['option_sio'] ?? ''), ['SISR','SLAM',''], true) ? $d['option_sio'] : '';
        return $this->db->prepare($sql)->execute([
            ':n'  => (string)($d['nom'] ?? ''),
            ':p'  => (string)($d['prenom'] ?? ''),
            ':nc' => (string)($d['numero_candidat'] ?? ''),
            ':s'  => (string)($d['session'] ?? ''),
            ':opt'=> $opt,
            ':e'  => (string)($d['etablissement'] ?? ''),
        ]);
    }
}
