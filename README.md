# Portfolio BTS SIO — Bloc 1 (Épreuve E5)

Portfolio en **PHP / MySQL** suivant une architecture **MVC** simple, conçue
pour un niveau BTS SIO. Toutes les sections sont éditables directement depuis
le site, sans toucher au code.

## Structure du projet (MVC)

```
/app
├── modeles/          # Classes qui parlent à la base (CRUD)
├── vues/             # Templates HTML (PHP)
│   └── partials/     # header.php, footer.php
├── controleurs/      # Reçoivent la requête, appellent modèles puis vues
├── css/              # Feuille de style portfolio.css
├── js/               # editeur.js (mode édition)
├── sql/              # schema.sql (création de la base)
├── config/           # database.php (connexion PDO)
├── public/           # Point d'entrée : index.php + router.php
├── uploads/          # Preuves uploadées (PDF, images…)
└── oral_e5.md        # Préparation de l'oral
```

## Démarrer en local

1. Importer la base : `mariadb -u root < sql/schema.sql`
2. Lancer le serveur : `php -S 0.0.0.0:3000 -t public public/router.php`
3. Ouvrir [http://localhost:3000](http://localhost:3000)

## Utiliser l'éditeur

1. Clic sur **« Mode édition »** en haut à droite
2. Tous les blocs éditables s'entourent en pointillés
3. Clic sur un bloc → un panneau latéral s'ouvre → modifie → **Enregistrer**

Tu peux :
- modifier les titres / sous-titres / textes
- ajouter, modifier et supprimer des réalisations
- lier des **compétences du Bloc 1** avec une justification
- téléverser des **preuves** (PDF, captures, docs)

## Sécurité

- Toutes les requêtes SQL sont **préparées** (PDO) → pas d'injection
- Upload : taille max 10 Mo, MIME vérifié, nom renommé
- Échappement HTML systématique dans les vues

## Préparer l'oral

Tout est expliqué dans [`oral_e5.md`](oral_e5.md).
