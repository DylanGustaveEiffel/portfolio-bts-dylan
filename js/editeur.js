/* ===========================================================================
   js/editeur.js
   ===========================================================================
   AVANT : pas d'édition possible -> il fallait modifier le code source.
   APRÈS : un mode édition activable depuis l'en-tête du site ; chaque bloc
            modifiable ouvre un panneau latéral avec un formulaire simple.

   ORGANISATION (pour un débutant BTS SIO) :
     1) État global (variables, données, mode)
     2) Outils (fetch, toast, helpers)
     3) Activation/désactivation du mode édition
     4) Édition d'une section (titre/sous-titre)
     5) Édition d'un bloc de contenu (texte d'une section)
     6) Édition d'une réalisation (CRUD + compétences + preuves)
     7) Démarrage : on attend que la page soit prête.
   =========================================================================== */
'use strict';

// --- 1) ÉTAT GLOBAL --------------------------------------------------------
const App = {
    competences: [],          // chargées depuis /api/competences
    modeEdition: false,
};

// --- 2) OUTILS -------------------------------------------------------------

/** Appelle l'API JSON. Renvoie la réponse parsée ou lance une erreur. */
async function api(url, options = {}) {
    const opts = Object.assign(
        { headers: { 'Accept': 'application/json' } },
        options
    );
    if (opts.body && !(opts.body instanceof FormData)) {
        opts.headers['Content-Type'] = 'application/json';
        if (typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
    }
    const r = await fetch(url, opts);
    if (!r.ok) throw new Error(`API ${url} -> ${r.status}`);
    return r.headers.get('content-type')?.includes('application/json')
        ? r.json() : r.text();
}

/** Affiche un petit message en bas d'écran (notification "toast"). */
function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = message;
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}

/** Helper : crée un élément HTML avec attributs et enfants. */
function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'class') el.className = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'html') el.innerHTML = v;
        else el.setAttribute(k, v);
    }
    for (const c of children.flat()) {
        if (c == null || c === false) continue;
        el.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return el;
}

// --- 3) MODE ÉDITION -------------------------------------------------------
function basculerModeEdition() {
    App.modeEdition = !App.modeEdition;
    document.body.classList.toggle('mode-edition', App.modeEdition);
    const btn = document.getElementById('btnModeEdition');
    btn.setAttribute('aria-pressed', String(App.modeEdition));
    btn.innerHTML = App.modeEdition
        ? '<span aria-hidden="true">✓</span> Mode édition actif'
        : '<span aria-hidden="true">✎</span> Mode édition';
    // Affiche les actions globales (ex: ajouter une réalisation)
    document.querySelectorAll('.bloc__actions-edition').forEach(el => {
        el.hidden = !App.modeEdition;
    });
    toast(App.modeEdition ? 'Mode édition activé' : 'Mode lecture');
}

// --- Panneau latéral -------------------------------------------------------
function ouvrirPanneau(titre, contenuHtml) {
    document.getElementById('panneauTitre').textContent = titre;
    document.getElementById('panneauCorps').replaceChildren(...(Array.isArray(contenuHtml) ? contenuHtml : [contenuHtml]));
    document.getElementById('panneauEdition').classList.add('ouvert');
    document.getElementById('panneauEdition').setAttribute('aria-hidden', 'false');
    document.getElementById('overlayPanneau').hidden = false;
}
function fermerPanneau() {
    document.getElementById('panneauEdition').classList.remove('ouvert');
    document.getElementById('panneauEdition').setAttribute('aria-hidden', 'true');
    document.getElementById('overlayPanneau').hidden = true;
}

