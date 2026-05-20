# Portfolio BTS SIO — Bloc 1 (Épreuve E5)

Portfolio numérique conforme à l'épreuve **E5** du BTS SIO (référentiel officiel du **Bloc 1** « Support et mise à disposition de services informatiques »).

## ✨ Fonctionnalités

- 🎨 Design **moderne, clair, responsive** (mobile / tablette / PC)
- ♿ **Accessibilité WCAG AA** : lien d'évitement, focus visible, navigation clavier, `aria-label`
- ✏️ **Mode édition** intégré : modifie tout depuis le site, sans toucher au code
- 📊 **Tableau de synthèse officiel** (matrice compétences × réalisations, imprimable)
- 📁 **Catégorisation E5** des réalisations : Formation / Pro 1ère année / Pro 2ème année
- 🎯 **Contribution personnelle** + **travail en équipe** (critères officiels)
- 📜 **Attestations de stage** (1ère et 2ème année)
- 🧠 Référentiel détaillé : **22 sous-compétences** + **38 indicateurs de performance** officiels
- 🚀 **Déploiement automatique** sur GitHub Pages (URL publique gratuite)
- 🛠️ Version PHP/MVC complète dans `/php-mvc/` (pour la démo MVC à l'oral, via XAMPP)

---

## 📂 Structure du projet

```
portfolio-bts-sio/
├── index.html                  ⭐ Entrée du site statique (GitHub Pages)
├── assets/
│   ├── css/portfolio.css       Styles
│   └── js/app.js               Application JavaScript (MVC en JS)
├── data/
│   └── portfolio.json          ⭐ Toutes les données du portfolio
├── uploads/                    Tes preuves, captures, PDFs
│
├── php-mvc/                    Version PHP/MySQL (démo MVC en local)
│   ├── modeles/                Modèles (CRUD via PDO)
│   ├── vues/                   Templates HTML
│   ├── controleurs/            Contrôleurs (Accueil + API JSON)
│   ├── config/                 Connexion PDO sécurisée
│   ├── public/                 Front Controller PHP
│   ├── sql/                    Schéma + migrations MariaDB/MySQL
│   ├── css/                    CSS de la version PHP
│   └── js/                     JS de la version PHP
│
├── .github/workflows/deploy.yml   Déploiement automatique GitHub Pages
├── .nojekyll                      (technique : désactive Jekyll)
├── oral_e5.md                  ⭐ Préparation de l'oral (plan 10 min + phrases types)
└── README.md
```

> **Convention de nommage** : tout est en français — `modeles/`, `vues/`, `controleurs/`. C'est volontaire pour rester pédagogique au niveau BTS SIO.

---

## 🚀 Mise en ligne en 5 minutes (GitHub Pages)

### Étape 1 — Pousser le code sur GitHub

Si tu utilises Emergent : clique sur **« Save to GitHub »** en haut à droite.

Sinon, en ligne de commande :
```bash
git init
git add .
git commit -m "Initial portfolio BTS SIO"
git branch -M main
git remote add origin https://github.com/TON_PSEUDO/portfolio-bts-sio.git
git push -u origin main
```

### Étape 2 — Activer GitHub Pages

1. Sur GitHub, va dans **Settings** de ton repo
2. Menu de gauche → **Pages**
3. **Source** : sélectionne **« GitHub Actions »** (et pas « Deploy from a branch »)
4. Reviens à l'onglet **Actions** : le workflow `Deploy to GitHub Pages` se lance automatiquement
5. Attends ~1 minute, puis ton site est en ligne sur :
   ```
   https://TON_PSEUDO.github.io/portfolio-bts-sio/
   ```

> Ton repo peut être **privé** ou **public**, GitHub Pages fonctionne avec les deux (gratuit dans les deux cas).

### Étape 3 — Modifier ton portfolio

1. Ouvre ton site (en local OU sur GitHub Pages)
2. Clique sur **« Mode édition »** en haut à droite
3. Clique sur n'importe quel bloc en pointillés → un panneau s'ouvre → modifie → **Enregistrer**
4. Tes modifications sont stockées dans **localStorage** (visibles uniquement par toi pour l'instant)
5. Quand tu es satisfait·e, clique sur **« ⬇ Exporter mon portfolio.json »** en bas de l'écran
6. Remplace le fichier `data/portfolio.json` dans ton repo par celui téléchargé
7. `git add data/portfolio.json && git commit -m "Update portfolio" && git push`
8. ✨ Ton site déployé est mis à jour automatiquement en ~1 minute !

### Étape 4 — Ajouter des preuves / attestations

1. Dépose tes fichiers PDF/PNG/JPG dans le dossier `uploads/` de ton repo
2. Dans le formulaire d'édition (mode édition), renseigne le **chemin** : `uploads/ma-capture.png`
3. Commit + push → le fichier est servi automatiquement par GitHub Pages

---

## 💻 Démo locale de la version PHP/MVC (XAMPP)

Pour ton oral E5, tu peux vouloir montrer l'**architecture MVC en PHP**. La version complète est dans `/php-mvc/`.

### Prérequis
- **XAMPP** (Windows/Mac/Linux) — https://www.apachefriends.org/
- Avec XAMPP tu obtiens : Apache, MySQL et PHP en 1 clic.

### Installation
1. Clone le repo dans `C:\xampp\htdocs\` :
   ```
   cd C:\xampp\htdocs
   git clone https://github.com/TON_PSEUDO/portfolio-bts-sio.git
   ```
2. Lance **XAMPP Control Panel** → **Start Apache** + **Start MySQL**
3. Ouvre **phpMyAdmin** (http://localhost/phpmyadmin)
4. Importe **dans l'ordre** :
   - `php-mvc/sql/schema.sql`
   - `php-mvc/sql/migration_002_conformite_e5.sql`
5. Crée l'utilisateur MySQL **`portfolio`** avec le mot de passe **`portfolio_pwd_2026`** et donne-lui tous les droits sur `portfolio_btssio` (onglet « Comptes utilisateurs » de phpMyAdmin)
6. Visite **http://localhost/portfolio-bts-sio/php-mvc/public/**

> Si tu préfères, modifie `php-mvc/config/database.php` pour utiliser `root` sans mot de passe (config XAMPP par défaut).

---

## 🎤 Préparer l'oral E5

Tout est expliqué dans **[`oral_e5.md`](oral_e5.md)** :
- Plan détaillé de la présentation (10 min)
- Structure type pour chaque réalisation
- Phrases types à adapter
- Les 6 compétences + 38 indicateurs officiels
- Erreurs fréquentes à éviter
- Questions probables du jury

---

## 🛡️ Sécurité (côté PHP)

- Toutes les requêtes SQL sont **préparées** (PDO) → pas d'injection
- Upload : taille max 10 Mo, MIME vérifié, nom renommé pour éviter les écrasements
- Échappement HTML systématique dans les vues

## 🛡️ Sécurité (côté statique)

- Pas de back-end → pas d'injection SQL possible
- Échappement HTML systématique dans le rendu (`esc()` dans `app.js`)
- Données en JSON versionné dans git (traçable)

---

## 📖 Pour aller plus loin

- Référentiel officiel du BTS SIO : [eduscol.education.fr](https://eduscol.education.fr/)
- Documentation MDN sur HTML/CSS/JS : [developer.mozilla.org](https://developer.mozilla.org/fr/)
- Tutoriels PHP/MySQL : [grafikart.fr](https://grafikart.fr/)

---

## 📄 Licence

Ce portfolio est ton travail personnel — utilise-le, modifie-le, présente-le à ton oral. Bonne chance ! 🍀
