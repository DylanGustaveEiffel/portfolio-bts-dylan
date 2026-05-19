<?php
/**
 * controleurs/ApiControleur.php
 * ---------------------------------------------------------------------------
 * Contrôleur API JSON utilisé par l'éditeur visuel (JavaScript côté navigateur).
 *
 * Routes :
 *   GET    /api/data                          -> toutes les données du portfolio
 *   GET    /api/competences                   -> liste des compétences Bloc 1
 *   POST   /api/sections/{id}                 -> modifie titre/sous-titre
 *   POST   /api/contenus                      -> upsert d'un contenu (clé/valeur)
 *   POST   /api/realisations                  -> crée une réalisation vide
 *   POST   /api/realisations/{id}             -> modifie une réalisation
 *   DELETE /api/realisations/{id}             -> supprime une réalisation
 *   POST   /api/realisations/{id}/competence  -> lie une compétence + justification
 *   DELETE /api/realisations/{id}/competence/{cid} -> délie une compétence
 *   POST   /api/realisations/{id}/preuve      -> upload d'une preuve (multipart)
 *   DELETE /api/preuves/{id}                  -> supprime une preuve
 *
 * Sécurité : pas d'authentification (choix utilisateur), MAIS requêtes
 * préparées partout via PDO -> pas d'injection SQL possible.
 * ---------------------------------------------------------------------------
 */
require_once ROOT . '/modeles/SectionModele.php';
require_once ROOT . '/modeles/ContenuModele.php';
require_once ROOT . '/modeles/RealisationModele.php';
require_once ROOT . '/modeles/CompetenceModele.php';
require_once ROOT . '/modeles/PreuveModele.php';
require_once ROOT . '/modeles/ProfilModele.php';
require_once ROOT . '/modeles/AttestationModele.php';

class ApiControleur {

