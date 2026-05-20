<?php
/**
 * vues/accueil.php
 * ---------------------------------------------------------------------------
 * Vue principale du portfolio (page unique).
 * Conforme aux attendus officiels de l'épreuve E5 (Bloc 1 BTS SIO) :
 *   - Profil candidat (NOM, prénom, n° candidat, SESSION, option SISR/SLAM)
 *   - Hero + À propos (parcours de professionnalisation)
 *   - Réalisations (catégorisées formation / pro 1ère / pro 2ème année)
 *     avec contribution personnelle, période, compétences, preuves
 *   - Tableau de synthèse (matrice officielle)
 *   - Attestations de stage
 *   - Référentiel détaillé du Bloc 1 (sous-compétences + indicateurs)
 *   - Veille technologique
 *   - Contact
 *
 * Variables fournies par AccueilControleur :
 *   $sections, $contenusParSection, $realisations, $competences,
 *   $profil, $attestations
 * ---------------------------------------------------------------------------
 */

/** Helper sécurité : échappe une chaîne avant affichage HTML. */
function e($v): string { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }

/** Récupère une section par son code logique. */
function getSection(array $sections, string $code): ?array {
    foreach ($sections as $s) if ($s['code'] === $code) return $s;
    return null;
}

/** Libellé lisible d'une catégorie de réalisation. */
function libelleCategorie(string $cat): string {
    return [
        'formation'  => 'En cours de formation',
        'pro_annee1' => 'Milieu pro · 1ère année',
        'pro_annee2' => 'Milieu pro · 2ème année',
    ][$cat] ?? $cat;
}

/** Formate "JJ/MM/AA au JJ/MM/AA" (format officiel du tableau de synthèse). */
function periodeCourte(?string $debut, ?string $fin): string {
    $f = fn($d) => $d ? date('d/m/y', strtotime($d)) : '…';
    if (!$debut && !$fin) return '—';
    return "du {$f($debut)} au {$f($fin)}";
}

require ROOT . '/vues/partials/header.php';

$hero     = getSection($sections, 'hero');
$apropos  = getSection($sections, 'apropos');
$realsSec = getSection($sections, 'realisations');
$synthSec = getSection($sections, 'synthese');
$attSec   = getSection($sections, 'attestations');
$compsSec = getSection($sections, 'competences');
$veille   = getSection($sections, 'veille');
$contact  = getSection($sections, 'contact');

// Regrouper les réalisations par catégorie pour le tableau de synthèse
$realsParCat = ['formation' => [], 'pro_annee1' => [], 'pro_annee2' => []];
foreach ($realisations as $r) {
    $cat = $r['categorie'] ?? 'formation';
    if (!isset($realsParCat[$cat])) $cat = 'formation';
    $realsParCat[$cat][] = $r;
}
?>

