-- ============================================================================
-- Schéma de base de données - Portfolio BTS SIO (Bloc 1 - Épreuve E5)
-- ============================================================================
-- AVANT : aucune base. APRÈS : tables sections, contenus, realisations,
-- competences, preuves + table de liaison realisation_competence.
-- ----------------------------------------------------------------------------
-- POURQUOI ? On sépare les données dans plusieurs tables (modèle relationnel)
-- pour éviter la redondance. C'est la base du SQL en BTS SIO.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS portfolio_btssio
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE portfolio_btssio;

-- ----------------------------------------------------------------------------
-- Table SECTIONS : les grandes parties du portfolio (Accueil, À propos, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,          -- identifiant logique (ex: "hero")
    titre VARCHAR(150) NOT NULL,                -- titre affiché
    sous_titre VARCHAR(255) DEFAULT NULL,       -- description courte
    ordre INT NOT NULL DEFAULT 0,               -- ordre d'affichage
    visible TINYINT(1) NOT NULL DEFAULT 1,      -- 1 = visible, 0 = caché
    date_modif DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table CONTENUS : blocs de texte/image associés à une section
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contenus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_id INT NOT NULL,
    cle VARCHAR(80) NOT NULL,                   -- ex: "presentation", "photo"
    valeur LONGTEXT,                            -- texte ou chemin d'image
    type ENUM('texte','image','html','lien') NOT NULL DEFAULT 'texte',
    date_modif DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_contenu_section
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_section_cle (section_id, cle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table COMPETENCES : compétences du Bloc 1 du BTS SIO
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS competences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,           -- ex: "C1.1"
    libelle VARCHAR(255) NOT NULL,              -- intitulé officiel
    description TEXT,                           -- explication pour l'oral
    bloc VARCHAR(20) NOT NULL DEFAULT 'Bloc 1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table REALISATIONS : les projets/missions à présenter à l'oral
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS realisations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(200) NOT NULL,
    contexte TEXT,                              -- contexte de la réalisation
    description LONGTEXT,                       -- ce qui a été fait
    technologies VARCHAR(255),                  -- outils utilisés
    image VARCHAR(255),                         -- illustration principale
    lien VARCHAR(255),                          -- éventuel lien démo
    date_realisation DATE,
    ordre INT NOT NULL DEFAULT 0,
    date_modif DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Liaison N-N : une réalisation mobilise plusieurs compétences, et inversement
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS realisation_competence (
    realisation_id INT NOT NULL,
    competence_id INT NOT NULL,
    justification TEXT,                         -- pourquoi cette compétence ?
    PRIMARY KEY (realisation_id, competence_id),
    CONSTRAINT fk_rc_real FOREIGN KEY (realisation_id)
        REFERENCES realisations(id) ON DELETE CASCADE,
    CONSTRAINT fk_rc_comp FOREIGN KEY (competence_id)
        REFERENCES competences(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table PREUVES : fichiers (captures, PDF, docs) liés à une réalisation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preuves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    realisation_id INT NOT NULL,
    titre VARCHAR(200) NOT NULL,
    fichier VARCHAR(255) NOT NULL,              -- chemin relatif sous /uploads
    type_mime VARCHAR(100),
    description TEXT,
    date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_preuve_real FOREIGN KEY (realisation_id)
        REFERENCES realisations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- DONNÉES DE BASE : un squelette VIDE prêt à compléter
-- (on insère seulement la structure : sections vides + compétences officielles)
-- ============================================================================

-- Sections "squelette" (titres à modifier via l'éditeur visuel)
INSERT IGNORE INTO sections (code, titre, sous_titre, ordre) VALUES
    ('hero',         'Votre nom ici',       'Étudiant·e en BTS SIO — option SLAM/SISR', 1),
    ('apropos',      'À propos',            'Présentez-vous en quelques lignes',        2),
    ('realisations', 'Mes réalisations',    'Projets, missions, stages',                3),
    ('competences',  'Compétences Bloc 1',  'Référentiel E5 du BTS SIO',                4),
    ('veille',       'Veille technologique','Sujets suivis, sources, synthèses',        5),
    ('contact',      'Contact',             'Comment me joindre',                        6);

-- Contenus initiaux vides — à compléter via l'éditeur
INSERT IGNORE INTO contenus (section_id, cle, valeur, type)
SELECT id, 'texte_principal', '', 'texte' FROM sections WHERE code IN ('hero','apropos','veille','contact');

-- Compétences officielles du Bloc 1 (E5)
-- "Support et mise à disposition de services informatiques"
INSERT IGNORE INTO competences (code, libelle, description) VALUES
('C1.1', 'Gérer le patrimoine informatique',
 'Recenser et identifier les ressources numériques, exploiter des référentiels, vérifier les conditions de la continuité d''un service.'),
('C1.2', 'Répondre aux incidents et aux demandes d''assistance et d''évolution',
 'Collecter, suivre et orienter des demandes ; traiter des demandes concernant les services, les applications, les équipements.'),
('C1.3', 'Développer la présence en ligne de l''organisation',
 'Participer à la valorisation de l''image de l''organisation sur les médias numériques.'),
('C1.4', 'Travailler en mode projet',
 'Analyser les objectifs et modalités d''organisation d''un projet, planifier les activités.'),
('C1.5', 'Mettre à disposition des utilisateurs un service informatique',
 'Réaliser les tests d''intégration et d''acceptation d''un service, déployer un service, accompagner les utilisateurs.'),
('C1.6', 'Organiser son développement professionnel',
 'Mettre en place son environnement d''apprentissage personnel, mettre en œuvre des outils de veille, gérer son identité professionnelle.');
