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
    document.querySelectorAll('.edit-only').forEach(el => {
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
        categorie:    h('select', { id: 'r_cat', 'data-testid': 'edit-real-categorie' },
            h('option', { value: 'formation',  ...(real.categorie === 'formation'  ? { selected: 'selected' } : {}) }, 'En cours de formation'),
            h('option', { value: 'pro_annee1', ...(real.categorie === 'pro_annee1' ? { selected: 'selected' } : {}) }, 'Milieu pro · 1ère année'),
            h('option', { value: 'pro_annee2', ...(real.categorie === 'pro_annee2' ? { selected: 'selected' } : {}) }, 'Milieu pro · 2ème année'),
        ),
        periodeDebut: h('input', { type: 'date', id: 'r_pd', value: real.periode_debut || '' }),
        periodeFin:   h('input', { type: 'date', id: 'r_pf', value: real.periode_fin || '' }),
        contexte:     h('textarea', { id: 'r_ctx', rows: 2 }, real.contexte || ''),
        description:  h('textarea', { id: 'r_desc', rows: 4 }, real.description || ''),
        contribution: h('textarea', { id: 'r_contrib', rows: 3, 'data-testid': 'edit-real-contribution' }, real.contribution_personnelle || ''),
        travailEquipe: h('input', { type: 'checkbox', id: 'r_eq', ...(Number(real.travail_equipe) ? { checked: 'checked' } : {}) }),
        technologies: h('input', { type: 'text', id: 'r_tec', value: real.technologies || '' }),
        lien:         h('input', { type: 'url',  id: 'r_lien', value: real.lien || '' }),
    };
    // Forcer la valeur du select (workaround attribut "selected" parfois ignoré)
    F.categorie.value = real.categorie || 'formation';

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
        h('label', { for: 'r_cat' }, 'Catégorie (officiel E5)'), F.categorie,
        h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:.5rem;' },
            h('div', {}, h('label', { for: 'r_pd' }, 'Période — début'), F.periodeDebut),
            h('div', {}, h('label', { for: 'r_pf' }, 'Période — fin'),   F.periodeFin),
        ),
        h('label', { for: 'r_ctx' }, 'Contexte'), F.contexte,
        h('label', { for: 'r_desc' }, 'Description de la réalisation'), F.description,
        h('label', { for: 'r_contrib' }, 'Ma contribution personnelle (critère officiel)'),
        F.contribution,
        h('label', { for: 'r_eq', style: 'display:flex;gap:.5rem;align-items:center;' },
            F.travailEquipe, ' Réalisation en équipe projet'),
        h('label', { for: 'r_tec' }, 'Technologies / outils'), F.technologies,
        h('label', { for: 'r_lien' }, 'Lien (optionnel)'), F.lien,

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

// --- 6b) PROFIL CANDIDAT ---------------------------------------------------
async function editerProfil() {
    const profil = await api('/api/profil');
    const F = {
        nom:    h('input', { type: 'text', id: 'p_nom',    value: profil.nom    || '', 'data-testid': 'edit-profil-nom' }),
        prenom: h('input', { type: 'text', id: 'p_prenom', value: profil.prenom || '', 'data-testid': 'edit-profil-prenom' }),
        numero: h('input', { type: 'text', id: 'p_num',    value: profil.numero_candidat || '' }),
        session:h('input', { type: 'text', id: 'p_ses',    value: profil.session || '', placeholder: 'ex: 2026' }),
        option: h('select', { id: 'p_opt', 'data-testid': 'edit-profil-option' },
            h('option', { value: '' }, '— Choisir —'),
            h('option', { value: 'SISR' }, 'SISR'),
            h('option', { value: 'SLAM' }, 'SLAM'),
        ),
        etab:   h('input', { type: 'text', id: 'p_etab', value: profil.etablissement || '' }),
    };
    F.option.value = profil.option_sio || '';

    ouvrirPanneau('Identification du candidat (E5)', [
        h('label', { for: 'p_nom' }, 'NOM'), F.nom,
        h('label', { for: 'p_prenom' }, 'Prénom'), F.prenom,
        h('label', { for: 'p_num' }, 'N° candidat'), F.numero,
        h('label', { for: 'p_ses' }, 'SESSION'), F.session,
        h('label', { for: 'p_opt' }, 'Option BTS SIO'), F.option,
        h('label', { for: 'p_etab' }, 'Établissement'), F.etab,
        h('div', { class: 'actions' },
            h('button', {
                class: 'btn btn--primaire', type: 'button', 'data-testid': 'save-profil-btn',
                onclick: async () => {
                    try {
                        await api('/api/profil', { method: 'POST', body: {
                            nom: F.nom.value, prenom: F.prenom.value,
                            numero_candidat: F.numero.value, session: F.session.value,
                            option_sio: F.option.value, etablissement: F.etab.value,
                        }});
                        toast('Profil enregistré', 'succes');
                        setTimeout(() => location.reload(), 400);
                    } catch (e) { toast('Erreur : ' + e.message, 'erreur'); }
                }
            }, 'Enregistrer'),
            h('button', { class: 'btn btn--secondaire', type: 'button', onclick: fermerPanneau }, 'Annuler'),
        )
    ]);
}

