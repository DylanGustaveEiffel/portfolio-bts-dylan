/* ============================================================================
 * assets/js/app.js
 * ----------------------------------------------------------------------------
 * Portfolio BTS SIO — version STATIQUE (GitHub Pages).
 *
 * AVANT : portfolio dynamique en PHP/MySQL (voir /php-mvc/).
 * APRÈS : portfolio statique HTML/CSS/JS — fonctionne SUR GITHUB PAGES.
 *
 * RÔLE :
 *  1) Charge les données depuis /data/portfolio.json
 *  2) Si l'utilisateur a édité en local, écrase avec ce qu'il y a dans localStorage
 *  3) Génère toutes les sections de la page (Profil, Hero, À propos, Réalisations,
 *     Tableau de synthèse, Attestations, Compétences détaillées, Veille, Contact)
 *  4) Mode édition : ouvre un panneau latéral pour modifier les sections, les
 *     réalisations, le profil, etc. Les modifications sont stockées dans
 *     localStorage.
 *  5) Boutons d'export / import JSON pour committer ses changements sur GitHub.
 *
 * Architecture façon MVC (allégée, en JS) :
 *  - MODÈLE      : objet `App.data` (chargé depuis JSON / localStorage)
 *  - VUE         : fonctions `render*` qui produisent du HTML
 *  - CONTRÔLEUR  : `init()`, gestionnaires d'événements, fonctions `editer*`
 * ============================================================================ */
'use strict';

// ---------------------------------------------------------------------------
// 1) ÉTAT GLOBAL
// ---------------------------------------------------------------------------
const App = {
    data: null,         // données du portfolio (chargées au démarrage)
    modeEdition: false, // booléen mode édition
    LS_KEY: 'portfolio-btssio-data-v1', // clé localStorage
};

// ---------------------------------------------------------------------------
// 2) UTILITAIRES
// ---------------------------------------------------------------------------
/** Échappement HTML pour éviter les injections XSS. */
function esc(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
/** Insère <br> au lieu des sauts de ligne (texte multi-ligne). */
function nl2br(v) { return esc(v).replace(/\n/g, '<br>'); }

/** Mini-helper pour créer un élément DOM avec attributs et enfants. */
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

/** Affiche une notification "toast". */
function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', 'status');
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}

/** Formate une période "JJ/MM/AA → JJ/MM/AA" (officiel E5). */
function periodeCourte(d, f) {
    const fmt = (s) => s ? new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '…';
    if (!d && !f) return '—';
    return `du ${fmt(d)} au ${fmt(f)}`;
}

const LIBELLES_CAT = {
    formation:  'En cours de formation',
    pro_annee1: 'Milieu pro · 1ère année',
    pro_annee2: 'Milieu pro · 2ème année',
};

/** Sauvegarde l'état actuel dans localStorage. */
function sauverLocal() {
    try { localStorage.setItem(App.LS_KEY, JSON.stringify(App.data)); }
    catch (e) { console.warn('Sauvegarde localStorage échouée', e); }
}

