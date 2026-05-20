/* ============================================================================
 * assets/js/app.js — Portfolio BTS SIO (version statique, GitHub Pages)
 * ----------------------------------------------------------------------------
 * Architecture façon MVC en JavaScript :
 *  - MODÈLE      : App.data (chargé depuis data/portfolio.json + localStorage)
 *  - VUE         : fonctions render* qui produisent du HTML
 *  - CONTRÔLEUR  : router (hash), gestionnaires d'événements, fonctions editer*
 *
 * ROUTES (basées sur location.hash) :
 *  - #/                       → page d'accueil
 *  - #/competence/C1.1        → fiche détaillée d'une compétence avec
 *                                reformulation perso, sous-compétences,
 *                                indicateurs et liste des réalisations
 *                                qui mobilisent cette compétence.
 *
 * EXPLOITATION DES DONNÉES (C1.3) :
 *  Le fichier data/portfolio.json joue le rôle d'une base de données.
 *  L'application calcule dynamiquement :
 *   - compteur de réalisations par catégorie
 *   - taux de couverture des 6 compétences
 *   - filtre des réalisations par compétence (page compétence)
 *  -> démontre l'EXPLOITATION et l'AGRÉGATION des données.
 * ============================================================================ */
'use strict';

const App = {
    data: null,
    modeEdition: false,
    LS_KEY: 'portfolio-btssio-data-v2',
};

const LIBELLES_CAT = {
    formation:  'En cours de formation',
    pro_annee1: 'Milieu pro · 1ère année',
    pro_annee2: 'Milieu pro · 2ème année',
};

// =============================================================================
// UTILITAIRES
// =============================================================================
function esc(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function nl2br(v) { return esc(v).replace(/\n/g, '<br>'); }

function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (typeof v === 'boolean') { if (v) el.setAttribute(k, ''); }
        else el.setAttribute(k, v);
    }
    for (const c of children.flat()) {
        if (c == null || c === false) continue;
        el.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return el;
}

function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', 'status');
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}

function periodeCourte(d, f) {
    const fmt = (s) => s ? new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '…';
    if (!d && !f) return '—';
    return `du ${fmt(d)} au ${fmt(f)}`;
}

function sauverLocal() {
    try { localStorage.setItem(App.LS_KEY, JSON.stringify(App.data)); }
    catch (e) { console.warn('Sauvegarde localStorage échouée', e); }
}

/** Construit un lien vers la page d'une compétence. */
function lienCompetence(code, contenuHTML, classe = 'puce') {
    return `<a href="#/competence/${esc(code)}" class="${classe}" data-testid="lien-${esc(code)}">${contenuHTML}</a>`;
}