// --- 6c) ATTESTATIONS DE STAGE ---------------------------------------------
async function uploaderAttestation(annee) {
    const titre     = h('input', { type: 'text', id: 'a_t', placeholder: 'Stage de découverte / d\'application…' });
    const organisme = h('input', { type: 'text', id: 'a_o', placeholder: 'Nom de l\'entreprise' });
    const pd        = h('input', { type: 'date', id: 'a_pd' });
    const pf        = h('input', { type: 'date', id: 'a_pf' });
    const fichier   = h('input', { type: 'file', id: 'a_f', accept: '.pdf,.png,.jpg,.jpeg', 'data-testid': `att-file-${annee}` });

    ouvrirPanneau('Téléverser une attestation', [
        h('p', { style: 'color:var(--c-encre-doux);font-size:.9rem;' },
            annee === 'annee1' ? 'Attestation de stage — 1ère année' : 'Attestation de stage — 2ème année'),
        h('label', { for: 'a_t' }, 'Titre'), titre,
        h('label', { for: 'a_o' }, 'Organisme / entreprise'), organisme,
        h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:.5rem;' },
            h('div', {}, h('label', { for: 'a_pd' }, 'Début'), pd),
            h('div', {}, h('label', { for: 'a_pf' }, 'Fin'), pf),
        ),
        h('label', { for: 'a_f' }, 'Fichier (PDF/PNG/JPG, 10 Mo max)'), fichier,
        h('div', { class: 'actions' },
            h('button', {
                class: 'btn btn--primaire', type: 'button', 'data-testid': `save-att-${annee}`,
                onclick: async () => {
                    if (!fichier.files[0]) { toast('Sélectionnez un fichier', 'erreur'); return; }
                    const fd = new FormData();
                    fd.append('fichier', fichier.files[0]);
                    fd.append('titre', titre.value);
                    fd.append('organisme', organisme.value);
                    fd.append('periode_debut', pd.value);
                    fd.append('periode_fin', pf.value);
                    try {
                        await api(`/api/attestations/${annee}`, { method: 'POST', body: fd });
                        toast('Attestation enregistrée', 'succes');
                        setTimeout(() => location.reload(), 400);
                    } catch (e) { toast('Erreur : ' + e.message, 'erreur'); }
                }
            }, 'Téléverser'),
            h('button', { class: 'btn btn--secondaire', type: 'button', onclick: fermerPanneau }, 'Annuler'),
        )
    ]);
}

async function supprimerAttestation(id) {
    if (!confirm('Supprimer cette attestation ?')) return;
    await api(`/api/attestations/${id}`, { method: 'DELETE' });
    toast('Supprimée');
    setTimeout(() => location.reload(), 400);
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
        // Actions sur les attestations (visibles en mode édition uniquement)
        const act = e.target.closest('[data-action]');
        if (act && App.modeEdition) {
            const action = act.dataset.action;
            if (action === 'upload-attestation') {
                e.preventDefault();
                uploaderAttestation(act.dataset.annee);
                return;
            }
            if (action === 'delete-attestation') {
                e.preventDefault();
                supprimerAttestation(Number(act.dataset.id));
                return;
            }
        }

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
        } else if (type === 'profil') {
            editerProfil();
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
