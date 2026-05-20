<?php /**
 * vues/partials/footer.php
 * ---------------------------------------------------------------------------
 * Pied de page commun + chargement du JavaScript.
 *
 * ACCESSIBILITÉ : <footer role="contentinfo"> est repéré par les lecteurs
 * d'écran comme la zone d'informations légales/secondaires.
 * ---------------------------------------------------------------------------
 */
?>
<footer role="contentinfo" class="pied" data-testid="site-footer">
    <div class="conteneur pied__inner">
        <p>© <?= date('Y') ?> — Portfolio BTS SIO · Préparation oral E5</p>
        <p class="pied__petit">Fait avec PHP, MySQL et beaucoup de café ☕</p>
    </div>
</footer>

<!-- Panneau d'édition (caché par défaut) -->
<aside id="panneauEdition" class="panneau" aria-hidden="true" aria-label="Panneau d'édition"
       data-testid="edit-panel">
    <div class="panneau__entete">
        <h2 id="panneauTitre">Éditer</h2>
        <button type="button" class="panneau__fermer" id="btnFermerPanneau"
                aria-label="Fermer le panneau d'édition" data-testid="close-edit-panel">×</button>
    </div>
    <div class="panneau__corps" id="panneauCorps">
        <!-- Le contenu est injecté en JS selon l'élément édité -->
    </div>
</aside>
<div id="overlayPanneau" class="overlay" hidden></div>

<script src="/js/editeur.js" defer></script>
</body>
</html>