// --- 4) ÉDITION SECTION (titre/sous-titre) ---------------------------------
async function editerSection(sectionId, champ) {
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return;
    const titreActuel = section.querySelector('[data-edit="section-titre"]')?.textContent.trim() || '';
    const sousActuel  = section.querySelector('[data-edit="section-soustitre"]')?.textContent.trim() || '';

    const inputTitre = h('input', { type: 'text', id: 'ed_titre', value: titreActuel, 'data-testid': 'edit-section-titre-input' });
    const inputSous  = h('input', { type: 'text', id: 'ed_sous',  value: sousActuel,  'data-testid': 'edit-section-soustitre-input' });

    ouvrirPanneau('Modifier la section', [
        h('label', { for: 'ed_titre' }, 'Titre de la section'),
        inputTitre,
        h('label', { for: 'ed_sous' }, 'Sous-titre'),
        inputSous,
        h('div', { class: 'actions' },
            h('button', {
                class: 'btn btn--primaire', type: 'button', 'data-testid': 'save-section-btn',
                onclick: async () => {
                    try {
                        await api(`/api/sections/${sectionId}`, {
                            method: 'POST',
                            body: { titre: inputTitre.value, sous_titre: inputSous.value },
                        });
                        // Mise à jour visuelle immédiate
                        const t = section.querySelector('[data-edit="section-titre"]');
                        const s = section.querySelector('[data-edit="section-soustitre"]');
                        if (t) t.textContent = inputTitre.value;
                        if (s) s.textContent = inputSous.value;
                        toast('Section enregistrée', 'succes');
                        fermerPanneau();
                    } catch (e) { toast('Erreur : ' + e.message, 'erreur'); }
                }
            }, 'Enregistrer'),
            h('button', { class: 'btn btn--secondaire', type: 'button', onclick: fermerPanneau }, 'Annuler'),
        )
    ]);
    setTimeout(() => inputTitre.focus(), 50);
}

// --- 5) ÉDITION D'UN BLOC DE CONTENU --------------------------------------
async function editerContenu(sectionId, cle, elementDOM) {
    const actuel = elementDOM.innerText.trim();
    const ta = h('textarea', { id: 'ed_contenu', rows: 8, 'data-testid': 'edit-contenu-textarea' }, actuel);

    ouvrirPanneau('Modifier le contenu', [
        h('label', { for: 'ed_contenu' }, 'Texte (les sauts de ligne sont conservés)'),
        ta,
        h('div', { class: 'actions' },
            h('button', {
                class: 'btn btn--primaire', type: 'button', 'data-testid': 'save-contenu-btn',
                onclick: async () => {
                    try {
                        await api('/api/contenus', {
                            method: 'POST',
                            body: { section_id: Number(sectionId), cle, valeur: ta.value, type: 'texte' },
                        });
                        elementDOM.innerHTML = ta.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
                        toast('Contenu enregistré', 'succes');
                        fermerPanneau();
                    } catch (e) { toast('Erreur : ' + e.message, 'erreur'); }
                }
            }, 'Enregistrer'),
            h('button', { class: 'btn btn--secondaire', type: 'button', onclick: fermerPanneau }, 'Annuler'),
        )
    ]);
    setTimeout(() => ta.focus(), 50);
}

