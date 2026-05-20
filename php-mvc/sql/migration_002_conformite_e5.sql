-- ============================================================================
-- MIGRATION 002 — Mise en conformité officielle E5 (Bloc 1 BTS SIO)
-- ============================================================================
-- Ajoute :
--   1) Table profil_candidat (NOM, prénom, n° candidat, SESSION, option SISR/SLAM)
--   2) Catégorisation des réalisations (formation / pro_annee1 / pro_annee2)
--      + période (date début / date fin)
--      + contribution personnelle (critère officiel d'évaluation)
--   3) Table attestations (stage 1 et stage 2)
--   4) Sous-compétences (puces du référentiel)
--   5) Indicateurs de performance (critères d'évaluation officiels)
--
-- À jouer une seule fois : utilise IF NOT EXISTS / INSERT IGNORE.
-- ============================================================================

USE portfolio_btssio;

-- ---- 1) Profil candidat ----------------------------------------------------
CREATE TABLE IF NOT EXISTS profil_candidat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) DEFAULT '',
    prenom VARCHAR(100) DEFAULT '',
    numero_candidat VARCHAR(50) DEFAULT '',
    session VARCHAR(20) DEFAULT '',
    option_sio ENUM('SISR','SLAM','') NOT NULL DEFAULT '',
    etablissement VARCHAR(200) DEFAULT '',
    date_modif DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT IGNORE INTO profil_candidat (id) VALUES (1); -- 1 seul profil

-- ---- 2) Réalisations : catégorie + période + contribution -----------------
-- (ALTER TABLE en MariaDB : on ignore si la colonne existe déjà via procédure)
DELIMITER $$
DROP PROCEDURE IF EXISTS ajouter_colonne_si_absente$$
CREATE PROCEDURE ajouter_colonne_si_absente(
    IN p_table VARCHAR(64), IN p_col VARCHAR(64), IN p_def TEXT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = p_table AND COLUMN_NAME = p_col) THEN
        SET @sql = CONCAT('ALTER TABLE ', p_table, ' ADD COLUMN ', p_col, ' ', p_def);
        PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END$$
DELIMITER ;

CALL ajouter_colonne_si_absente('realisations', 'categorie',
    "ENUM('formation','pro_annee1','pro_annee2') NOT NULL DEFAULT 'formation' AFTER ordre");
CALL ajouter_colonne_si_absente('realisations', 'periode_debut', "DATE NULL AFTER categorie");
CALL ajouter_colonne_si_absente('realisations', 'periode_fin',   "DATE NULL AFTER periode_debut");
CALL ajouter_colonne_si_absente('realisations', 'contribution_personnelle',
    "TEXT NULL AFTER description");
CALL ajouter_colonne_si_absente('realisations', 'travail_equipe',
    "TINYINT(1) NOT NULL DEFAULT 0 AFTER contribution_personnelle");

-- ---- 3) Attestations de stage ---------------------------------------------
CREATE TABLE IF NOT EXISTS attestations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    annee ENUM('annee1','annee2') NOT NULL,
    titre VARCHAR(200) DEFAULT '',
    organisme VARCHAR(200) DEFAULT '',
    periode_debut DATE NULL,
    periode_fin DATE NULL,
    fichier VARCHAR(255) DEFAULT '',
    type_mime VARCHAR(100) DEFAULT '',
    date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- 4) Sous-compétences (puces du référentiel officiel) ------------------
