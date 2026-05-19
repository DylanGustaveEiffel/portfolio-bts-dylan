"""
Backend tests for Portfolio BTS SIO (PHP/MySQL) - Bloc 1 / E5
Uses pytest + requests against REACT_APP_BACKEND_URL.
"""
import os
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to local dev php server (the supervised "frontend" PHP server)
    BASE_URL = "http://localhost:3000"


# ---------------------------------------------------------------------------
# Health / Page rendering
# ---------------------------------------------------------------------------
class TestHomepage:
    def test_home_html_returns_200(self):
        r = requests.get(f"{BASE_URL}/", timeout=15)
        assert r.status_code == 200
        body = r.text
        # Section ids / data-testid markers present
        for tid in [
            'id="hero"',
            'id="apropos"',
            'id="realisations"',
            'id="competences"',
            'id="veille"',
            'id="contact"',
            'data-testid="hero-title"',
            'data-testid="apropos-title"',
            'data-testid="realisations-title"',
            'data-testid="competences-title"',
            'data-testid="veille-title"',
            'data-testid="contact-title"',
            'data-testid="toggle-edit-mode"',
            'data-testid="skip-link"',
            'data-testid="edit-panel"',
        ]:
            assert tid in body, f"missing marker: {tid}"


# ---------------------------------------------------------------------------
# Read-only endpoints
# ---------------------------------------------------------------------------
class TestReadOnly:
    def test_get_data_structure(self):
        r = requests.get(f"{BASE_URL}/api/data", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "sections" in data and "competences" in data and "realisations" in data
        assert len(data["sections"]) == 6
        codes = sorted(c["code"] for c in data["competences"])
        assert codes == ["C1.1", "C1.2", "C1.3", "C1.4", "C1.5", "C1.6"]

    def test_get_competences(self):
        r = requests.get(f"{BASE_URL}/api/competences", timeout=15)
        assert r.status_code == 200
        comps = r.json()
        assert isinstance(comps, list)
        assert len(comps) == 6


# ---------------------------------------------------------------------------
# Sections / Contenus
# ---------------------------------------------------------------------------
class TestSectionsContenus:
    def test_update_section_persists(self):
        # find hero section id
        data = requests.get(f"{BASE_URL}/api/data", timeout=15).json()
        hero = next(s for s in data["sections"] if s["code"] == "hero")
        original_title = hero["titre"]
        original_sub = hero["sous_titre"]
        new_title = "TEST_Hero_Title"
        new_sub = "TEST_Hero_Subtitle"
        r = requests.post(
            f"{BASE_URL}/api/sections/{hero['id']}",
            json={"titre": new_title, "sous_titre": new_sub},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True
        # verify via /api/data
        data2 = requests.get(f"{BASE_URL}/api/data", timeout=15).json()
        hero2 = next(s for s in data2["sections"] if s["code"] == "hero")
        assert hero2["titre"] == new_title
        assert hero2["sous_titre"] == new_sub
        # restore
        requests.post(
            f"{BASE_URL}/api/sections/{hero['id']}",
            json={"titre": original_title, "sous_titre": original_sub},
            timeout=15,
        )

    def test_upsert_contenu(self):
        data = requests.get(f"{BASE_URL}/api/data", timeout=15).json()
        apropos = next(s for s in data["sections"] if s["code"] == "apropos")
        payload = {
            "section_id": apropos["id"],
            "cle": "TEST_pytest_key",
            "valeur": "TEST_valeur_initiale",
            "type": "texte",
        }
        r = requests.post(f"{BASE_URL}/api/contenus", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True
        # update same key (upsert)
        payload["valeur"] = "TEST_valeur_modifiee"
        r2 = requests.post(f"{BASE_URL}/api/contenus", json=payload, timeout=15)
        assert r2.status_code == 200
        # verify via /api/data.contenus (if exposed) or section_contenus
        data2 = requests.get(f"{BASE_URL}/api/data", timeout=15).json()
        # Heuristic search: serialized text appears somewhere
        raw = str(data2)
        assert "TEST_valeur_modifiee" in raw


# ---------------------------------------------------------------------------
# Realisations full CRUD + cascade + competences + preuves
# ---------------------------------------------------------------------------
@pytest.fixture(scope="module")
def created_realisation():
    payload = {
        "titre": "TEST_Realisation_Pytest",
        "contexte": "Contexte de test",
        "description": "Desc test",
        "technologies": "PHP, MySQL",
        "lien": "https://example.com",
        "date_realisation": "2025-09-01",
    }
    r = requests.post(f"{BASE_URL}/api/realisations", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True
    assert "id" in body
    rid = body["id"]
    yield rid
    # cleanup
    requests.delete(f"{BASE_URL}/api/realisations/{rid}", timeout=15)


class TestRealisations:
    def test_create(self, created_realisation):
        assert isinstance(created_realisation, int)

    def test_update(self, created_realisation):
        rid = created_realisation
        upd = {
            "titre": "TEST_Realisation_Modifiee",
            "contexte": "Nouveau ctx",
            "description": "Nouvelle desc",
            "technologies": "PHP",
            "lien": "https://updated.example.com",
            "date_realisation": "2025-10-15",
        }
        r = requests.post(f"{BASE_URL}/api/realisations/{rid}", json=upd, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True
        # verify
        data = requests.get(f"{BASE_URL}/api/data", timeout=15).json()
        real = next((x for x in data["realisations"] if x["id"] == rid), None)
        assert real is not None
        assert real["titre"] == "TEST_Realisation_Modifiee"
        assert real["technologies"] == "PHP"

    def test_link_competence_and_unlink(self, created_realisation):
        rid = created_realisation
        comps = requests.get(f"{BASE_URL}/api/competences", timeout=15).json()
        cid = comps[0]["id"]
        r = requests.post(
            f"{BASE_URL}/api/realisations/{rid}/competence",
            json={"competence_id": cid, "justification": "TEST_justif"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True
        # verify linked
        data = requests.get(f"{BASE_URL}/api/data", timeout=15).json()
        real = next(x for x in data["realisations"] if x["id"] == rid)
        linked_ids = [c["id"] for c in real.get("competences", [])]
        assert cid in linked_ids
        # unlink
        r2 = requests.delete(
            f"{BASE_URL}/api/realisations/{rid}/competence/{cid}", timeout=15
        )
        assert r2.status_code == 200
        data2 = requests.get(f"{BASE_URL}/api/data", timeout=15).json()
        real2 = next(x for x in data2["realisations"] if x["id"] == rid)
        linked_ids2 = [c["id"] for c in real2.get("competences", [])]
        assert cid not in linked_ids2

    def test_upload_preuve_and_serve(self, created_realisation):
        rid = created_realisation
        # 1x1 PNG
        png = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00"
            b"\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        files = {"fichier": ("TEST_proof.png", io.BytesIO(png), "image/png")}
        r = requests.post(
            f"{BASE_URL}/api/realisations/{rid}/preuve", files=files, timeout=20
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True
        # path returned
        path = body.get("chemin") or body.get("path") or body.get("fichier")
        assert path is not None, f"no chemin in response: {body}"
        assert "uploads" in path or path.startswith("uploads") or path.startswith("/uploads")
        # served via /uploads/<name>
        fname = path.split("/")[-1]
        r2 = requests.get(f"{BASE_URL}/uploads/{fname}", timeout=15)
        assert r2.status_code == 200
        assert r2.content[:4] == b"\x89PNG"
        # Find preuve id via /api/data
        data = requests.get(f"{BASE_URL}/api/data", timeout=15).json()
        real = next(x for x in data["realisations"] if x["id"] == rid)
        preuves = real.get("preuves", [])
        assert len(preuves) >= 1
        pid = preuves[0]["id"]
        # delete preuve
        r3 = requests.delete(f"{BASE_URL}/api/preuves/{pid}", timeout=15)
        assert r3.status_code == 200
        assert r3.json().get("ok") is True
        # file removed from disk (note: router falls back to index.php so 200
        # is still returned with HTML; we verify the binary PNG is no longer served)
        r4 = requests.get(f"{BASE_URL}/uploads/{fname}", timeout=15)
        assert r4.content[:4] != b"\x89PNG", "preuve file was not removed from disk"

    def test_delete_cascade(self):
        # create new realisation, link competence + preuve, delete realisation,
        # verify everything gone
        r = requests.post(
            f"{BASE_URL}/api/realisations",
            json={"titre": "TEST_Cascade", "description": "x"},
            timeout=15,
        )
        rid = r.json()["id"]
        cid = requests.get(f"{BASE_URL}/api/competences").json()[0]["id"]
        requests.post(
            f"{BASE_URL}/api/realisations/{rid}/competence",
            json={"competence_id": cid, "justification": "j"},
        )
        png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
        requests.post(
            f"{BASE_URL}/api/realisations/{rid}/preuve",
            files={"fichier": ("TEST_cascade.png", io.BytesIO(png), "image/png")},
        )
        rd = requests.delete(f"{BASE_URL}/api/realisations/{rid}", timeout=15)
        assert rd.status_code == 200
        data = requests.get(f"{BASE_URL}/api/data", timeout=15).json()
        assert not any(x["id"] == rid for x in data["realisations"])