// --- 6) ÉDITION D'UNE RÉALISATION -----------------------------------------
async function editerRealisation(realId) {
    // On récupère la donnée à jour
    const data = await api('/api/data');
    const real = data.realisations.find(r => Number(r.id) === Number(realId));
    if (!real) { toast('Réalisation introuvable', 'erreur'); return; }

    // Champs principaux
    const F = {
        titre:        h('input', { type: 'text', id: 'r_titre', value: real.titre || '', 'data-testid': 'edit-real-titre' }),
        contexte:     h('textarea', { id: 'r_ctx', rows: 2 }, real.contexte || ''),
        description:  h('textarea', { id: 'r_desc', rows: 5 }, real.description || ''),
        technologies: h('input', { type: 'text', id: 'r_tec', value: real.technologies || '' }),
        lien:         h('input', { type: 'url',  id: 'r_lien', value: real.lien || '' }),
        date:         h('input', { type: 'date', id: 'r_date', value: real.date_realisation || '' }),
    };

    // Bloc compétences
    const compsListe = h('div', { class: 'competences-liste', id: 'r_comps' });
    function rafraichirComps(currentComps) {
        compsListe.replaceChildren();
        if (!currentComps.length) compsListe.append(h('p', {}, 'Aucune compétence associée.'));
        for (const c of currentComps) {
            compsListe.append(h('div', { class: 'competence-item' },
                h('div', {}, h('strong', {}, c.code + ' '), c.libelle,
                    c.justification ? h('div', { style: 'font-size:.85rem;color:#666;' }, c.justification) : null),
                h('button', {
                    class: 'btn btn--petit btn--danger', type: 'button',
                    onclick: async () => {
                        await api(`/api/realisations/${realId}/competence/${c.id}`, { method: 'DELETE' });
                        const d = await api('/api/data');
                        const r = d.realisations.find(x => Number(x.id) === Number(realId));
                        rafraichirComps(r.competences || []);
                        toast('Compétence retirée');
                    }
                }, '×')
            ));
        }
    }
    rafraichirComps(real.competences || []);

    const selectComp = h('select', { id: 'r_compsel' },
        h('option', { value: '' }, '— Choisir une compétence —'),
        ...App.competences.map(c => h('option', { value: c.id }, `${c.code} — ${c.libelle}`))
    );
    const justifComp = h('input', { type: 'text', id: 'r_compjust', placeholder: 'Justification (pour l\'oral E5)' });

    // Bloc preuves
    const preuvesListe = h('div', { class: 'preuves-liste', id: 'r_preuves' });
    function rafraichirPreuves(currentP) {
        preuvesListe.replaceChildren();
        if (!currentP.length) preuvesListe.append(h('p', {}, 'Aucune preuve.'));
        for (const p of currentP) {
            preuvesListe.append(h('div', { class: 'preuve-item' },
                h('a', { href: '/' + p.fichier, target: '_blank', rel: 'noopener' }, p.titre),
                h('button', {
                    class: 'btn btn--petit btn--danger', type: 'button',
                    onclick: async () => {
                        await api(`/api/preuves/${p.id}`, { method: 'DELETE' });
                        const d = await api('/api/data');
                        const r = d.realisations.find(x => Number(x.id) === Number(realId));
                        rafraichirPreuves(r.preuves || []);
                        toast('Preuve supprimée');
                    }
                }, '×')
            ));
        }
    }
    rafraichirPreuves(real.preuves || []);

    const inputFichier = h('input', { type: 'file', id: 'r_fichier', accept: '.pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.doc,.docx' });
    const titrePreuve = h('input', { type: 'text', id: 'r_preuve_titre', placeholder: 'Titre de la preuve' });

    ouvrirPanneau('Modifier la réalisation', [
        h('label', { for: 'r_titre' }, 'Titre'), F.titre,
        h('label', { for: 'r_ctx' }, 'Contexte'), F.contexte,
        h('label', { for: 'r_desc' }, 'Description'), F.description,
        h('label', { for: 'r_tec' }, 'Technologies'), F.technologies,
        h('label', { for: 'r_lien' }, 'Lien (optionnel)'), F.lien,
        h('label', { for: 'r_date' }, 'Date de réalisation'), F.date,

        h('h3', { style: 'margin:1.5rem 0 .5rem;font-family:var(--police-titre);' }, 'Compétences mobilisées (Bloc 1)'),
        compsListe,
        h('label', { for: 'r_compsel' }, 'Ajouter une compétence'),
        selectComp,
        justifComp,
        h('button', {
            class: 'btn btn--secondaire btn--petit', type: 'button', style: 'margin-bottom:1rem;',
            'data-testid': 'add-competence-link',
            onclick: async () => {
                if (!selectComp.value) { toast('Choisissez une compétence', 'erreur'); return; }
                await api(`/api/realisations/${realId}/competence`, {
                    method: 'POST',
                    body: { competence_id: Number(selectComp.value), justification: justifComp.value }
                });
                const d = await api('/api/data');
                const r = d.realisations.find(x => Number(x.id) === Number(realId));
                rafraichirComps(r.competences || []);
                selectComp.value = ''; justifComp.value = '';
                toast('Compétence ajoutée', 'succes');
            }
        }, '＋ Lier cette compétence'),

        h('h3', { style: 'margin:1.5rem 0 .5rem;font-family:var(--police-titre);' }, 'Preuves'),
        preuvesListe,
        h('label', { for: 'r_fichier' }, 'Ajouter une preuve (PDF, image, doc — 10 Mo max)'),
        titrePreuve, inputFichier,
        h('button', {
            class: 'btn btn--secondaire btn--petit', type: 'button', style: 'margin: .5rem 0 1rem;',
            'data-testid': 'upload-preuve-btn',
            onclick: async () => {
                if (!inputFichier.files[0]) { toast('Sélectionnez un fichier', 'erreur'); return; }
                const fd = new FormData();
                fd.append('fichier', inputFichier.files[0]);
                fd.append('titre', titrePreuve.value || inputFichier.files[0].name);
                try {
                    await api(`/api/realisations/${realId}/preuve`, { method: 'POST', body: fd });
                    const d = await api('/api/data');
                    const r = d.realisations.find(x => Number(x.id) === Number(realId));
                    rafraichirPreuves(r.preuves || []);
                    titrePreuve.value = ''; inputFichier.value = '';
                    toast('Preuve ajoutée', 'succes');
                } catch (e) { toast('Erreur upload : ' + e.message, 'erreur'); }
            }
        }, '⤴ Téléverser'),

        h('div', { class: 'actions', style: 'border-top:1px solid var(--c-bord); padding-top: 1rem;' },
            h('button', {
                class: 'btn btn--primaire', type: 'button', 'data-testid': 'save-real-btn',
                onclick: async () => {
                    try {
                        await api(`/api/realisations/${realId}`, {
                            method: 'POST',
                            body: {
                                titre: F.titre.value, contexte: F.contexte.value,
                                description: F.description.value, technologies: F.technologies.value,
                                lien: F.lien.value, date_realisation: F.date.value || null,
                            }
                        });
                        toast('Réalisation enregistrée', 'succes');
                        setTimeout(() => location.reload(), 400);
                    } catch (e) { toast('Erreur : ' + e.message, 'erreur'); }
                }
            }, 'Enregistrer'),
            h('button', {
                class: 'btn btn--danger', type: 'button', 'data-testid': 'delete-real-btn',
                onclick: async () => {
                    if (!confirm('Supprimer définitivement cette réalisation ?')) return;
                    await api(`/api/realisations/${realId}`, { method: 'DELETE' });
                    toast('Supprimée');
                    setTimeout(() => location.reload(), 400);
                }
            }, '🗑 Supprimer'),
            h('button', { class: 'btn btn--secondaire', type: 'button', onclick: fermerPanneau }, 'Fermer'),
        )
    ]);
}

