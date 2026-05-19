<?php
/**
 * vues/accueil.php
 * ---------------------------------------------------------------------------
 * Vue principale (single page) — assemble toutes les sections du portfolio.
 *
 * Variables fournies par AccueilControleur :
 *   $sections, $contenusParSection, $realisations, $competences
 *
 * ASTUCE PÉDAGOGIQUE :
 *  - Chaque bloc éditable porte un attribut data-edit="..." et un data-id.
 *  - Le JS (js/editeur.js) regarde ces attributs pour proposer l'édition.
 * ---------------------------------------------------------------------------
 */

/** Helper sécurité : échappe une chaîne avant affichage HTML. */
function e($v): string { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }

/** Récupère le titre/sous-titre d'une section par son code. */
function getSection(array $sections, string $code): ?array {
    foreach ($sections as $s) if ($s['code'] === $code) return $s;
    return null;
}

require ROOT . '/vues/partials/header.php';

$hero     = getSection($sections, 'hero');
$apropos  = getSection($sections, 'apropos');
$realsSec = getSection($sections, 'realisations');
$compsSec = getSection($sections, 'competences');
$veille   = getSection($sections, 'veille');
$contact  = getSection($sections, 'contact');
?>

<main id="contenu-principal" tabindex="-1" data-testid="main-content">

    <!-- ============================ HERO ============================ -->
    <section id="hero" class="hero" data-section-code="hero" data-section-id="<?= e($hero['id'] ?? '') ?>">
        <div class="conteneur hero__inner">
            <div class="hero__texte">
                <p class="hero__eyebrow">Portfolio · BTS SIO</p>
                <h1 class="hero__titre" data-edit="section-titre" data-section-id="<?= e($hero['id']) ?>"
                    data-testid="hero-title"><?= e($hero['titre']) ?></h1>
                <p class="hero__sous-titre" data-edit="section-soustitre" data-section-id="<?= e($hero['id']) ?>"
                   data-testid="hero-subtitle"><?= e($hero['sous_titre']) ?></p>
                <p class="hero__intro" data-edit="contenu" data-section-id="<?= e($hero['id']) ?>"
                   data-cle="texte_principal" data-testid="hero-intro">
                    <?= nl2br(e($contenusParSection['hero']['texte_principal']['valeur'] ?? '✍️ Cliquez sur « Mode édition » pour vous présenter ici.')) ?>
                </p>
                <div class="hero__cta">
                    <a class="btn btn--primaire" href="#realisations" data-testid="cta-realisations">Voir mes réalisations</a>
                    <a class="btn btn--secondaire" href="#contact" data-testid="cta-contact">Me contacter</a>
                </div>
            </div>
            <div class="hero__visuel" aria-hidden="true">
                <div class="hero__cercle"></div>
                <div class="hero__motif"></div>
            </div>
        </div>
    </section>

    <!-- ============================ À PROPOS ======================== -->
    <section id="apropos" class="bloc" data-section-id="<?= e($apropos['id']) ?>">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section-titre" data-section-id="<?= e($apropos['id']) ?>"
                    data-testid="apropos-title"><?= e($apropos['titre']) ?></h2>
                <p data-edit="section-soustitre" data-section-id="<?= e($apropos['id']) ?>"
                   data-testid="apropos-subtitle"><?= e($apropos['sous_titre']) ?></p>
            </header>
            <div class="prose" data-edit="contenu" data-section-id="<?= e($apropos['id']) ?>"
                 data-cle="texte_principal" data-testid="apropos-content">
                <?= nl2br(e($contenusParSection['apropos']['texte_principal']['valeur'] ?? '✍️ Décrivez votre parcours, vos motivations, vos centres d\'intérêt en informatique.')) ?>
            </div>
        </div>
    </section>

    <!-- ============================ RÉALISATIONS ==================== -->
    <section id="realisations" class="bloc bloc--alt" data-section-id="<?= e($realsSec['id']) ?>">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section-titre" data-section-id="<?= e($realsSec['id']) ?>"
                    data-testid="realisations-title"><?= e($realsSec['titre']) ?></h2>
                <p data-edit="section-soustitre" data-section-id="<?= e($realsSec['id']) ?>"
                   data-testid="realisations-subtitle"><?= e($realsSec['sous_titre']) ?></p>
            </header>

            <div class="grille-cartes" id="listeRealisations" data-testid="realisations-list">
                <?php if (empty($realisations)): ?>
                    <p class="vide">Aucune réalisation pour le moment. Passez en mode édition pour en ajouter ✍️</p>
                <?php endif; ?>
                <?php foreach ($realisations as $r): ?>
                    <article class="carte" data-realisation-id="<?= e($r['id']) ?>"
                             data-testid="realisation-<?= e($r['id']) ?>">
                        <header class="carte__entete">
                            <h3 class="carte__titre"><?= e($r['titre']) ?></h3>
                            <?php if (!empty($r['date_realisation'])): ?>
                                <time class="carte__date"><?= e($r['date_realisation']) ?></time>
                            <?php endif; ?>
                        </header>
                        <?php if (!empty($r['contexte'])): ?>
                            <p class="carte__contexte"><strong>Contexte :</strong> <?= e($r['contexte']) ?></p>
                        <?php endif; ?>
                        <?php if (!empty($r['description'])): ?>
                            <p class="carte__desc"><?= nl2br(e($r['description'])) ?></p>
                        <?php endif; ?>
                        <?php if (!empty($r['technologies'])): ?>
                            <p class="carte__tech"><strong>Technos :</strong> <?= e($r['technologies']) ?></p>
                        <?php endif; ?>

                        <?php if (!empty($r['competences'])): ?>
                            <div class="carte__competences" aria-label="Compétences mobilisées">
                                <?php foreach ($r['competences'] as $c): ?>
                                    <span class="puce" title="<?= e($c['libelle']) ?>"><?= e($c['code']) ?></span>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>

                        <?php if (!empty($r['preuves'])): ?>
                            <details class="carte__preuves">
                                <summary>Preuves (<?= count($r['preuves']) ?>)</summary>
                                <ul>
                                <?php foreach ($r['preuves'] as $p): ?>
                                    <li><a href="/<?= e($p['fichier']) ?>" target="_blank" rel="noopener"
                                           data-testid="preuve-link-<?= e($p['id']) ?>"><?= e($p['titre']) ?></a></li>
                                <?php endforeach; ?>
                                </ul>
                            </details>
                        <?php endif; ?>

                        <div class="carte__actions">
                            <button type="button" class="btn btn--petit btn--secondaire"
                                    data-edit="realisation" data-realisation-id="<?= e($r['id']) ?>"
                                    data-testid="edit-realisation-<?= e($r['id']) ?>">✎ Modifier</button>
                        </div>
                    </article>
                <?php endforeach; ?>
            </div>

            <div class="bloc__actions-edition" hidden>
                <button type="button" class="btn btn--primaire" id="btnAjouterRealisation"
                        data-testid="add-realisation">＋ Ajouter une réalisation</button>
            </div>
        </div>
    </section>

    <!-- ============================ COMPÉTENCES BLOC 1 ============== -->
    <section id="competences" class="bloc" data-section-id="<?= e($compsSec['id']) ?>">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section-titre" data-section-id="<?= e($compsSec['id']) ?>"
                    data-testid="competences-title"><?= e($compsSec['titre']) ?></h2>
                <p data-edit="section-soustitre" data-section-id="<?= e($compsSec['id']) ?>"
                   data-testid="competences-subtitle"><?= e($compsSec['sous_titre']) ?></p>
            </header>
            <ul class="grille-competences" data-testid="competences-list">
                <?php foreach ($competences as $c): ?>
                    <li class="competence">
                        <span class="competence__code"><?= e($c['code']) ?></span>
                        <div>
                            <h3 class="competence__titre"><?= e($c['libelle']) ?></h3>
                            <p class="competence__desc"><?= e($c['description']) ?></p>
                        </div>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </section>

    <!-- ============================ VEILLE ========================== -->
    <section id="veille" class="bloc bloc--alt" data-section-id="<?= e($veille['id']) ?>">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section-titre" data-section-id="<?= e($veille['id']) ?>"
                    data-testid="veille-title"><?= e($veille['titre']) ?></h2>
                <p data-edit="section-soustitre" data-section-id="<?= e($veille['id']) ?>"
                   data-testid="veille-subtitle"><?= e($veille['sous_titre']) ?></p>
            </header>
            <div class="prose" data-edit="contenu" data-section-id="<?= e($veille['id']) ?>"
                 data-cle="texte_principal" data-testid="veille-content">
                <?= nl2br(e($contenusParSection['veille']['texte_principal']['valeur'] ?? '✍️ Présentez vos sujets de veille, vos sources et vos synthèses.')) ?>
            </div>
        </div>
    </section>

    <!-- ============================ CONTACT ========================= -->
    <section id="contact" class="bloc" data-section-id="<?= e($contact['id']) ?>">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section-titre" data-section-id="<?= e($contact['id']) ?>"
                    data-testid="contact-title"><?= e($contact['titre']) ?></h2>
                <p data-edit="section-soustitre" data-section-id="<?= e($contact['id']) ?>"
                   data-testid="contact-subtitle"><?= e($contact['sous_titre']) ?></p>
            </header>
            <div class="prose" data-edit="contenu" data-section-id="<?= e($contact['id']) ?>"
                 data-cle="texte_principal" data-testid="contact-content">
                <?= nl2br(e($contenusParSection['contact']['texte_principal']['valeur'] ?? '✍️ Email, LinkedIn, GitHub… Comment vous joindre ?')) ?>
            </div>
        </div>
    </section>
</main>

<?php require ROOT . '/vues/partials/footer.php'; ?>