// =============================================================================
// CHARGEMENT DES DONNÉES
// =============================================================================
async function chargerDonnees() {
    const local = localStorage.getItem(App.LS_KEY);
    if (local) {
        try { App.data = JSON.parse(local); return; }
        catch (e) { console.warn('localStorage corrompu, on charge JSON officiel'); }
    }
    const r = await fetch('data/portfolio.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('Impossible de charger data/portfolio.json');
    App.data = await r.json();
}

// =============================================================================
// FONCTIONS D'EXPLOITATION DES DONNÉES (statistiques)
// =============================================================================
function statistiques() {
    const reals = App.data.realisations || [];
    const codes = new Set();
    let nbPreuves = 0;
    for (const r of reals) {
        (r.competences || []).forEach(c => codes.add(c.code));
        nbPreuves += (r.preuves || []).length;
    }
    return {
        nbReals: reals.length,
        nbFormation:  reals.filter(r => r.categorie === 'formation').length,
        nbAnnee1:     reals.filter(r => r.categorie === 'pro_annee1').length,
        nbAnnee2:     reals.filter(r => r.categorie === 'pro_annee2').length,
        nbCompMob:    codes.size,
        tauxCouv:     Math.round((codes.size / App.data.competences.length) * 100),
        nbPreuves,
    };
}

/** Liste les réalisations qui mobilisent une compétence donnée. */
function realisationsParCompetence(code) {
    return (App.data.realisations || []).filter(r =>
        (r.competences || []).some(c => c.code === code)
    );
}

// =============================================================================
// VUES (rendu HTML)
// =============================================================================

function renderHero() {
    const { profil, sections } = App.data;
    const hero = sections.hero;
    const nomComplet = (profil.prenom || profil.nom)
        ? `${profil.prenom || ''} ${(profil.nom || '').toUpperCase()}`.trim()
        : hero.titre;
    const sousTitre = profil.option_sio
        ? `Étudiant·e en BTS SIO — option ${esc(profil.option_sio)}${profil.session ? ' · session ' + esc(profil.session) : ''}`
        : esc(hero.sous_titre);

    return `
    <section id="hero" class="hero">
        <div class="conteneur hero__inner">
            <div class="hero__texte">
                <p class="hero__eyebrow">Portfolio · BTS SIO · Épreuve E5 — Bloc 1</p>
                <h1 class="hero__titre" data-edit="section" data-section="hero" data-champ="titre"
                    data-testid="hero-title">${esc(nomComplet)}</h1>
                <p class="hero__sous-titre" data-edit="section" data-section="hero" data-champ="sous_titre"
                   data-testid="hero-subtitle">${sousTitre}</p>
                <p class="hero__intro" data-edit="section" data-section="hero" data-champ="texte_principal"
                   data-testid="hero-intro">${nl2br(hero.texte_principal) || '<em style="color:#94a3b8">✍️ Cliquez sur « Mode édition » pour vous présenter ici.</em>'}</p>
                <div class="hero__cta">
                    <a class="btn btn--primaire" href="#realisations">Voir mes réalisations</a>
                    <a class="btn btn--secondaire" href="#synthese">Tableau de synthèse</a>
                </div>
            </div>
            <div class="hero__visuel" aria-hidden="true">
                <div class="hero__cercle"></div>
                <div class="hero__motif"></div>
            </div>
        </div>
    </section>`;
}

function renderStats() {
    const s = statistiques();
    const cell = (val, lib, testid) => `
        <div class="stat-cell" data-testid="${testid}">
            <div class="stat-cell__val">${val}</div>
            <div class="stat-cell__lib">${lib}</div>
        </div>`;
    return `
    <section id="stats" class="bloc bloc--stats" aria-label="Statistiques exploitées depuis les données">
        <div class="conteneur">
            <div class="stat-grille" data-testid="stats-grille">
                ${cell(s.nbReals, 'Réalisations', 'stat-reals')}
                ${cell(s.nbFormation, 'En formation', 'stat-formation')}
                ${cell(s.nbAnnee1, 'Pro 1ère année', 'stat-annee1')}
                ${cell(s.nbAnnee2, 'Pro 2ème année', 'stat-annee2')}
                ${cell(`${s.nbCompMob}/6`, 'Compétences mobilisées', 'stat-comps')}
                ${cell(`${s.tauxCouv}%`, 'Taux de couverture', 'stat-couv')}
                ${cell(s.nbPreuves, 'Preuves', 'stat-preuves')}
            </div>
            <p class="stat-explication">
                <em>Ces statistiques sont calculées dynamiquement à partir des données du portfolio
                (fichier <code>data/portfolio.json</code>) — exploitation des données structurées en JavaScript.</em>
            </p>
        </div>
    </section>`;
}

function renderProfil() {
    const p = App.data.profil;
    const champs = [
        ['NOM', p.nom, 'profil-nom'],
        ['Prénom', p.prenom, 'profil-prenom'],
        ['N° candidat', p.numero_candidat, 'profil-numero'],
        ['SESSION', p.session, 'profil-session'],
        ['Option', p.option_sio, 'profil-option'],
        ['Établissement', p.etablissement, 'profil-etab'],
    ];
    return `
    <section id="profil" class="bloc bloc--profil">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-testid="profil-title">Identification du candidat</h2>
                <p>Informations administratives pour l'épreuve E5.</p>
            </header>
            <dl class="profil-grille" data-testid="profil-grille">
                ${champs.map(([k, v, tid]) => `
                    <div><dt>${esc(k)}</dt><dd data-testid="${tid}">${esc(v) || '—'}</dd></div>
                `).join('')}
            </dl>
            <div class="bloc__actions-edition" hidden>
                <button type="button" class="btn btn--primaire" data-edit="profil" data-testid="edit-profil">
                    ✎ Modifier mon profil
                </button>
            </div>
        </div>
    </section>`;
}

function renderSectionTexte(code, testidPrefix, defaultText) {
    const s = App.data.sections[code] || {};
    const isAlt = ['apropos','attestations','contact'].includes(code) ? ' bloc--alt' : '';
    return `
    <section id="${code}" class="bloc${isAlt}">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section" data-section="${code}" data-champ="titre"
                    data-testid="${testidPrefix}-title">${esc(s.titre || '')}</h2>
                <p data-edit="section" data-section="${code}" data-champ="sous_titre"
                   data-testid="${testidPrefix}-subtitle">${esc(s.sous_titre || '')}</p>
            </header>
            <div class="prose" data-edit="section" data-section="${code}" data-champ="texte_principal"
                 data-testid="${testidPrefix}-content">${nl2br(s.texte_principal) || `<em style="color:#94a3b8">✍️ ${defaultText}</em>`}</div>
        </div>
    </section>`;
}

function renderRealisations() {
    const s = App.data.sections.realisations;
    const reals = App.data.realisations || [];
    const parCat = { formation: [], pro_annee1: [], pro_annee2: [] };
    for (const r of reals) (parCat[r.categorie] || parCat.formation).push(r);

    const sectionBloc = (label, html) => html
        ? `<div class="carte__sous-bloc"><strong>${label} :</strong><div>${html}</div></div>`
        : '';

    const carte = (r) => `
        <article class="carte" data-realisation-id="${esc(r.id)}" data-testid="realisation-${esc(r.id)}">
            <header class="carte__entete">
                <h4 class="carte__titre">${esc(r.titre)}</h4>
                <time class="carte__date">${esc(periodeCourte(r.periode_debut, r.periode_fin))}</time>
            </header>
            ${r.contexte    ? sectionBloc('Contexte', nl2br(r.contexte)) : ''}
            ${r.objectifs   ? sectionBloc('Objectifs', nl2br(r.objectifs)) : ''}
            ${r.demarche    ? sectionBloc('Démarche', nl2br(r.demarche)) : ''}
            ${r.description ? sectionBloc('Description', nl2br(r.description)) : ''}
            ${r.contribution_personnelle ? `<div class="carte__contrib"><strong>⭐ Ma contribution personnelle :</strong> ${nl2br(r.contribution_personnelle)}</div>` : ''}
            ${r.resultats   ? sectionBloc('Résultats', nl2br(r.resultats)) : ''}
            ${r.bilan       ? sectionBloc('Bilan personnel', nl2br(r.bilan)) : ''}
            ${r.travail_equipe ? `<p class="carte__equipe"><span class="puce puce--equipe">👥 Travail en équipe projet</span></p>` : ''}
            ${r.technologies ? `<p class="carte__tech"><strong>Technologies :</strong> ${esc(r.technologies)}</p>` : ''}
            ${r.competences?.length ? `<div class="carte__competences">
                <strong>Compétences mobilisées :</strong>
                ${r.competences.map(c => {
                    const comp = App.data.competences.find(x => x.code === c.code);
                    const label = `${esc(c.code)} — ${esc(comp?.libelle || '')}`;
                    return lienCompetence(c.code, label, 'puce puce--lien');
                }).join('')}
            </div>` : ''}
            ${r.preuves?.length ? `<details class="carte__preuves">
                <summary>📎 Preuves (${r.preuves.length})</summary>
                <ul>${r.preuves.map(p => `<li><a href="${esc(p.fichier)}" target="_blank" rel="noopener">${esc(p.titre)}</a></li>`).join('')}</ul>
            </details>` : ''}
            <div class="carte__actions">
                <button type="button" class="btn btn--petit btn--secondaire"
                        data-edit="realisation" data-realisation-id="${esc(r.id)}"
                        data-testid="edit-realisation-${esc(r.id)}">✎ Modifier</button>
            </div>
        </article>`;

    return `
    <section id="realisations" class="bloc">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section" data-section="realisations" data-champ="titre"
                    data-testid="realisations-title">${esc(s.titre)}</h2>
                <p data-edit="section" data-section="realisations" data-champ="sous_titre"
                   data-testid="realisations-subtitle">${esc(s.sous_titre)}</p>
            </header>
            ${['formation', 'pro_annee1', 'pro_annee2'].map(cat => `
                <h3 class="categorie-titre">${esc(LIBELLES_CAT[cat])} <span class="badge">${parCat[cat].length}</span></h3>
                <div class="grille-cartes" data-testid="realisations-${cat}">
                    ${parCat[cat].length === 0 ? '<p class="vide">Aucune réalisation dans cette catégorie.</p>' : ''}
                    ${parCat[cat].map(carte).join('')}
                </div>
            `).join('')}
            <div class="bloc__actions-edition" hidden>
                <button type="button" class="btn btn--primaire" id="btnAjouterRealisation"
                        data-testid="add-realisation">＋ Ajouter une réalisation</button>
            </div>
        </div>
    </section>`;
}

function renderSynthese() {
    const s = App.data.sections.synthese;
    const reals = App.data.realisations || [];
    const comps = App.data.competences;
    const parCat = { formation: [], pro_annee1: [], pro_annee2: [] };
    for (const r of reals) (parCat[r.categorie] || parCat.formation).push(r);

    const codesMob = (r) => (r.competences || []).map(c => c.code);
    const span = 2 + comps.length;
    let lignes = '';
    for (const cat of ['formation','pro_annee1','pro_annee2']) {
        if (!parCat[cat].length) continue;
        lignes += `<tr class="ligne-categorie"><th colspan="${span}">${esc(LIBELLES_CAT[cat])}</th></tr>`;
        for (const r of parCat[cat]) {
            const mob = codesMob(r);
            lignes += `<tr>
                <th scope="row">${esc(r.titre)}</th>
                <td>${esc(periodeCourte(r.periode_debut, r.periode_fin))}</td>
                ${comps.map(c => mob.includes(c.code)
                    ? `<td class="mob" aria-label="mobilisée">✕</td>`
                    : `<td aria-label="non mobilisée"></td>`).join('')}
            </tr>`;
        }
    }
    if (!lignes) lignes = `<tr><td colspan="${span}" class="vide">Aucune réalisation pour le moment.</td></tr>`;

    return `
    <section id="synthese" class="bloc bloc--alt">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section" data-section="synthese" data-champ="titre"
                    data-testid="synthese-title">${esc(s.titre)}</h2>
                <p>${esc(s.sous_titre)}</p>
            </header>
            <div class="table-scroll">
            <table class="tableau-synthese" data-testid="tableau-synthese"
                   aria-label="Tableau de synthèse des réalisations professionnelles">
                <caption class="sr-only">Tableau de synthèse — Bloc 1</caption>
                <thead><tr>
                    <th scope="col">Réalisation</th>
                    <th scope="col">Période</th>
                    ${comps.map(c => `<th scope="col" title="${esc(c.libelle)}">
                        <a href="#/competence/${esc(c.code)}" style="color:#fff;text-decoration:underline;">${esc(c.code)}</a>
                    </th>`).join('')}
                </tr></thead>
                <tbody>${lignes}</tbody>
            </table>
            </div>
            <p class="legende">
                <strong>Légende — clique pour ouvrir la fiche d'une compétence :</strong>
                ${comps.map(c => `<a href="#/competence/${esc(c.code)}" class="legende-item">
                    <strong>${esc(c.code)}</strong> — ${esc(c.libelle)}</a>`).join('')}
            </p>
            <div class="bloc__actions-edition" hidden>
                <button type="button" class="btn btn--secondaire" onclick="window.print()" data-testid="print-synthese">
                    🖨️ Imprimer le tableau
                </button>
            </div>
        </div>
    </section>`;
}

function renderAttestations() {
    const s = App.data.sections.attestations;
    const att = App.data.attestations || {};
    const bloc = (annee, lib) => {
        const a = att[annee];
        return `
        <article class="attestation" data-testid="attestation-${annee}">
            <h3>Stage ${esc(lib)}</h3>
            ${a ? `
                <p><strong>${esc(a.titre || '')}</strong></p>
                <p class="muted">${esc(a.organisme) || '—'}</p>
                <p class="muted">${esc(periodeCourte(a.periode_debut, a.periode_fin))}</p>
                ${a.fichier ? `<a class="btn btn--secondaire btn--petit" href="${esc(a.fichier)}" target="_blank" rel="noopener"
                   data-testid="att-link-${annee}">📄 Voir l'attestation</a>` : ''}
                <button type="button" class="btn btn--petit btn--secondaire edit-only" hidden
                        data-action="edit-attestation" data-annee="${annee}">✎ Modifier</button>
                <button type="button" class="btn btn--petit btn--danger edit-only" hidden
                        data-action="delete-attestation" data-annee="${annee}"
                        data-testid="delete-att-${annee}">🗑 Supprimer</button>
            ` : `
                <p class="muted">Aucune attestation déposée.</p>
                <button type="button" class="btn btn--primaire btn--petit edit-only" hidden
                        data-action="edit-attestation" data-annee="${annee}"
                        data-testid="add-att-${annee}">＋ Ajouter</button>
            `}
        </article>`;
    };
    return `
    <section id="attestations" class="bloc">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section" data-section="attestations" data-champ="titre"
                    data-testid="attestations-title">${esc(s.titre)}</h2>
                <p>Attestations obligatoires pour le dossier E5 (1ère et 2ème année).</p>
            </header>
            <div class="attestations-grille" data-testid="attestations-list">
                ${bloc('annee1', '1ère année')}${bloc('annee2', '2ème année')}
            </div>
            <p class="muted" style="margin-top:1.5rem;font-size:.85rem;">
                💡 Place les fichiers PDF/PNG/JPG dans le dossier <code>uploads/</code> du repo,
                puis renseigne le chemin <code>uploads/attestation-stage1.pdf</code> dans le formulaire.
            </p>
        </div>
    </section>`;
}

function renderListeCompetences() {
    const s = App.data.sections.competences;
    return `
    <section id="competences" class="bloc bloc--alt">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section" data-section="competences" data-champ="titre"
                    data-testid="competences-title">${esc(s.titre)}</h2>
                <p data-edit="section" data-section="competences" data-champ="sous_titre">${esc(s.sous_titre)}</p>
            </header>
            <ul class="liste-competences" data-testid="competences-list">
                ${App.data.competences.map(c => {
                    const nbReals = realisationsParCompetence(c.code).length;
                    return `
                    <li class="competence-bloc">
                        <header class="competence-bloc__entete">
                            <span class="competence__code">${esc(c.code)}</span>
                            <div>
                                <h3 class="competence__titre">
                                    <a href="#/competence/${esc(c.code)}" data-testid="lien-detail-${esc(c.code)}">${esc(c.libelle)} →</a>
                                </h3>
                                ${c.reformulation ? `<p class="competence__reform"><em>${nl2br(c.reformulation)}</em></p>` : ''}
                            </div>
                            <span class="badge ${nbReals > 0 ? 'badge--ok' : ''}">${nbReals} réalisation${nbReals > 1 ? 's' : ''}</span>
                        </header>
                        <ul class="sous-liste">
                            ${c.sous_competences.map(x => `<li>${esc(x)}</li>`).join('')}
                        </ul>
                    </li>`;
                }).join('')}
            </ul>
        </div>
    </section>`;
}

function renderVeille() {
    const s = App.data.sections.veille;
    const sujets = s.sujets || [];
    return `
    <section id="veille" class="bloc">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section" data-section="veille" data-champ="titre"
                    data-testid="veille-title">${esc(s.titre)}</h2>
                <p data-edit="section" data-section="veille" data-champ="sous_titre"
                   data-testid="veille-subtitle">${esc(s.sous_titre)}</p>
            </header>
            <div class="prose" data-edit="section" data-section="veille" data-champ="texte_principal"
                 data-testid="veille-content">${nl2br(s.texte_principal) || '<em style="color:#94a3b8">✍️ Décris ta méthode de veille (outils, fréquence, sources principales)</em>'}</div>

            <h3 style="margin-top:2rem;font-family:var(--police-titre);">Mes sujets de veille</h3>
            <div class="grille-veille" data-testid="veille-sujets">
                ${sujets.length === 0
                    ? '<p class="vide">Aucun sujet de veille pour le moment.</p>'
                    : sujets.map((su, i) => `
                    <article class="veille-sujet" data-testid="veille-sujet-${i}">
                        <h4>${esc(su.titre)}</h4>
                        ${su.description ? `<p>${nl2br(su.description)}</p>` : ''}
                        ${su.sources?.length ? `
                            <p class="muted"><strong>Sources :</strong></p>
                            <ul class="sources-liste">
                                ${su.sources.map(s => `<li><a href="${esc(s.url || '#')}" target="_blank" rel="noopener">${esc(s.titre || s.url)}</a></li>`).join('')}
                            </ul>` : ''}
                        ${su.synthese ? `<details><summary>📝 Synthèse</summary><p>${nl2br(su.synthese)}</p></details>` : ''}
                        <div class="carte__actions">
                            <button type="button" class="btn btn--petit btn--secondaire edit-only" hidden
                                    data-action="edit-veille-sujet" data-index="${i}">✎ Modifier</button>
                            <button type="button" class="btn btn--petit btn--danger edit-only" hidden
                                    data-action="delete-veille-sujet" data-index="${i}">🗑</button>
                        </div>
                    </article>`).join('')}
            </div>
            <div class="bloc__actions-edition" hidden>
                <button type="button" class="btn btn--primaire" data-action="add-veille-sujet"
                        data-testid="add-veille-sujet">＋ Ajouter un sujet de veille</button>
            </div>
        </div>
    </section>`;
}

// =============================================================================
// PAGE DÉDIÉE D'UNE COMPÉTENCE (route #/competence/Cx.y)
// =============================================================================
function renderPageCompetence(code) {
    const c = App.data.competences.find(x => x.code === code);
    if (!c) return `<section class="bloc"><div class="conteneur">
        <p>Compétence inconnue : ${esc(code)}.</p>
        <a class="btn btn--secondaire" href="#/">← Retour</a>
    </div></section>`;

    const reals = realisationsParCompetence(code);

    return `
    <section class="bloc bloc--competence" data-testid="page-competence-${esc(code)}">
        <div class="conteneur">
            <a class="lien-retour" href="#/" data-testid="lien-retour">← Retour au portfolio</a>

            <header class="competence-page__header">
                <span class="competence__code competence__code--big">${esc(c.code)}</span>
                <div>
                    <h1 class="competence-page__titre" data-testid="competence-titre">${esc(c.libelle)}</h1>
                    <p class="competence-page__sous-titre">Compétence du Bloc 1 — Épreuve E5</p>
                </div>
            </header>

            <article class="competence-page__bloc">
                <h2>📝 Ma reformulation personnelle</h2>
                <p class="muted" style="font-size:.9rem;">Explique cette compétence avec TES mots, dans le contexte de TES réalisations (c'est ce que le jury veut entendre).</p>
                <div class="prose competence-page__reform" data-edit="competence-reform" data-code="${esc(c.code)}"
                     data-testid="competence-reformulation">
                    ${c.reformulation ? nl2br(c.reformulation) : '<em style="color:#94a3b8">✍️ En mode édition, clique ici pour reformuler la compétence avec tes propres mots.</em>'}
                </div>
            </article>

            <article class="competence-page__bloc">
                <h2>🎯 Sous-compétences (référentiel officiel)</h2>
                <p class="muted" style="font-size:.9rem;">Voici ce que tu dois savoir faire pour valider cette compétence.</p>
                <ul class="sous-liste sous-liste--visible">
                    ${c.sous_competences.map(x => `<li>${esc(x)}</li>`).join('')}
                </ul>
            </article>

            <article class="competence-page__bloc">
                <h2>📊 Indicateurs de performance (critères du jury)</h2>
                <ul class="sous-liste sous-liste--indic sous-liste--visible">
                    ${c.indicateurs.map(x => `<li>${esc(x)}</li>`).join('')}
                </ul>
            </article>

            <article class="competence-page__bloc">
                <h2>🚀 Mes réalisations qui mobilisent cette compétence
                    <span class="badge ${reals.length > 0 ? 'badge--ok' : ''}">${reals.length}</span>
                </h2>
                ${reals.length === 0 ? '<p class="vide">Aucune réalisation ne mobilise encore cette compétence. Ajoutes-en une et lie-la à cette compétence !</p>' : ''}
                <div class="grille-cartes" data-testid="reals-de-competence">
                    ${reals.map(r => {
                        const justif = r.competences.find(x => x.code === code)?.justification || '';
                        return `
                        <article class="carte" data-realisation-id="${esc(r.id)}">
                            <header class="carte__entete">
                                <h4 class="carte__titre">${esc(r.titre)}</h4>
                                <span class="puce">${esc(LIBELLES_CAT[r.categorie] || r.categorie)}</span>
                            </header>
                            <p class="carte__date">${esc(periodeCourte(r.periode_debut, r.periode_fin))}</p>
                            ${justif ? `<div class="carte__contrib"><strong>Comment ${esc(code)} a été mobilisée :</strong> ${nl2br(justif)}</div>` : '<p class="muted"><em>Pas encore de justification — ajoutes-en une via le formulaire de la réalisation.</em></p>'}
                            <p><a href="#realisations" class="btn btn--petit btn--secondaire">Voir la réalisation complète</a></p>
                        </article>`;
                    }).join('')}
                </div>
            </article>
        </div>
    </section>`;
}

// =============================================================================
// ASSEMBLAGE ET ROUTEUR
// =============================================================================
function renderHome() {
    return [
        renderHero(),
        renderStats(),
        renderProfil(),
        renderSectionTexte('apropos', 'apropos', 'Décrivez votre parcours de professionnalisation.'),
        renderRealisations(),
        renderSynthese(),
        renderAttestations(),
        renderListeCompetences(),
        renderVeille(),
        renderSectionTexte('contact', 'contact', 'Email, LinkedIn, GitHub…'),
    ].join('');
}

function renderApp() {
    const hash = window.location.hash || '#/';
    let html;
    const matchComp = hash.match(/^#\/competence\/(C\d\.\d)$/);
    if (matchComp) {
        html = renderPageCompetence(matchComp[1]);
        document.querySelector('.entete__nav')?.classList.add('entete__nav--mince');
    } else {
        html = renderHome();
        document.querySelector('.entete__nav')?.classList.remove('entete__nav--mince');
    }
    document.getElementById('appRoot').innerHTML = html;
    document.querySelectorAll('.bloc__actions-edition').forEach(el => { el.hidden = !App.modeEdition; });
    document.querySelectorAll('.edit-only').forEach(el => { el.hidden = !App.modeEdition; });
    // Si on est sur une page compétence, on remonte en haut
    if (matchComp) window.scrollTo({ top: 0, behavior: 'instant' });
}

// =============================================================================
// MODE ÉDITION + PANNEAU LATÉRAL
// =============================================================================
function basculerModeEdition() {
    App.modeEdition = !App.modeEdition;
    document.body.classList.toggle('mode-edition', App.modeEdition);
    const btn = document.getElementById('btnModeEdition');
    btn.setAttribute('aria-pressed', String(App.modeEdition));
    btn.innerHTML = App.modeEdition
        ? '<span aria-hidden="true">✓</span> Mode édition actif'
        : '<span aria-hidden="true">✎</span> Mode édition';
    document.querySelectorAll('.bloc__actions-edition').forEach(el => { el.hidden = !App.modeEdition; });
    document.querySelectorAll('.edit-only').forEach(el => { el.hidden = !App.modeEdition; });
    document.getElementById('barreEdition').hidden = !App.modeEdition;
    toast(App.modeEdition ? 'Mode édition activé — pense à exporter ton JSON !' : 'Mode lecture');
}

function ouvrirPanneau(titre, contenu) {
    document.getElementById('panneauTitre').textContent = titre;
    document.getElementById('panneauCorps').replaceChildren(...(Array.isArray(contenu) ? contenu : [contenu]));
    document.getElementById('panneauEdition').classList.add('ouvert');
    document.getElementById('panneauEdition').setAttribute('aria-hidden', 'false');
    document.getElementById('overlayPanneau').hidden = false;
}
function fermerPanneau() {
    document.getElementById('panneauEdition').classList.remove('ouvert');
    document.getElementById('panneauEdition').setAttribute('aria-hidden', 'true');
    document.getElementById('overlayPanneau').hidden = true;
}

function actionsPanneau(onSave, testidSave = 'save-btn', extra = null) {
    return h('div', { class: 'actions', style: 'border-top:1px solid var(--c-bord);padding-top:1rem;' },
        h('button', { class: 'btn btn--primaire', type: 'button', 'data-testid': testidSave,
            onclick: () => {
                try { onSave(); }
                catch (e) { toast('Erreur : ' + e.message, 'erreur'); return; }
                sauverLocal(); renderApp(); fermerPanneau();
                toast('Enregistré localement — n\'oublie pas d\'exporter !', 'succes');
            }
        }, 'Enregistrer'),
        extra,
        h('button', { class: 'btn btn--secondaire', type: 'button', onclick: fermerPanneau }, 'Annuler'),
    );
}

function editerSection(code) {
    const s = App.data.sections[code];
    if (!s) return;
    const refs = {};
    const corps = [];
    const labels = { titre: 'Titre', sous_titre: 'Sous-titre', texte_principal: 'Contenu' };
    for (const c of ['titre', 'sous_titre', 'texte_principal']) {
        if (s[c] === undefined) continue;
        corps.push(h('label', { for: 'f_' + c }, labels[c]));
        if (c === 'texte_principal') {
            const ta = h('textarea', { id: 'f_' + c, rows: 8 }, s[c] || '');
            refs[c] = ta; corps.push(ta);
        } else {
            const inp = h('input', { type: 'text', id: 'f_' + c, value: s[c] || '' });
            refs[c] = inp; corps.push(inp);
        }
    }
    corps.push(actionsPanneau(() => { for (const k in refs) s[k] = refs[k].value; }, 'save-section-btn'));
    ouvrirPanneau('Modifier la section', corps);
    setTimeout(() => corps[1]?.focus?.(), 50);
}

function editerProfil() {
    const p = App.data.profil;
    const champs = [
        ['nom', 'NOM', 'text'], ['prenom', 'Prénom', 'text'],
        ['numero_candidat', 'N° candidat', 'text'], ['session', 'SESSION', 'text'],
        ['option_sio', 'Option BTS SIO', 'select'], ['etablissement', 'Établissement', 'text'],
    ];
    const refs = {}; const corps = [];
    for (const [key, lab, type] of champs) {
        corps.push(h('label', { for: 'p_' + key }, lab));
        if (type === 'select') {
            const sel = h('select', { id: 'p_' + key, 'data-testid': 'edit-profil-option' },
                h('option', { value: '' }, '— Choisir —'),
                h('option', { value: 'SISR' }, 'SISR'),
                h('option', { value: 'SLAM' }, 'SLAM'),
            );
            sel.value = p[key] || '';
            corps.push(sel); refs[key] = sel;
        } else {
            const inp = h('input', { type, id: 'p_' + key, value: p[key] || '', 'data-testid': 'edit-profil-' + key });
            corps.push(inp); refs[key] = inp;
        }
    }
    corps.push(actionsPanneau(() => { for (const [k] of champs) p[k] = refs[k].value; }, 'save-profil-btn'));
    ouvrirPanneau('Identification du candidat (E5)', corps);
}

function editerCompetenceReform(code) {
    const c = App.data.competences.find(x => x.code === code);
    if (!c) return;
    const ta = h('textarea', { id: 'cr', rows: 6 }, c.reformulation || '');
    ouvrirPanneau(`Reformuler ${code}`, [
        h('p', { style: 'color:#64748b;font-size:.9rem;' },
            `Compétence officielle : "${c.libelle}". Reformule en TES mots, dans le contexte de TES réalisations. Exemple : "Pour moi, ${c.code} a consisté à ..."`),
        h('label', { for: 'cr' }, 'Reformulation personnelle'),
        ta,
        actionsPanneau(() => { c.reformulation = ta.value; }, 'save-reform-btn'),
    ]);
    setTimeout(() => ta.focus(), 50);
}

function editerRealisation(idOrNew) {
    const isNew = idOrNew === '__new__';
    const real = isNew
        ? { id: Date.now(), titre: 'Nouvelle réalisation', categorie: 'formation', competences: [], preuves: [] }
        : (App.data.realisations || []).find(r => String(r.id) === String(idOrNew));
    if (!real) { toast('Réalisation introuvable', 'erreur'); return; }
    real.competences ??= []; real.preuves ??= [];

    const refs = {
        titre:        h('input', { type: 'text', id: 'r_t', value: real.titre || '', 'data-testid': 'edit-real-titre' }),
        categorie:    h('select', { id: 'r_c', 'data-testid': 'edit-real-categorie' },
            ...['formation','pro_annee1','pro_annee2'].map(c => h('option', { value: c }, LIBELLES_CAT[c]))),
        periode_debut: h('input', { type: 'date', id: 'r_pd', value: real.periode_debut || '' }),
        periode_fin:   h('input', { type: 'date', id: 'r_pf', value: real.periode_fin || '' }),
        contexte:     h('textarea', { id: 'r_ctx', rows: 2 }, real.contexte || ''),
        objectifs:    h('textarea', { id: 'r_obj', rows: 2 }, real.objectifs || ''),
        demarche:     h('textarea', { id: 'r_dem', rows: 3 }, real.demarche || ''),
        description:  h('textarea', { id: 'r_desc', rows: 3 }, real.description || ''),
        contribution: h('textarea', { id: 'r_ctb', rows: 3, 'data-testid': 'edit-real-contribution' }, real.contribution_personnelle || ''),
        resultats:    h('textarea', { id: 'r_res', rows: 2 }, real.resultats || ''),
        bilan:        h('textarea', { id: 'r_bil', rows: 2 }, real.bilan || ''),
        travail_equipe: h('input', { type: 'checkbox', id: 'r_eq', ...(real.travail_equipe ? { checked: '' } : {}) }),
        technologies: h('input', { type: 'text', id: 'r_tec', value: real.technologies || '' }),
        lien:         h('input', { type: 'url',  id: 'r_lien', value: real.lien || '' }),
    };
    refs.categorie.value = real.categorie || 'formation';

    const compsContainer = h('div', { class: 'competences-liste' });
    function refreshComps() {
        compsContainer.replaceChildren();
        if (!real.competences.length) compsContainer.append(h('p', {}, 'Aucune compétence associée.'));
        for (const c of real.competences) {
            const comp = App.data.competences.find(x => x.code === c.code);
            const justifInput = h('input', { type: 'text', value: c.justification || '',
                placeholder: 'Justification (pour l\'oral E5)', style: 'flex:1;',
                oninput: (e) => { c.justification = e.target.value; } });
            compsContainer.append(h('div', { class: 'competence-item', style: 'flex-direction:column;align-items:stretch;gap:.35rem;' },
                h('div', { style: 'display:flex;justify-content:space-between;align-items:center;' },
                    h('strong', {}, `${c.code} — ${comp?.libelle || ''}`),
                    h('button', { class: 'btn btn--petit btn--danger', type: 'button',
                        onclick: () => { real.competences = real.competences.filter(x => x.code !== c.code); refreshComps(); }
                    }, '×'),
                ),
                justifInput,
            ));
        }
    }
    refreshComps();

    const selectComp = h('select', { id: 'r_compsel' },
        h('option', { value: '' }, '— Choisir une compétence —'),
        ...App.data.competences.map(c => h('option', { value: c.code }, `${c.code} — ${c.libelle}`))
    );
    const justifComp = h('input', { type: 'text', placeholder: 'Justification (pour l\'oral E5)' });

    const preuvesContainer = h('div', { class: 'preuves-liste' });
    function refreshPreuves() {
        preuvesContainer.replaceChildren();
        if (!real.preuves.length) preuvesContainer.append(h('p', {}, 'Aucune preuve.'));
        for (const p of real.preuves) {
            preuvesContainer.append(h('div', { class: 'preuve-item' },
                h('a', { href: p.fichier, target: '_blank', rel: 'noopener' }, p.titre || p.fichier),
                h('button', { class: 'btn btn--petit btn--danger', type: 'button',
                    onclick: () => { real.preuves = real.preuves.filter(x => x !== p); refreshPreuves(); }
                }, '×'),
            ));
        }
    }
    refreshPreuves();
    const preuveTitre   = h('input', { type: 'text', placeholder: 'Titre de la preuve' });
    const preuveFichier = h('input', { type: 'text', placeholder: 'Chemin (ex: uploads/capture.png)' });

    const corps = [
        h('label', { for: 'r_t' }, 'Titre'), refs.titre,
        h('label', { for: 'r_c' }, 'Catégorie (officiel E5)'), refs.categorie,
        h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:.5rem;' },
            h('div', {}, h('label', { for: 'r_pd' }, 'Période — début'), refs.periode_debut),
            h('div', {}, h('label', { for: 'r_pf' }, 'Période — fin'),   refs.periode_fin),
        ),
        h('label', { for: 'r_ctx' }, 'Contexte (où, quand, pour qui ?)'), refs.contexte,
        h('label', { for: 'r_obj' }, 'Objectifs (quel besoin / problème ?)'), refs.objectifs,
        h('label', { for: 'r_dem' }, 'Démarche (étapes suivies)'), refs.demarche,
        h('label', { for: 'r_desc' }, 'Description technique'), refs.description,
        h('label', { for: 'r_ctb' }, '⭐ Ma contribution personnelle (critère officiel E5)'), refs.contribution,
        h('label', { for: 'r_res' }, 'Résultats obtenus (concrets / mesurables)'), refs.resultats,
        h('label', { for: 'r_bil' }, 'Bilan personnel (ce que j\'ai appris)'), refs.bilan,
        h('label', { for: 'r_eq', style: 'display:flex;gap:.5rem;align-items:center;' },
            refs.travail_equipe, ' Réalisation en équipe projet'),
        h('label', { for: 'r_tec' }, 'Technologies / outils'), refs.technologies,
        h('label', { for: 'r_lien' }, 'Lien (optionnel)'), refs.lien,

        h('h3', { style: 'margin:1.5rem 0 .5rem;font-family:var(--police-titre);' }, 'Compétences mobilisées'),
        compsContainer,
        h('label', { for: 'r_compsel' }, 'Ajouter une compétence'),
        selectComp, justifComp,
        h('button', {
            class: 'btn btn--secondaire btn--petit', type: 'button', style: 'margin-bottom:1rem;',
            'data-testid': 'add-competence-link',
            onclick: () => {
                if (!selectComp.value) { toast('Choisissez une compétence', 'erreur'); return; }
                if (real.competences.some(c => c.code === selectComp.value)) { toast('Déjà ajoutée', 'erreur'); return; }
                real.competences.push({ code: selectComp.value, justification: justifComp.value });
                refreshComps();
                selectComp.value = ''; justifComp.value = '';
            }
        }, '＋ Lier cette compétence'),

        h('h3', { style: 'margin:1.5rem 0 .5rem;font-family:var(--police-titre);' }, 'Preuves'),
        preuvesContainer,
        h('label', {}, 'Ajouter une preuve (place d\'abord le fichier dans /uploads/)'),
        preuveTitre, preuveFichier,
        h('button', {
            class: 'btn btn--secondaire btn--petit', type: 'button', style: 'margin-bottom:1rem;',
            onclick: () => {
                if (!preuveFichier.value) { toast('Chemin manquant', 'erreur'); return; }
                real.preuves.push({ titre: preuveTitre.value || preuveFichier.value, fichier: preuveFichier.value });
                refreshPreuves();
                preuveTitre.value = ''; preuveFichier.value = '';
            }
        }, '＋ Ajouter cette preuve'),

        actionsPanneau(() => {
            real.titre = refs.titre.value;
            real.categorie = refs.categorie.value;
            real.periode_debut = refs.periode_debut.value || null;
            real.periode_fin = refs.periode_fin.value || null;
            real.contexte = refs.contexte.value;
            real.objectifs = refs.objectifs.value;
            real.demarche = refs.demarche.value;
            real.description = refs.description.value;
            real.contribution_personnelle = refs.contribution.value;
            real.resultats = refs.resultats.value;
            real.bilan = refs.bilan.value;
            real.travail_equipe = refs.travail_equipe.checked;
            real.technologies = refs.technologies.value;
            real.lien = refs.lien.value;
            if (isNew) App.data.realisations.push(real);
        }, 'save-real-btn',
        !isNew && h('button', { class: 'btn btn--danger', type: 'button', 'data-testid': 'delete-real-btn',
            onclick: () => {
                if (!confirm('Supprimer cette réalisation ?')) return;
                App.data.realisations = App.data.realisations.filter(r => r.id !== real.id);
                sauverLocal(); renderApp(); fermerPanneau(); toast('Supprimée');
            }
        }, '🗑 Supprimer')),
    ];
    ouvrirPanneau(isNew ? 'Nouvelle réalisation' : 'Modifier la réalisation', corps);
}

function editerAttestation(annee) {
    const att = App.data.attestations[annee] || { titre: '', organisme: '', periode_debut: '', periode_fin: '', fichier: '' };
    const r = {
        titre:    h('input', { type: 'text', id: 'a_t', value: att.titre, placeholder: "Stage de découverte / d'application…" }),
        organisme:h('input', { type: 'text', id: 'a_o', value: att.organisme, placeholder: "Nom de l'entreprise" }),
        debut:    h('input', { type: 'date', id: 'a_pd', value: att.periode_debut || '' }),
        fin:      h('input', { type: 'date', id: 'a_pf', value: att.periode_fin || '' }),
        fichier:  h('input', { type: 'text', id: 'a_f', value: att.fichier, placeholder: 'uploads/attestation-stage1.pdf' }),
    };
    ouvrirPanneau(`Attestation — ${annee === 'annee1' ? '1ère' : '2ème'} année`, [
        h('label', { for: 'a_t' }, 'Titre'), r.titre,
        h('label', { for: 'a_o' }, 'Organisme / entreprise'), r.organisme,
        h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:.5rem;' },
            h('div', {}, h('label', { for: 'a_pd' }, 'Début'), r.debut),
            h('div', {}, h('label', { for: 'a_pf' }, 'Fin'),   r.fin),
        ),
        h('label', { for: 'a_f' }, 'Chemin du fichier (PDF/PNG/JPG dans uploads/)'), r.fichier,
        actionsPanneau(() => {
            App.data.attestations[annee] = {
                titre: r.titre.value, organisme: r.organisme.value,
                periode_debut: r.debut.value || null, periode_fin: r.fin.value || null,
                fichier: r.fichier.value,
            };
        }, `save-att-${annee}`),
    ]);
}