<main id="contenu-principal" tabindex="-1" data-testid="main-content">

    <!-- ============================ HERO + PROFIL =================== -->
    <section id="hero" class="hero" data-section-code="hero" data-section-id="<?= e($hero['id'] ?? '') ?>">
        <div class="conteneur hero__inner">
            <div class="hero__texte">
                <p class="hero__eyebrow">Portfolio · BTS SIO · Épreuve E5 — Bloc 1</p>
                <h1 class="hero__titre" data-edit="section-titre" data-section-id="<?= e($hero['id']) ?>"
                    data-testid="hero-title">
                    <?= $profil['nom'] || $profil['prenom']
                        ? e(trim(($profil['prenom'] ?? '') . ' ' . strtoupper($profil['nom'] ?? '')))
                        : e($hero['titre']) ?>
                </h1>
                <p class="hero__sous-titre" data-edit="section-soustitre" data-section-id="<?= e($hero['id']) ?>"
                   data-testid="hero-subtitle">
                    <?php if ($profil['option_sio']): ?>
                        Étudiant·e en BTS SIO — option <?= e($profil['option_sio']) ?>
                        <?php if ($profil['session']): ?> · session <?= e($profil['session']) ?><?php endif; ?>
                    <?php else: ?>
                        <?= e($hero['sous_titre']) ?>
                    <?php endif; ?>
                </p>
                <p class="hero__intro" data-edit="contenu" data-section-id="<?= e($hero['id']) ?>"
                   data-cle="texte_principal" data-testid="hero-intro">
                    <?= nl2br(e($contenusParSection['hero']['texte_principal']['valeur']
                        ?? '✍️ Cliquez sur « Mode édition » pour vous présenter ici.')) ?>
                </p>
                <div class="hero__cta">
                    <a class="btn btn--primaire" href="#realisations" data-testid="cta-realisations">Voir mes réalisations</a>
                    <a class="btn btn--secondaire" href="#synthese" data-testid="cta-synthese">Tableau de synthèse</a>
                </div>
            </div>
            <div class="hero__visuel" aria-hidden="true">
                <div class="hero__cercle"></div>
                <div class="hero__motif"></div>
            </div>
        </div>
    </section>

    <!-- ============================ PROFIL CANDIDAT ================= -->
    <section id="profil" class="bloc bloc--profil">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-testid="profil-title">Identification du candidat</h2>
                <p>Informations administratives pour l'épreuve E5.</p>
            </header>
            <dl class="profil-grille" data-testid="profil-grille">
                <div><dt>NOM</dt><dd data-testid="profil-nom"><?= e($profil['nom']) ?: '—' ?></dd></div>
                <div><dt>Prénom</dt><dd data-testid="profil-prenom"><?= e($profil['prenom']) ?: '—' ?></dd></div>
                <div><dt>N° candidat</dt><dd data-testid="profil-numero"><?= e($profil['numero_candidat']) ?: '—' ?></dd></div>
                <div><dt>SESSION</dt><dd data-testid="profil-session"><?= e($profil['session']) ?: '—' ?></dd></div>
                <div><dt>Option</dt><dd data-testid="profil-option"><?= e($profil['option_sio']) ?: '—' ?></dd></div>
                <div><dt>Établissement</dt><dd data-testid="profil-etab"><?= e($profil['etablissement']) ?: '—' ?></dd></div>
            </dl>
            <div class="bloc__actions-edition" hidden>
                <button type="button" class="btn btn--primaire" data-edit="profil" data-testid="edit-profil">
                    ✎ Modifier mon profil
                </button>
            </div>
        </div>
    </section>

    <!-- ============================ À PROPOS / PARCOURS ============= -->
    <section id="apropos" class="bloc bloc--alt" data-section-id="<?= e($apropos['id']) ?>">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section-titre" data-section-id="<?= e($apropos['id']) ?>"
                    data-testid="apropos-title"><?= e($apropos['titre']) ?></h2>
                <p data-edit="section-soustitre" data-section-id="<?= e($apropos['id']) ?>"
                   data-testid="apropos-subtitle">Mon parcours de professionnalisation</p>
            </header>
            <div class="prose" data-edit="contenu" data-section-id="<?= e($apropos['id']) ?>"
                 data-cle="texte_principal" data-testid="apropos-content">
                <?= nl2br(e($contenusParSection['apropos']['texte_principal']['valeur']
                    ?? '✍️ Décrivez votre parcours de professionnalisation : motivations, expériences marquantes, évolution durant les 2 ans de formation.')) ?>
            </div>
        </div>
    </section>

    <!-- ============================ RÉALISATIONS ==================== -->
    <section id="realisations" class="bloc" data-section-id="<?= e($realsSec['id']) ?>">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section-titre" data-section-id="<?= e($realsSec['id']) ?>"
                    data-testid="realisations-title"><?= e($realsSec['titre']) ?></h2>
                <p data-edit="section-soustitre" data-section-id="<?= e($realsSec['id']) ?>"
                   data-testid="realisations-subtitle"><?= e($realsSec['sous_titre']) ?></p>
            </header>

            <?php foreach (['formation','pro_annee1','pro_annee2'] as $cat): ?>
                <h3 class="categorie-titre"><?= e(libelleCategorie($cat)) ?></h3>
                <div class="grille-cartes" data-testid="realisations-<?= e($cat) ?>">
                    <?php if (empty($realsParCat[$cat])): ?>
                        <p class="vide">Aucune réalisation dans cette catégorie.</p>
                    <?php endif; ?>
                    <?php foreach ($realsParCat[$cat] as $r): ?>
                        <article class="carte" data-realisation-id="<?= e($r['id']) ?>"
                                 data-testid="realisation-<?= e($r['id']) ?>">
                            <header class="carte__entete">
                                <h4 class="carte__titre"><?= e($r['titre']) ?></h4>
                                <time class="carte__date"><?= e(periodeCourte($r['periode_debut'] ?? null, $r['periode_fin'] ?? null)) ?></time>
                            </header>
                            <?php if (!empty($r['contexte'])): ?>
                                <p class="carte__contexte"><strong>Contexte :</strong> <?= e($r['contexte']) ?></p>
                            <?php endif; ?>
                            <?php if (!empty($r['description'])): ?>
                                <p class="carte__desc"><?= nl2br(e($r['description'])) ?></p>
                            <?php endif; ?>
                            <?php if (!empty($r['contribution_personnelle'])): ?>
                                <p class="carte__contrib"><strong>Ma contribution :</strong> <?= nl2br(e($r['contribution_personnelle'])) ?></p>
                            <?php endif; ?>
                            <?php if (!empty($r['travail_equipe'])): ?>
                                <p class="carte__equipe"><span class="puce puce--equipe">👥 Travail en équipe</span></p>
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
            <?php endforeach; ?>

            <div class="bloc__actions-edition" hidden>
                <button type="button" class="btn btn--primaire" id="btnAjouterRealisation"
                        data-testid="add-realisation">＋ Ajouter une réalisation</button>
            </div>
        </div>
    </section>

    <!-- ============================ TABLEAU DE SYNTHÈSE (officiel) == -->
    <section id="synthese" class="bloc bloc--alt" data-section-id="<?= e($synthSec['id']) ?>">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section-titre" data-section-id="<?= e($synthSec['id']) ?>"
                    data-testid="synthese-title"><?= e($synthSec['titre']) ?></h2>
                <p>Compétences du Bloc 1 mises en œuvre par réalisation (modèle officiel E5).</p>
            </header>

            <div class="table-scroll">
            <table class="tableau-synthese" data-testid="tableau-synthese"
                   aria-label="Tableau de synthèse des réalisations professionnelles">
                <caption class="sr-only">Tableau de synthèse — Bloc 1</caption>
                <thead>
                    <tr>
                        <th scope="col">Réalisation</th>
                        <th scope="col">Période</th>
                        <?php foreach ($competences as $c): ?>
                            <th scope="col" title="<?= e($c['libelle']) ?>"><?= e($c['code']) ?></th>
                        <?php endforeach; ?>
                    </tr>
                </thead>
                <tbody>
                <?php foreach (['formation','pro_annee1','pro_annee2'] as $cat):
                    $items = $realsParCat[$cat]; if (empty($items)) continue; ?>
                    <tr class="ligne-categorie"><th scope="rowgroup" colspan="<?= 2 + count($competences) ?>">
                        <?= e(libelleCategorie($cat)) ?>
                    </th></tr>
                    <?php foreach ($items as $r):
                        $codesMob = array_column($r['competences'], 'code'); ?>
                        <tr>
                            <th scope="row"><?= e($r['titre']) ?></th>
                            <td><?= e(periodeCourte($r['periode_debut'] ?? null, $r['periode_fin'] ?? null)) ?></td>
                            <?php foreach ($competences as $c): ?>
                                <td class="<?= in_array($c['code'], $codesMob) ? 'mob' : '' ?>"
                                    aria-label="<?= in_array($c['code'], $codesMob) ? 'mobilisée' : 'non mobilisée' ?>">
                                    <?= in_array($c['code'], $codesMob) ? '✕' : '' ?>
                                </td>
                            <?php endforeach; ?>
                        </tr>
                    <?php endforeach; ?>
                <?php endforeach; ?>
                <?php if (empty($realisations)): ?>
                    <tr><td colspan="<?= 2 + count($competences) ?>" class="vide">
                        Aucune réalisation pour le moment.
                    </td></tr>
                <?php endif; ?>
                </tbody>
            </table>
            </div>

            <p class="legende">
                <strong>Légende des compétences :</strong>
                <?php foreach ($competences as $c): ?>
                    <span class="legende-item"><strong><?= e($c['code']) ?></strong> — <?= e($c['libelle']) ?></span>
                <?php endforeach; ?>
            </p>

            <div class="bloc__actions-edition" hidden>
                <button type="button" class="btn btn--secondaire" onclick="window.print()" data-testid="print-synthese">
                    🖨️ Imprimer le tableau
                </button>
            </div>
        </div>
    </section>

    <!-- ============================ ATTESTATIONS DE STAGE =========== -->
    <section id="attestations" class="bloc" data-section-id="<?= e($attSec['id']) ?>">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section-titre" data-section-id="<?= e($attSec['id']) ?>"
                    data-testid="attestations-title"><?= e($attSec['titre']) ?></h2>
                <p>Attestations de stage obligatoires (1ère et 2ème année).</p>
            </header>

            <div class="attestations-grille" data-testid="attestations-list">
                <?php foreach (['annee1' => '1ère année', 'annee2' => '2ème année'] as $annee => $lib):
                    $att = array_values(array_filter($attestations, fn($a) => $a['annee'] === $annee))[0] ?? null; ?>
                    <article class="attestation" data-testid="attestation-<?= e($annee) ?>">
                        <h3>Stage <?= e($lib) ?></h3>
                        <?php if ($att): ?>
                            <p><strong><?= e($att['titre']) ?></strong></p>
                            <p class="muted"><?= e($att['organisme']) ?: '—' ?></p>
                            <p class="muted"><?= e(periodeCourte($att['periode_debut'] ?? null, $att['periode_fin'] ?? null)) ?></p>
                            <a class="btn btn--secondaire btn--petit" href="/<?= e($att['fichier']) ?>" target="_blank" rel="noopener"
                               data-testid="att-link-<?= e($annee) ?>">📄 Voir l'attestation</a>
                            <button type="button" class="btn btn--petit btn--danger edit-only" hidden
                                    data-action="delete-attestation" data-id="<?= e($att['id']) ?>"
                                    data-testid="delete-att-<?= e($annee) ?>">🗑 Supprimer</button>
                        <?php else: ?>
                            <p class="muted">Aucune attestation déposée.</p>
                            <button type="button" class="btn btn--primaire btn--petit edit-only" hidden
                                    data-action="upload-attestation" data-annee="<?= e($annee) ?>"
                                    data-testid="add-att-<?= e($annee) ?>">⤴ Téléverser</button>
                        <?php endif; ?>
                    </article>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- ============================ COMPÉTENCES BLOC 1 ============== -->
    <section id="competences" class="bloc bloc--alt" data-section-id="<?= e($compsSec['id']) ?>">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section-titre" data-section-id="<?= e($compsSec['id']) ?>"
                    data-testid="competences-title"><?= e($compsSec['titre']) ?></h2>
                <p>Référentiel officiel — sous-compétences et indicateurs de performance.</p>
            </header>
            <ul class="liste-competences" data-testid="competences-list">
                <?php foreach ($competences as $c): ?>
                    <li class="competence-bloc">
                        <header class="competence-bloc__entete">
                            <span class="competence__code"><?= e($c['code']) ?></span>
                            <h3 class="competence__titre"><?= e($c['libelle']) ?></h3>
                        </header>
                        <?php if (!empty($c['sous_competences'])): ?>
                            <details>
                                <summary>Sous-compétences (<?= count($c['sous_competences']) ?>)</summary>
                                <ul class="sous-liste">
                                    <?php foreach ($c['sous_competences'] as $sc): ?>
                                        <li><?= e($sc['libelle']) ?></li>
                                    <?php endforeach; ?>
                                </ul>
                            </details>
                        <?php endif; ?>
                        <?php if (!empty($c['indicateurs'])): ?>
                            <details>
                                <summary>Indicateurs de performance (<?= count($c['indicateurs']) ?>)</summary>
                                <ul class="sous-liste sous-liste--indic">
                                    <?php foreach ($c['indicateurs'] as $i): ?>
                                        <li><?= e($i['libelle']) ?></li>
                                    <?php endforeach; ?>
                                </ul>
                            </details>
                        <?php endif; ?>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </section>

    <!-- ============================ VEILLE ========================== -->
    <section id="veille" class="bloc" data-section-id="<?= e($veille['id']) ?>">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section-titre" data-section-id="<?= e($veille['id']) ?>"
                    data-testid="veille-title"><?= e($veille['titre']) ?></h2>
                <p data-edit="section-soustitre" data-section-id="<?= e($veille['id']) ?>"
                   data-testid="veille-subtitle"><?= e($veille['sous_titre']) ?></p>
            </header>
            <div class="prose" data-edit="contenu" data-section-id="<?= e($veille['id']) ?>"
                 data-cle="texte_principal" data-testid="veille-content">
                <?= nl2br(e($contenusParSection['veille']['texte_principal']['valeur']
                    ?? '✍️ Présentez vos sujets de veille, vos sources et vos synthèses (C1.6).')) ?>
            </div>
        </div>
    </section>

    <!-- ============================ CONTACT ========================= -->
    <section id="contact" class="bloc bloc--alt" data-section-id="<?= e($contact['id']) ?>">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section-titre" data-section-id="<?= e($contact['id']) ?>"
                    data-testid="contact-title"><?= e($contact['titre']) ?></h2>
                <p data-edit="section-soustitre" data-section-id="<?= e($contact['id']) ?>"
                   data-testid="contact-subtitle"><?= e($contact['sous_titre']) ?></p>
            </header>
            <div class="prose" data-edit="contenu" data-section-id="<?= e($contact['id']) ?>"
                 data-cle="texte_principal" data-testid="contact-content">
                <?= nl2br(e($contenusParSection['contact']['texte_principal']['valeur']
                    ?? '✍️ Email, LinkedIn, GitHub… Comment vous joindre ?')) ?>
            </div>
        </div>
    </section>
</main>

<?php require ROOT . '/vues/partials/footer.php'; ?>
