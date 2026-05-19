# Portfolio BTS SIO — Bloc 1 (E5)

## Original problem statement (résumé)
Portfolio PHP/MySQL en architecture MVC pour préparer l'épreuve E5 du BTS SIO.
Squelette à compléter, éditable directement depuis le site, design moderne,
responsive, accessible. Système d'édition intégré (sections, contenus,
réalisations, compétences Bloc 1, preuves uploadables).

## Stack
- PHP 8.2 (built-in server sur port 3000, lancé via `yarn start`)
- MariaDB 10.11 (supervisé)
- HTML/CSS/JS vanilla (pas de framework JS)
- Architecture MVC stricte

## Tree
```
/app
├── modeles/                  CRUD PDO
├── vues/                     Templates PHP + partials
├── controleurs/              AccueilControleur + ApiControleur (JSON)
├── css/portfolio.css         Design clair, accessible WCAG AA
├── js/editeur.js             Mode édition + panneau latéral
├── sql/schema.sql            6 tables + 6 compétences C1.1..C1.6
├── config/database.php       PDO singleton, requêtes préparées
├── public/index.php          Front Controller
├── public/router.php         Routeur du serveur intégré PHP
├── uploads/                  Fichiers de preuve
└── oral_e5.md                Prep oral E5 (plan 10 min, phrases types)
```

## DB
- Hôte 127.0.0.1, DB `portfolio_btssio`, user `portfolio` / `portfolio_pwd_2026`
- Tables : sections, contenus, realisations, competences, preuves, realisation_competence
- 6 sections squelette + 6 compétences Bloc 1 préchargées

## Implémenté (2026-02)
### Itération 1 — Base MVC
- MVC complet (modèles/vues/contrôleurs)
- API JSON CRUD
- Éditeur visuel "Mode édition" avec panneau latéral
- Accessibilité (skip link, aria-label, focus visible, contrastes WCAG AA)
- Responsive (CSS variables, media queries)

### Itération 2 — Proxy FastAPI→PHP
- FastAPI (port 8001) sert de reverse-proxy vers PHP (port 3000)
- Fix: /api/* accessible via URL publique Kubernetes

### Itération 3 — Conformité officielle E5
- **Profil candidat** (NOM, prénom, n° candidat, SESSION, option SISR/SLAM, établissement)
- **Catégorisation des réalisations** : Formation / Pro 1ère année / Pro 2ème année
- **Période** (début/fin) sur chaque réalisation, affichée en format JJ/MM/AA
- **Contribution personnelle** (critère officiel d'évaluation)
- **Travail en équipe projet** (case à cocher)
- **Tableau de synthèse** officiel : matrice compétences × réalisations (imprimable)
- **Attestations de stage** (1ère + 2ème année, upload PDF/PNG/JPG)
- **Sous-compétences** détaillées (du référentiel officiel)
- **Indicateurs de performance** officiels (38 indicateurs au total)
- `oral_e5.md` enrichi avec indicateurs officiels + critère "contribution personnelle"

## Backlog (P1/P2)
- P1: Auth admin optionnelle (toggle .env)
- P1: Export PDF complet du portfolio (impression actuelle = tableau seul)
- P2: Drag & drop pour réordonner les réalisations
- P2: Thèmes (clair/sombre)
- P2: Justification par sous-compétence (granularité fine)