function editerVeilleSujet(indexOrNew) {
    const isNew = indexOrNew === '__new__';
    const sujets = App.data.sections.veille.sujets ??= [];
    const sujet = isNew ? { titre: '', description: '', sources: [], synthese: '' } : sujets[indexOrNew];
    if (!sujet) return;
    sujet.sources ??= [];

    const titre       = h('input', { type: 'text', id: 'v_t', value: sujet.titre, placeholder: 'Ex: Sécurité du Cloud, IA générative…' });
    const description = h('textarea', { id: 'v_d', rows: 2 }, sujet.description || '');
    const synthese    = h('textarea', { id: 'v_s', rows: 5 }, sujet.synthese || '');

    const sourcesContainer = h('div', { class: 'preuves-liste' });
    function refreshSources() {
        sourcesContainer.replaceChildren();
        if (!sujet.sources.length) sourcesContainer.append(h('p', {}, 'Aucune source.'));
        for (const s of sujet.sources) {
            sourcesContainer.append(h('div', { class: 'preuve-item' },
                h('span', {}, `${s.titre || ''} — ${s.url || ''}`),
                h('button', { class: 'btn btn--petit btn--danger', type: 'button',
                    onclick: () => { sujet.sources = sujet.sources.filter(x => x !== s); refreshSources(); }
                }, '×'),
            ));
        }
    }
    refreshSources();
    const srcTitre = h('input', { type: 'text', placeholder: 'Titre de la source' });
    const srcUrl   = h('input', { type: 'url',  placeholder: 'https://…' });

    ouvrirPanneau(isNew ? 'Nouveau sujet de veille' : 'Modifier le sujet', [
        h('label', { for: 'v_t' }, 'Titre du sujet'), titre,
        h('label', { for: 'v_d' }, 'Description rapide'), description,
        h('h3', { style: 'margin:1rem 0 .5rem;font-family:var(--police-titre);' }, 'Sources'),
        sourcesContainer,
        srcTitre, srcUrl,
        h('button', {
            class: 'btn btn--secondaire btn--petit', type: 'button', style: 'margin-bottom:1rem;',
            onclick: () => {
                if (!srcUrl.value && !srcTitre.value) return;
                sujet.sources.push({ titre: srcTitre.value, url: srcUrl.value });
                refreshSources();
                srcTitre.value = ''; srcUrl.value = '';
            }
        }, '＋ Ajouter une source'),
        h('label', { for: 'v_s' }, 'Synthèse / ce que tu en retires'), synthese,
        actionsPanneau(() => {
            sujet.titre = titre.value;
            sujet.description = description.value;
            sujet.synthese = synthese.value;
            if (isNew) sujets.push(sujet);
        }, 'save-veille-btn'),
    ]);
}