async function ajouterRealisation() {
    const r = await api('/api/realisations', { method: 'POST', body: { titre: 'Nouvelle réalisation' } });
    toast('Réalisation créée', 'succes');
    // On recharge pour afficher la carte vierge
    setTimeout(() => {
        location.hash = '#realisations';
        location.reload();
    }, 350);
}

// --- 7) DÉMARRAGE ----------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    // Bouton mode édition
    document.getElementById('btnModeEdition')?.addEventListener('click', basculerModeEdition);
    document.getElementById('btnFermerPanneau')?.addEventListener('click', fermerPanneau);
    document.getElementById('overlayPanneau')?.addEventListener('click', fermerPanneau);

    // Touche Échap pour fermer le panneau (accessibilité clavier)
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermerPanneau(); });

    // Délégation : clics sur les éléments éditables
    document.addEventListener('click', (e) => {
        if (!App.modeEdition) return;
        const cible = e.target.closest('[data-edit]');
        if (!cible) return;
        e.preventDefault();
        const type = cible.dataset.edit;
        const sectionId = cible.dataset.sectionId;
        if (type === 'section-titre' || type === 'section-soustitre') {
            editerSection(sectionId, type);
        } else if (type === 'contenu') {
            editerContenu(sectionId, cible.dataset.cle, cible);
        } else if (type === 'realisation') {
            editerRealisation(cible.dataset.realisationId);
        }
    });

    // Bouton "Ajouter une réalisation"
    document.getElementById('btnAjouterRealisation')?.addEventListener('click', ajouterRealisation);

    // Pré-chargement des compétences (pour les listes déroulantes)
    try {
        App.competences = await api('/api/competences');
    } catch (e) {
        console.warn('Impossible de charger les compétences', e);
    }
});