// ---------------------------------------------------------------------------
// 3) CHARGEMENT DES DONNÉES
// ---------------------------------------------------------------------------
async function chargerDonnees() {
    // 1) On essaie d'abord la copie locale (modifs non encore committées)
    const local = localStorage.getItem(App.LS_KEY);
    if (local) {
        try { App.data = JSON.parse(local); return; }
        catch (e) { console.warn('localStorage corrompu, on charge JSON'); }
    }
    // 2) Sinon on charge le JSON officiel depuis le repo
    const r = await fetch('data/portfolio.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('Impossible de charger data/portfolio.json');
    App.data = await r.json();
}

// ---------------------------------------------------------------------------
// 4) VUES (rendu HTML)
// ---------------------------------------------------------------------------

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
    <section id="hero" class="hero" data-section-code="hero">
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
                    <a class="btn btn--primaire" href="#realisations" data-testid="cta-realisations">Voir mes réalisations</a>
                    <a class="btn btn--secondaire" href="#synthese" data-testid="cta-synthese">Tableau de synthèse</a>
                </div>
            </div>
            <div class="hero__visuel" aria-hidden="true">
                <div class="hero__cercle"></div>
                <div class="hero__motif"></div>
            </div>
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
    const texte = s.texte_principal || `<em style="color:#94a3b8">✍️ ${defaultText}</em>`;
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

    const carte = (r) => `
        <article class="carte" data-realisation-id="${esc(r.id)}" data-testid="realisation-${esc(r.id)}">
            <header class="carte__entete">
                <h4 class="carte__titre">${esc(r.titre)}</h4>
                <time class="carte__date">${esc(periodeCourte(r.periode_debut, r.periode_fin))}</time>
            </header>
            ${r.contexte ? `<p class="carte__contexte"><strong>Contexte :</strong> ${esc(r.contexte)}</p>` : ''}
            ${r.description ? `<p class="carte__desc">${nl2br(r.description)}</p>` : ''}
            ${r.contribution_personnelle ? `<p class="carte__contrib"><strong>Ma contribution :</strong> ${nl2br(r.contribution_personnelle)}</p>` : ''}
            ${r.travail_equipe ? `<p class="carte__equipe"><span class="puce puce--equipe">👥 Travail en équipe</span></p>` : ''}
            ${r.technologies ? `<p class="carte__tech"><strong>Technos :</strong> ${esc(r.technologies)}</p>` : ''}
            ${r.competences?.length ? `<div class="carte__competences">
                ${r.competences.map(c => `<span class="puce" title="${esc(c.justification || '')}">${esc(c.code)}</span>`).join('')}
            </div>` : ''}
            ${r.preuves?.length ? `<details class="carte__preuves">
                <summary>Preuves (${r.preuves.length})</summary>
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
                <h3 class="categorie-titre">${esc(LIBELLES_CAT[cat])}</h3>
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

    const codesMobilises = (r) => (r.competences || []).map(c => c.code);
    const span = 2 + comps.length;

    let lignes = '';
    for (const cat of ['formation','pro_annee1','pro_annee2']) {
        if (!parCat[cat].length) continue;
        lignes += `<tr class="ligne-categorie"><th colspan="${span}">${esc(LIBELLES_CAT[cat])}</th></tr>`;
        for (const r of parCat[cat]) {
            const mob = codesMobilises(r);
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
                    ${comps.map(c => `<th scope="col" title="${esc(c.libelle)}">${esc(c.code)}</th>`).join('')}
                </tr></thead>
                <tbody>${lignes}</tbody>
            </table>
            </div>
            <p class="legende">
                <strong>Légende des compétences :</strong>
                ${comps.map(c => `<span class="legende-item"><strong>${esc(c.code)}</strong> — ${esc(c.libelle)}</span>`).join('')}
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
    const blocAtt = (annee, lib) => {
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
                ${blocAtt('annee1', '1ère année')}
                ${blocAtt('annee2', '2ème année')}
            </div>
            <p class="muted" style="margin-top:1.5rem;font-size:.85rem;">
                💡 Astuce : place tes PDFs d'attestation dans le dossier <code>uploads/</code> du repo,
                puis renseigne le chemin <code>uploads/attestation-stage1.pdf</code> dans le formulaire.
            </p>
        </div>
    </section>`;
}

function renderCompetences() {
    const s = App.data.sections.competences;
    return `
    <section id="competences" class="bloc bloc--alt">
        <div class="conteneur">
            <header class="bloc__entete">
                <h2 data-edit="section" data-section="competences" data-champ="titre"
                    data-testid="competences-title">${esc(s.titre)}</h2>
                <p>Référentiel officiel — sous-compétences et indicateurs de performance.</p>
            </header>
            <ul class="liste-competences" data-testid="competences-list">
                ${App.data.competences.map(c => `
                    <li class="competence-bloc">
                        <header class="competence-bloc__entete">
                            <span class="competence__code">${esc(c.code)}</span>
                            <h3 class="competence__titre">${esc(c.libelle)}</h3>
                        </header>
                        <details>
                            <summary>Sous-compétences (${c.sous_competences.length})</summary>
                            <ul class="sous-liste">
                                ${c.sous_competences.map(x => `<li>${esc(x)}</li>`).join('')}
                            </ul>
                        </details>
                        <details>
                            <summary>Indicateurs de performance (${c.indicateurs.length})</summary>
                            <ul class="sous-liste sous-liste--indic">
                                ${c.indicateurs.map(x => `<li>${esc(x)}</li>`).join('')}
                            </ul>
                        </details>
                    </li>
                `).join('')}
            </ul>
        </div>
    </section>`;
}

/** Assemble toutes les sections de la page. */
function renderApp() {
    const html = [
        renderHero(),
        renderProfil(),
        renderSectionTexte('apropos', 'apropos', 'Décrivez votre parcours de professionnalisation.'),
        renderRealisations(),
        renderSynthese(),
        renderAttestations(),
        renderCompetences(),
        renderSectionTexte('veille', 'veille', 'Présentez vos sujets de veille (C1.6).'),
        renderSectionTexte('contact', 'contact', 'Email, LinkedIn, GitHub…'),
    ].join('');
    document.getElementById('appRoot').innerHTML = html;
    // Réappliquer le mode édition après re-render
    document.querySelectorAll('.bloc__actions-edition').forEach(el => { el.hidden = !App.modeEdition; });
    document.querySelectorAll('.edit-only').forEach(el => { el.hidden = !App.modeEdition; });
}

// ---------------------------------------------------------------------------
// 5) CONTRÔLEURS (mode édition + édition de chaque entité)
// ---------------------------------------------------------------------------

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

/** Petit helper : bouton "Enregistrer" + "Annuler" pour les panneaux. */
function actionsPanneau(onSave, testidSave = 'save-btn') {
    return h('div', { class: 'actions', style: 'border-top:1px solid var(--c-bord);padding-top:1rem;' },
        h('button', { class: 'btn btn--primaire', type: 'button', 'data-testid': testidSave,
            onclick: () => { onSave(); sauverLocal(); renderApp(); fermerPanneau(); toast('Modifications enregistrées localement', 'succes'); }
        }, 'Enregistrer'),
        h('button', { class: 'btn btn--secondaire', type: 'button', onclick: fermerPanneau }, 'Annuler'),
    );
}

function editerSection(code, champ) {
    const s = App.data.sections[code];
    if (!s) return;
    const inputs = {
        titre:           () => h('input', { type: 'text', id: 'f_titre', value: s.titre || '', 'data-testid': 'edit-section-titre-input' }),
        sous_titre:      () => h('input', { type: 'text', id: 'f_sous',  value: s.sous_titre || '', 'data-testid': 'edit-section-soustitre-input' }),
        texte_principal: () => h('textarea', { id: 'f_txt', rows: 8, 'data-testid': 'edit-contenu-textarea' }, s.texte_principal || ''),
    };
    // On ouvre un panneau qui édite tous les champs présents pour la section
    const corps = [];
    for (const c of ['titre','sous_titre','texte_principal']) {
        if (s[c] === undefined) continue;
        const labels = { titre: 'Titre', sous_titre: 'Sous-titre', texte_principal: 'Contenu' };
        corps.push(h('label', { for: 'f_' + c }, labels[c]));
        corps.push(inputs[c]());
    }
    corps.push(actionsPanneau(() => {
        if (s.titre !== undefined)           s.titre = document.getElementById('f_titre').value;
        if (s.sous_titre !== undefined)      s.sous_titre = document.getElementById('f_sous').value;
        if (s.texte_principal !== undefined) s.texte_principal = document.getElementById('f_txt').value;
    }, 'save-section-btn'));

    ouvrirPanneau('Modifier la section', corps);
    setTimeout(() => document.getElementById('f_titre')?.focus(), 50);
}

function editerProfil() {
    const p = App.data.profil;
    const champs = [
        ['nom', 'NOM', 'text'],
        ['prenom', 'Prénom', 'text'],
        ['numero_candidat', 'N° candidat', 'text'],
        ['session', 'SESSION', 'text'],
        ['option_sio', 'Option BTS SIO', 'select'],
        ['etablissement', 'Établissement', 'text'],
    ];
    const refs = {};
    const corps = [];
    for (const [key, lab, type] of champs) {
        corps.push(h('label', { for: 'p_' + key }, lab));
        if (type === 'select') {
            const sel = h('select', { id: 'p_' + key, 'data-testid': 'edit-profil-option' },
                h('option', { value: '' }, '— Choisir —'),
                h('option', { value: 'SISR' }, 'SISR'),
                h('option', { value: 'SLAM' }, 'SLAM'),
            );
            sel.value = p[key] || '';
            corps.push(sel);
            refs[key] = sel;
        } else {
            const inp = h('input', { type, id: 'p_' + key, value: p[key] || '', 'data-testid': 'edit-profil-' + key });
            corps.push(inp);
            refs[key] = inp;
        }
    }
    corps.push(actionsPanneau(() => {
        for (const [key] of champs) p[key] = refs[key].value;
    }, 'save-profil-btn'));
    ouvrirPanneau('Identification du candidat (E5)', corps);
}

function editerRealisation(idOrNew) {
    const isNew = idOrNew === '__new__';
    const real = isNew
        ? { id: Date.now(), titre: 'Nouvelle réalisation', categorie: 'formation', competences: [], preuves: [] }
        : (App.data.realisations || []).find(r => String(r.id) === String(idOrNew));
    if (!real) { toast('Réalisation introuvable', 'erreur'); return; }
    if (!real.competences) real.competences = [];
    if (!real.preuves) real.preuves = [];

    const refs = {
        titre:        h('input', { type: 'text', id: 'r_t', value: real.titre || '', 'data-testid': 'edit-real-titre' }),
        categorie:    h('select', { id: 'r_c', 'data-testid': 'edit-real-categorie' },
            ...['formation','pro_annee1','pro_annee2'].map(c => h('option', { value: c }, LIBELLES_CAT[c]))),
        periode_debut: h('input', { type: 'date', id: 'r_pd', value: real.periode_debut || '' }),
        periode_fin:   h('input', { type: 'date', id: 'r_pf', value: real.periode_fin || '' }),
        contexte:     h('textarea', { id: 'r_ctx', rows: 2 }, real.contexte || ''),
        description:  h('textarea', { id: 'r_desc', rows: 4 }, real.description || ''),
        contribution: h('textarea', { id: 'r_ctb', rows: 3, 'data-testid': 'edit-real-contribution' }, real.contribution_personnelle || ''),
        travail_equipe: h('input', { type: 'checkbox', id: 'r_eq', ...(real.travail_equipe ? { checked: '' } : {}) }),
        technologies: h('input', { type: 'text', id: 'r_tec', value: real.technologies || '' }),
        lien:         h('input', { type: 'url',  id: 'r_lien', value: real.lien || '' }),
    };
    refs.categorie.value = real.categorie || 'formation';

    // Compétences associées
    const compsContainer = h('div', { class: 'competences-liste' });
    function refreshComps() {
        compsContainer.replaceChildren();
        if (!real.competences.length) compsContainer.append(h('p', {}, 'Aucune compétence associée.'));
        for (const c of real.competences) {
            const comp = App.data.competences.find(x => x.code === c.code);
            compsContainer.append(h('div', { class: 'competence-item' },
                h('div', {},
                    h('strong', {}, c.code + ' '),
                    comp?.libelle || '',
                    c.justification ? h('div', { style: 'font-size:.85rem;color:#666;' }, c.justification) : null,
                ),
                h('button', { class: 'btn btn--petit btn--danger', type: 'button',
                    onclick: () => { real.competences = real.competences.filter(x => x.code !== c.code); refreshComps(); }
                }, '×'),
            ));
        }
    }
    refreshComps();

    const selectComp = h('select', { id: 'r_compsel' },
        h('option', { value: '' }, '— Choisir une compétence —'),
        ...App.data.competences.map(c => h('option', { value: c.code }, `${c.code} — ${c.libelle}`))
    );
    const justifComp = h('input', { type: 'text', placeholder: "Justification (pour l'oral E5)" });

    // Preuves (chemin de fichier)
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
        h('label', { for: 'r_ctx' }, 'Contexte'), refs.contexte,
        h('label', { for: 'r_desc' }, 'Description'), refs.description,
        h('label', { for: 'r_ctb' }, 'Ma contribution personnelle (critère officiel E5)'), refs.contribution,
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

        h('div', { class: 'actions', style: 'border-top:1px solid var(--c-bord);padding-top:1rem;' },
            h('button', { class: 'btn btn--primaire', type: 'button', 'data-testid': 'save-real-btn',
                onclick: () => {
                    real.titre = refs.titre.value;
                    real.categorie = refs.categorie.value;
                    real.periode_debut = refs.periode_debut.value || null;
                    real.periode_fin = refs.periode_fin.value || null;
                    real.contexte = refs.contexte.value;
                    real.description = refs.description.value;
                    real.contribution_personnelle = refs.contribution.value;
                    real.travail_equipe = refs.travail_equipe.checked;
                    real.technologies = refs.technologies.value;
                    real.lien = refs.lien.value;
                    if (isNew) App.data.realisations.push(real);
                    sauverLocal(); renderApp(); fermerPanneau();
                    toast('Réalisation enregistrée', 'succes');
                }
            }, 'Enregistrer'),
            !isNew && h('button', {
                class: 'btn btn--danger', type: 'button', 'data-testid': 'delete-real-btn',
                onclick: () => {
                    if (!confirm('Supprimer cette réalisation ?')) return;
                    App.data.realisations = App.data.realisations.filter(r => r.id !== real.id);
                    sauverLocal(); renderApp(); fermerPanneau();
                    toast('Supprimée');
                }
            }, '🗑 Supprimer'),
            h('button', { class: 'btn btn--secondaire', type: 'button', onclick: fermerPanneau }, 'Fermer'),
        )
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
        h('div', { class: 'actions' },
            h('button', { class: 'btn btn--primaire', type: 'button', 'data-testid': `save-att-${annee}`,
                onclick: () => {
                    App.data.attestations[annee] = {
                        titre: r.titre.value, organisme: r.organisme.value,
                        periode_debut: r.debut.value || null, periode_fin: r.fin.value || null,
                        fichier: r.fichier.value,
                    };
                    sauverLocal(); renderApp(); fermerPanneau();
                    toast('Attestation enregistrée', 'succes');
                }
            }, 'Enregistrer'),
            h('button', { class: 'btn btn--secondaire', type: 'button', onclick: fermerPanneau }, 'Annuler'),
        )
    ]);
}

// ---------------------------------------------------------------------------
// 6) EXPORT / IMPORT JSON (pour committer sur GitHub)
// ---------------------------------------------------------------------------
function exporterJSON() {
    const blob = new Blob([JSON.stringify(App.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'portfolio.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast('Fichier portfolio.json téléchargé. Place-le dans /data/ et fais un git commit + push.', 'succes');
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

// ---------------------------------------------------------------------------
// 7) DÉMARRAGE
// ---------------------------------------------------------------------------
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

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermerPanneau(); });

    // Délégation des clics sur les éléments éditables
    document.addEventListener('click', (e) => {
        // Actions hors mode édition d'abord (rien ici), puis actions data-action
        const act = e.target.closest('[data-action]');
        if (act && App.modeEdition) {
            e.preventDefault();
            if (act.dataset.action === 'edit-attestation')   editerAttestation(act.dataset.annee);
            if (act.dataset.action === 'delete-attestation') {
                if (confirm('Supprimer cette attestation ?')) {
                    App.data.attestations[act.dataset.annee] = null;
                    sauverLocal(); renderApp(); toast('Supprimée');
                }
            }
            return;
        }
        // Bouton "Ajouter une réalisation"
        if (e.target.closest('#btnAjouterRealisation') && App.modeEdition) {
            e.preventDefault();
            editerRealisation('__new__');
            return;
        }

        if (!App.modeEdition) return;
        const cible = e.target.closest('[data-edit]');
        if (!cible) return;
        e.preventDefault();
        const type = cible.dataset.edit;
        if (type === 'section')      editerSection(cible.dataset.section, cible.dataset.champ);
        else if (type === 'profil')  editerProfil();
        else if (type === 'realisation') editerRealisation(cible.dataset.realisationId);
    });
}

document.addEventListener('DOMContentLoaded', init);