// =============================================================================
// EXPORT / IMPORT JSON
// =============================================================================
function exporterJSON() {
    const blob = new Blob([JSON.stringify(App.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'portfolio.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast('portfolio.json téléchargé. Place-le dans /data/ et git push !', 'succes');
}
function importerJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            App.data = JSON.parse(reader.result);
            sauverLocal(); renderApp();
            toast('Données importées', 'succes');
        } catch (e) { toast('Fichier invalide : ' + e.message, 'erreur'); }
    };
    reader.readAsText(file);
}
function reinitialiser() {
    if (!confirm('Effacer toutes les modifications locales et recharger le JSON officiel ?')) return;
    localStorage.removeItem(App.LS_KEY);
    location.reload();
}

// =============================================================================
// DÉMARRAGE
// =============================================================================
async function init() {
    document.getElementById('annee').textContent = new Date().getFullYear();
    try {
        await chargerDonnees();
        renderApp();
    } catch (e) {
        document.getElementById('appRoot').innerHTML =
            `<div class="conteneur" style="padding:3rem 0;"><p style="color:#b91c1c;">Erreur : ${esc(e.message)}</p></div>`;
        return;
    }

    document.getElementById('btnModeEdition').addEventListener('click', basculerModeEdition);
    document.getElementById('btnFermerPanneau').addEventListener('click', fermerPanneau);
    document.getElementById('overlayPanneau').addEventListener('click', fermerPanneau);
    document.getElementById('btnExporter').addEventListener('click', exporterJSON);
    document.getElementById('btnReset').addEventListener('click', reinitialiser);
    document.getElementById('btnImporter').addEventListener('click', () => document.getElementById('inputImport').click());
    document.getElementById('inputImport').addEventListener('change', (e) => {
        if (e.target.files[0]) importerJSON(e.target.files[0]);
    });

    window.addEventListener('hashchange', renderApp);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermerPanneau(); });

    document.addEventListener('click', (e) => {
        // Actions globales (data-action) en mode édition
        const act = e.target.closest('[data-action]');
        if (act && App.modeEdition) {
            e.preventDefault();
            const a = act.dataset.action;
            if (a === 'edit-attestation')   editerAttestation(act.dataset.annee);
            if (a === 'delete-attestation') {
                if (confirm('Supprimer cette attestation ?')) {
                    App.data.attestations[act.dataset.annee] = null;
                    sauverLocal(); renderApp(); toast('Supprimée');
                }
            }
            if (a === 'add-veille-sujet')    editerVeilleSujet('__new__');
            if (a === 'edit-veille-sujet')   editerVeilleSujet(Number(act.dataset.index));
            if (a === 'delete-veille-sujet') {
                if (confirm('Supprimer ce sujet de veille ?')) {
                    App.data.sections.veille.sujets.splice(Number(act.dataset.index), 1);
                    sauverLocal(); renderApp(); toast('Supprimé');
                }
            }
            return;
        }
        // Bouton "Ajouter une réalisation"
        if (e.target.closest('#btnAjouterRealisation') && App.modeEdition) {
            e.preventDefault(); editerRealisation('__new__'); return;
        }
        if (!App.modeEdition) return;
        const cible = e.target.closest('[data-edit]');
        if (!cible) return;
        // Ne pas hijacker les liens vers les pages compétences
        if (e.target.closest('a[href^="#/competence/"]')) return;
        e.preventDefault();
        const type = cible.dataset.edit;
        if (type === 'section')      editerSection(cible.dataset.section);
        else if (type === 'profil')  editerProfil();
        else if (type === 'realisation')        editerRealisation(cible.dataset.realisationId);
        else if (type === 'competence-reform')  editerCompetenceReform(cible.dataset.code);
    });
}

document.addEventListener('DOMContentLoaded', init);