CREATE TABLE IF NOT EXISTS sous_competences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    competence_id INT NOT NULL,
    libelle TEXT NOT NULL,
    ordre INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_sc_comp FOREIGN KEY (competence_id)
        REFERENCES competences(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- 5) Indicateurs de performance (critères d'évaluation officiels) -----
CREATE TABLE IF NOT EXISTS indicateurs_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    competence_id INT NOT NULL,
    libelle TEXT NOT NULL,
    ordre INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_ip_comp FOREIGN KEY (competence_id)
        REFERENCES competences(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- Données de référence : sous-compétences + indicateurs officiels -----
-- C1.1 - Gérer le patrimoine informatique
INSERT INTO sous_competences (competence_id, libelle, ordre) SELECT id, 'Recenser et identifier les ressources numériques', 1 FROM competences WHERE code='C1.1' AND NOT EXISTS (SELECT 1 FROM sous_competences sc WHERE sc.competence_id = competences.id);
INSERT INTO sous_competences (competence_id, libelle, ordre)
    SELECT c.id, t.lib, t.ord FROM competences c JOIN (
        SELECT 'C1.1' AS code, 'Exploiter des référentiels, normes et standards adoptés par le prestataire informatique' AS lib, 2 AS ord UNION ALL
        SELECT 'C1.1','Mettre en place et vérifier les niveaux d''habilitation associés à un service',3 UNION ALL
        SELECT 'C1.1','Vérifier les conditions de la continuité d''un service informatique',4 UNION ALL
        SELECT 'C1.1','Gérer des sauvegardes',5 UNION ALL
        SELECT 'C1.1','Vérifier le respect des règles d''utilisation des ressources numériques',6 UNION ALL
        SELECT 'C1.2','Collecter, suivre et orienter des demandes',1 UNION ALL
        SELECT 'C1.2','Traiter des demandes concernant les services réseau et système',2 UNION ALL
        SELECT 'C1.2','Traiter des demandes concernant les applications',3 UNION ALL
        SELECT 'C1.3','Participer à la valorisation de l''image de l''organisation sur les médias numériques en tenant compte du cadre juridique et des enjeux économiques',1 UNION ALL
        SELECT 'C1.3','Référencer les services en ligne de l''organisation et mesurer leur visibilité',2 UNION ALL
        SELECT 'C1.3','Participer à l''évolution d''un site Web exploitant les données de l''organisation',3 UNION ALL
        SELECT 'C1.4','Analyser les objectifs et les modalités d''organisation d''un projet',1 UNION ALL
        SELECT 'C1.4','Planifier les activités',2 UNION ALL
        SELECT 'C1.4','Évaluer les indicateurs de suivi d''un projet et analyser les écarts',3 UNION ALL
        SELECT 'C1.5','Réaliser les tests d''intégration et d''acceptation d''un service',1 UNION ALL
        SELECT 'C1.5','Déployer un service',2 UNION ALL
        SELECT 'C1.5','Accompagner les utilisateurs dans la mise en place d''un service',3 UNION ALL
        SELECT 'C1.6','Mettre en place son environnement d''apprentissage personnel',1 UNION ALL
        SELECT 'C1.6','Mettre en œuvre des outils et stratégies de veille informationnelle',2 UNION ALL
        SELECT 'C1.6','Gérer son identité professionnelle',3 UNION ALL
        SELECT 'C1.6','Développer son projet professionnel',4
    ) t ON c.code = t.code
    WHERE NOT EXISTS (SELECT 1 FROM sous_competences sc2 WHERE sc2.competence_id = c.id AND sc2.libelle = t.lib);

-- Indicateurs de performance officiels (extraits du référentiel E5)
INSERT INTO indicateurs_performance (competence_id, libelle, ordre)
    SELECT c.id, t.lib, t.ord FROM competences c JOIN (
        -- C1.1
        SELECT 'C1.1' AS code, 'Le recensement du patrimoine informatique est exhaustif et réalisé au moyen d''un outil de gestion' AS lib, 1 AS ord UNION ALL
        SELECT 'C1.1','Les référentiels, normes et standards sont mobilisés de façon pertinente',2 UNION ALL
        SELECT 'C1.1','Les droits mis en place correspondent aux habilitations des acteurs',3 UNION ALL
        SELECT 'C1.1','Les conditions de continuité et de reprise d''un service sont vérifiées et les manquements sont signalés',4 UNION ALL
        SELECT 'C1.1','Les sauvegardes sont réalisées dans les conditions prévues conformément au plan de sauvegarde',5 UNION ALL
        SELECT 'C1.1','Les restaurations sont testées et opérationnelles',6 UNION ALL
        SELECT 'C1.1','Les écarts par rapport aux règles d''utilisation des ressources numériques sont détectés et signalés',7 UNION ALL
        -- C1.2
        SELECT 'C1.2','Les demandes d''assistance ont été prises en compte, correctement diagnostiquées et leur traitement correspond aux attentes',1 UNION ALL
        SELECT 'C1.2','La réponse à une demande d''assistance est conforme à la procédure et adaptée à l''utilisateur',2 UNION ALL
        SELECT 'C1.2','La méthode de diagnostic de résolution d''un incident est adéquate et efficiente',3 UNION ALL
        SELECT 'C1.2','Une solution à l''incident est trouvée et mise en œuvre',4 UNION ALL
        SELECT 'C1.2','Le cycle de résolution des demandes respecte les normes et standards du prestataire informatique',5 UNION ALL
        SELECT 'C1.2','L''utilisation d''un logiciel de gestion de parc et d''incidents est maîtrisée',6 UNION ALL
        SELECT 'C1.2','Le compte rendu d''intervention est clair et explicite',7 UNION ALL
        SELECT 'C1.2','La communication écrite et orale est adaptée à l''interlocuteur',8 UNION ALL
        -- C1.3
        SELECT 'C1.3','L''image de l''organisation est conforme aux attentes et valorisée',1 UNION ALL
        SELECT 'C1.3','Les enjeux économiques liés à l''image de l''organisation sont identifiés et les obligations juridiques sont respectées',2 UNION ALL
        SELECT 'C1.3','Les mentions légales sont accessibles et conformes à la législation',3 UNION ALL
        SELECT 'C1.3','La visibilité des services en ligne de l''organisation est satisfaisante',4 UNION ALL
        SELECT 'C1.3','Le site Web a évolué conformément au besoin exprimé',5 UNION ALL
        -- C1.4
        SELECT 'C1.4','Les objectifs et les modalités d''organisation du projet sont explicités',1 UNION ALL
        SELECT 'C1.4','L''analyse des besoins et de l''existant est pertinente',2 UNION ALL
        SELECT 'C1.4','Les activités personnelles sont planifiées selon une méthodologie donnée et les ressources humaines, matérielles et logicielles nécessaires sont mobilisées de manière efficace et pertinente',3 UNION ALL
        SELECT 'C1.4','Le découpage en tâches est réaliste',4 UNION ALL
        SELECT 'C1.4','Les livrables sont conformes',5 UNION ALL
        SELECT 'C1.4','Le projet est documenté',6 UNION ALL
        SELECT 'C1.4','Un compte rendu clair et concis est réalisé et les écarts sont justifiés',7 UNION ALL
        SELECT 'C1.4','La communication écrite et orale est adaptée à l''interlocuteur',8 UNION ALL
        -- C1.5
        SELECT 'C1.5','Des tests pertinents d''intégration et d''acceptation sont rédigés et effectués',1 UNION ALL
        SELECT 'C1.5','Les outils de test sont utilisés de manière appropriée',2 UNION ALL
        SELECT 'C1.5','Un rapport de test du service est produit',3 UNION ALL
        SELECT 'C1.5','Un support d''information est disponible',4 UNION ALL
        SELECT 'C1.5','Les modalités d''accompagnement sont définies',5 UNION ALL
        SELECT 'C1.5','Le service déployé est opérationnel et donne satisfaction à l''utilisateur',6 UNION ALL
        -- C1.6
        SELECT 'C1.6','Les besoins de formation sont identifiés pour assurer le support ou mettre à disposition un service',1 UNION ALL
        SELECT 'C1.6','L''environnement d''apprentissage personnel est délimité et expliqué',2 UNION ALL
        SELECT 'C1.6','La veille est régulière et vise à repérer les techniques et technologies émergentes, à utiliser de manière approfondie des moyens de recherche d''information et à renforcer ses compétences',3 UNION ALL
        SELECT 'C1.6','L''identité professionnelle est pertinente et visible sur un réseau social professionnel',4
    ) t ON c.code = t.code
    WHERE NOT EXISTS (SELECT 1 FROM indicateurs_performance ip WHERE ip.competence_id = c.id AND ip.libelle = t.lib);

-- ---- Ajout d'une section "Profil" et "Tableau de synthèse" + "Attestations"
INSERT IGNORE INTO sections (code, titre, sous_titre, ordre) VALUES
    ('profil',      'Mon profil',           'Identification candidat (épreuve E5)',                 0),
    ('synthese',    'Tableau de synthèse',  'Compétences mobilisées par réalisation (officiel E5)', 35),
    ('attestations','Attestations de stage','Stages de 1ère et 2ème année',                         36);

-- Réordonner pour cohérence (sécurité)
UPDATE sections SET ordre = 0 WHERE code = 'profil';
UPDATE sections SET ordre = 1 WHERE code = 'hero';
UPDATE sections SET ordre = 2 WHERE code = 'apropos';
UPDATE sections SET ordre = 3 WHERE code = 'realisations';
UPDATE sections SET ordre = 4 WHERE code = 'synthese';
UPDATE sections SET ordre = 5 WHERE code = 'attestations';
UPDATE sections SET ordre = 6 WHERE code = 'competences';
UPDATE sections SET ordre = 7 WHERE code = 'veille';
UPDATE sections SET ordre = 8 WHERE code = 'contact';