    private function json($data, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    private function body(): array {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        return is_array($data) ? $data : $_POST;
    }

    public function dispatch(string $uri, string $method): void {
        // ---- Routes simples ---------------------------------------------------
        if ($uri === '/api/data' && $method === 'GET')        { $this->getData(); return; }
        if ($uri === '/api/competences' && $method === 'GET') { $this->getCompetences(); return; }
        if ($uri === '/api/realisations' && $method === 'POST') { $this->creerRealisation(); return; }
        if ($uri === '/api/contenus' && $method === 'POST')   { $this->upsertContenu(); return; }

        // ---- Routes paramétrées -----------------------------------------------
        if (preg_match('#^/api/sections/(\d+)$#', $uri, $m) && $method === 'POST') {
            $this->modifierSection((int)$m[1]); return;
        }

        if (preg_match('#^/api/realisations/(\d+)$#', $uri, $m)) {
            if ($method === 'POST')   { $this->modifierRealisation((int)$m[1]); return; }
            if ($method === 'DELETE') { $this->supprimerRealisation((int)$m[1]); return; }
        }

        if (preg_match('#^/api/realisations/(\d+)/competence$#', $uri, $m) && $method === 'POST') {
            $this->lierCompetence((int)$m[1]); return;
        }

        if (preg_match('#^/api/realisations/(\d+)/competence/(\d+)$#', $uri, $m) && $method === 'DELETE') {
            $this->delierCompetence((int)$m[1], (int)$m[2]); return;
        }

        if (preg_match('#^/api/realisations/(\d+)/preuve$#', $uri, $m) && $method === 'POST') {
            $this->uploadPreuve((int)$m[1]); return;
        }

        if (preg_match('#^/api/preuves/(\d+)$#', $uri, $m) && $method === 'DELETE') {
            $this->supprimerPreuve((int)$m[1]); return;
        }

        // ---- Profil candidat -------------------------------------------------
        if ($uri === '/api/profil' && $method === 'GET')  { $this->json((new ProfilModele())->get()); return; }
        if ($uri === '/api/profil' && $method === 'POST') {
            $ok = (new ProfilModele())->modifier($this->body());
            $this->json(['ok' => $ok]); return;
        }

        // ---- Attestations de stage ------------------------------------------
        if ($uri === '/api/attestations' && $method === 'GET') {
            $this->json((new AttestationModele())->toutes()); return;
        }
        if (preg_match('#^/api/attestations/(annee1|annee2)$#', $uri, $m) && $method === 'POST') {
            $this->uploadAttestation($m[1]); return;
        }
        if (preg_match('#^/api/attestations/(\d+)$#', $uri, $m) && $method === 'DELETE') {
            $this->json(['ok' => (new AttestationModele())->supprimer((int)$m[1])]); return;
        }

        $this->json(['erreur' => 'Route inconnue', 'uri' => $uri, 'methode' => $method], 404);
    }

    // -------------------------------------------------------------------------
    private function getData(): void {
        $sections     = (new SectionModele())->toutes();
        $contenuMod   = new ContenuModele();
        $realisations = (new RealisationModele())->toutes();

        $contenusParSection = [];
        foreach ($sections as $s) {
            $contenusParSection[$s['code']] = $contenuMod->parSection((int)$s['id']);
        }
        $this->json([
            'sections'      => $sections,
            'contenus'      => $contenusParSection,
            'realisations'  => $realisations,
            'competences'   => (new CompetenceModele())->toutes(),
            'profil'        => (new ProfilModele())->get(),
            'attestations'  => (new AttestationModele())->toutes(),
        ]);
    }

    private function getCompetences(): void {
        $this->json((new CompetenceModele())->toutes());
    }

    private function modifierSection(int $id): void {
        $b = $this->body();
        $ok = (new SectionModele())->modifier($id, (string)($b['titre'] ?? ''), (string)($b['sous_titre'] ?? ''));
        $this->json(['ok' => $ok]);
    }

    private function upsertContenu(): void {
        $b = $this->body();
        $ok = (new ContenuModele())->enregistrer(
            (int)($b['section_id'] ?? 0),
            (string)($b['cle'] ?? ''),
            (string)($b['valeur'] ?? ''),
            (string)($b['type'] ?? 'texte')
        );
        $this->json(['ok' => $ok]);
    }

    private function creerRealisation(): void {
        $id = (new RealisationModele())->creer($this->body());
        $this->json(['id' => $id, 'ok' => true]);
    }

    private function modifierRealisation(int $id): void {
        $ok = (new RealisationModele())->modifier($id, $this->body());
        $this->json(['ok' => $ok]);
    }

    private function supprimerRealisation(int $id): void {
        $ok = (new RealisationModele())->supprimer($id);
        $this->json(['ok' => $ok]);
    }

    private function lierCompetence(int $realId): void {
        $b = $this->body();
        $ok = (new RealisationModele())->lierCompetence(
            $realId, (int)($b['competence_id'] ?? 0), (string)($b['justification'] ?? '')
        );
        $this->json(['ok' => $ok]);
    }

    private function delierCompetence(int $realId, int $compId): void {
        $ok = (new RealisationModele())->delierCompetence($realId, $compId);
        $this->json(['ok' => $ok]);
    }

    /**
     * Upload d'une preuve.
     * SÉCURITÉ : on vérifie la taille, le type MIME, et on renomme le fichier
     * pour éviter les noms dangereux et les écrasements.
     */
    private function uploadPreuve(int $realId): void {
        if (empty($_FILES['fichier']) || $_FILES['fichier']['error'] !== UPLOAD_ERR_OK) {
            $this->json(['erreur' => 'Fichier manquant ou en erreur'], 400);
            return;
        }
        $f = $_FILES['fichier'];
        if ($f['size'] > 10 * 1024 * 1024) { // 10 Mo max
            $this->json(['erreur' => 'Fichier trop volumineux (10 Mo max)'], 400);
            return;
        }
        $allowed = [
            'image/png', 'image/jpeg', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        $mime = mime_content_type($f['tmp_name']) ?: $f['type'];
        if (!in_array($mime, $allowed, true)) {
            $this->json(['erreur' => 'Type de fichier non autorisé : ' . $mime], 400);
            return;
        }
        $ext     = pathinfo($f['name'], PATHINFO_EXTENSION);
        $safe    = bin2hex(random_bytes(8)) . ($ext ? '.' . preg_replace('/[^a-zA-Z0-9]/', '', $ext) : '');
        $dir     = ROOT . '/uploads';
        if (!is_dir($dir)) mkdir($dir, 0775, true);
        $dest    = $dir . '/' . $safe;
        if (!move_uploaded_file($f['tmp_name'], $dest)) {
            $this->json(['erreur' => 'Impossible d\'enregistrer le fichier'], 500);
            return;
        }
        $titre = $_POST['titre'] ?? $f['name'];
        $desc  = $_POST['description'] ?? '';
        $id    = (new PreuveModele())->ajouter($realId, $titre, 'uploads/' . $safe, $mime, $desc);
        $this->json(['ok' => true, 'id' => $id, 'fichier' => 'uploads/' . $safe]);
    }

    private function supprimerPreuve(int $id): void {
        $ok = (new PreuveModele())->supprimer($id);
        $this->json(['ok' => $ok]);
    }

    /**
     * Upload d'une attestation de stage (PDF de préférence).
     * Stockée sous /uploads/attestations/.
     */
    private function uploadAttestation(string $annee): void {
        if (empty($_FILES['fichier']) || $_FILES['fichier']['error'] !== UPLOAD_ERR_OK) {
            $this->json(['erreur' => 'Fichier manquant'], 400); return;
        }
        $f = $_FILES['fichier'];
        if ($f['size'] > 10 * 1024 * 1024) {
            $this->json(['erreur' => 'Fichier trop volumineux (10 Mo max)'], 400); return;
        }
        $mime    = mime_content_type($f['tmp_name']) ?: $f['type'];
        $allowed = ['application/pdf', 'image/png', 'image/jpeg'];
        if (!in_array($mime, $allowed, true)) {
            $this->json(['erreur' => 'Format non autorisé (PDF/PNG/JPG uniquement)'], 400); return;
        }
        $dir = ROOT . '/uploads/attestations';
        if (!is_dir($dir)) mkdir($dir, 0775, true);
        $ext  = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
        $safe = $annee . '_' . bin2hex(random_bytes(6)) . '.' . preg_replace('/[^a-z0-9]/', '', $ext);
        if (!move_uploaded_file($f['tmp_name'], $dir . '/' . $safe)) {
            $this->json(['erreur' => 'Échec enregistrement'], 500); return;
        }
        $id = (new AttestationModele())->ajouter($annee, [
            'titre'         => $_POST['titre']         ?? $f['name'],
            'organisme'     => $_POST['organisme']     ?? '',
            'periode_debut' => $_POST['periode_debut'] ?? null,
            'periode_fin'   => $_POST['periode_fin']   ?? null,
            'fichier'       => 'uploads/attestations/' . $safe,
            'type_mime'     => $mime,
        ]);
        $this->json(['ok' => true, 'id' => $id]);
    }
}
