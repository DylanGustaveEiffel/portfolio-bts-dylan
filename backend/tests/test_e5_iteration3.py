"""
Tests pytest for ITERATION 3 — Conformité E5 (profil, attestations, nouveaux
champs réalisations, sous-compétences/indicateurs).
Tous les appels passent par REACT_APP_BACKEND_URL (proxy FastAPI -> PHP).
"""
import io
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL doit être défini"


# ---------------------------------------------------------------------------
# Profil candidat (GET / POST upsert)
# ---------------------------------------------------------------------------
class TestProfil:
    def test_get_profil_structure(self):
        r = requests.get(f"{BASE_URL}/api/profil", timeout=15)
        assert r.status_code == 200, r.text
        p = r.json()
        assert isinstance(p, dict)
        for key in ("id", "nom", "prenom", "numero_candidat",
                    "session", "option_sio", "etablissement"):
            assert key in p, f"clé manquante: {key}"

    def test_post_profil_persists(self):
        original = requests.get(f"{BASE_URL}/api/profil", timeout=15).json()
        payload = {
            "nom": "TEST_Nom",
            "prenom": "TEST_Prenom",
            "numero_candidat": "TEST_12345",
            "session": "2026",
            "option_sio": "SLAM",
            "etablissement": "TEST_Lycée X",
        }
        r = requests.post(f"{BASE_URL}/api/profil", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True
        # vérif via GET
        p2 = requests.get(f"{BASE_URL}/api/profil", timeout=15).json()
        for k, v in payload.items():
            assert p2[k] == v, f"{k} non persisté: {p2[k]} != {v}"
        # restore
        restore = {k: original.get(k, "") for k in payload.keys()}
        requests.post(f"{BASE_URL}/api/profil", json=restore, timeout=15)


# ---------------------------------------------------------------------------
# Attestations de stage
# ---------------------------------------------------------------------------
class TestAttestations:
    def test_get_attestations_returns_list(self):
        r = requests.get(f"{BASE_URL}/api/attestations", timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert isinstance(body, (list, dict))

    def test_upload_and_delete_attestation_annee1(self):
        # PNG minimal valide
        png = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00"
            b"\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        files = {"fichier": ("TEST_att1.png", io.BytesIO(png), "image/png")}
        data = {
            "titre": "TEST_Attestation_Année1",
            "organisme": "TEST_Entreprise X",
            "periode_debut": "2025-01-06",
            "periode_fin": "2025-02-14",
        }
        r = requests.post(
            f"{BASE_URL}/api/attestations/annee1",
            files=files, data=data, timeout=20,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True
        assert "id" in body
        att_id = body["id"]

        # vérif présence dans la liste + chemin fichier accessible
        liste = requests.get(f"{BASE_URL}/api/attestations", timeout=15).json()
        # Liste peut être plate ou groupée par année
        flat = liste if isinstance(liste, list) else (
            (liste.get("annee1") or []) + (liste.get("annee2") or [])
        )
        found = next((a for a in flat if a.get("id") == att_id), None)
        assert found is not None, f"attestation {att_id} introuvable: {liste}"
        fichier = found.get("fichier") or found.get("chemin") or ""
        assert "uploads/attestations" in fichier, f"chemin invalide: {fichier}"

        # accessible via URL publique
        url_fichier = f"{BASE_URL}/{fichier.lstrip('/')}"
        r2 = requests.get(url_fichier, timeout=15)
        assert r2.status_code == 200, f"fichier non servi: {url_fichier} -> {r2.status_code}"
        assert r2.content[:4] == b"\x89PNG"

        # DELETE
        r3 = requests.delete(f"{BASE_URL}/api/attestations/{att_id}", timeout=15)
        assert r3.status_code == 200
        assert r3.json().get("ok") is True
        # fichier supprimé
        r4 = requests.get(url_fichier, timeout=15)
        assert r4.content[:4] != b"\x89PNG", "fichier attestation non supprimé"


# ---------------------------------------------------------------------------
# Compétences enrichies : sous_competences + indicateurs
# ---------------------------------------------------------------------------
class TestCompetencesEnrichies:
    EXPECTED_SOUS = {"C1.1": 6, "C1.2": 3, "C1.3": 3, "C1.4": 3, "C1.5": 3, "C1.6": 4}
    EXPECTED_IND = {"C1.1": 7, "C1.2": 8, "C1.3": 5, "C1.4": 8, "C1.5": 6, "C1.6": 4}

    def test_data_includes_sous_competences_and_indicateurs(self):
        r = requests.get(f"{BASE_URL}/api/data", timeout=15)
        assert r.status_code == 200
        comps = r.json().get("competences", [])
        by_code = {c["code"]: c for c in comps}
        for code, n in self.EXPECTED_SOUS.items():
            assert code in by_code, f"compétence {code} absente"
            sc = by_code[code].get("sous_competences") or []
            assert len(sc) == n, f"{code}: attendu {n} sous-compétences, reçu {len(sc)}"
        for code, n in self.EXPECTED_IND.items():
            ind = by_code[code].get("indicateurs") or []
            assert len(ind) == n, f"{code}: attendu {n} indicateurs, reçu {len(ind)}"

    def test_data_includes_profil_and_attestations(self):
        r = requests.get(f"{BASE_URL}/api/data", timeout=15)
        body = r.json()
        assert "profil" in body
        assert "attestations" in body


# ---------------------------------------------------------------------------
# Réalisations enrichies : categorie / periode / contribution / travail_equipe
# ---------------------------------------------------------------------------
@pytest.fixture
def realisation_id():
    payload = {
        "titre": "TEST_Real_E5_Iter3",
        "categorie": "pro_annee1",
        "periode_debut": "2025-09-01",
        "periode_fin": "2025-12-15",
        "contribution_personnelle": "Mise en place GLPI",
        "travail_equipe": 1,
        "description": "test desc",
    }
    r = requests.post(f"{BASE_URL}/api/realisations", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    rid = r.json()["id"]
    yield rid
    requests.delete(f"{BASE_URL}/api/realisations/{rid}", timeout=15)


class TestRealisationsE5:
    def test_create_with_new_fields_persists(self, realisation_id):
        rid = realisation_id
        data = requests.get(f"{BASE_URL}/api/data", timeout=15).json()
        real = next((x for x in data["realisations"] if x["id"] == rid), None)
        assert real is not None
        assert real.get("categorie") == "pro_annee1"
        assert str(real.get("periode_debut", ""))[:10] == "2025-09-01"
        assert str(real.get("periode_fin", ""))[:10] == "2025-12-15"
        assert "GLPI" in (real.get("contribution_personnelle") or "")
        # travail_equipe peut être 1/True
        te = real.get("travail_equipe")
        assert te in (1, True, "1") or bool(te)

    def test_update_new_fields(self, realisation_id):
        rid = realisation_id
        upd = {
            "titre": "TEST_Real_E5_Modifiee",
            "categorie": "pro_annee2",
            "periode_debut": "2024-05-01",
            "periode_fin": "2024-06-30",
            "contribution_personnelle": "Refonte personnelle",
            "travail_equipe": 0,
            "description": "x",
        }
        r = requests.post(f"{BASE_URL}/api/realisations/{rid}", json=upd, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True
        data = requests.get(f"{BASE_URL}/api/data", timeout=15).json()
        real = next(x for x in data["realisations"] if x["id"] == rid)
        assert real["categorie"] == "pro_annee2"
        assert str(real["periode_debut"])[:10] == "2024-05-01"
        assert "Refonte" in (real.get("contribution_personnelle") or "")
