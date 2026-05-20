<?php /**
 * vues/partials/header.php
 * ---------------------------------------------------------------------------
 * En-tête commun : balise <head>, navigation principale.
 *
 * ACCESSIBILITÉ (à expliquer à l'oral E5) :
 *  - <html lang="fr">           -> aide les lecteurs d'écran et le SEO
 *  - <meta viewport ...>        -> rend le site responsive
 *  - <a href="#contenu" class="lien-evitement"> -> "skip link" pour clavier
 *  - <header role="banner"> + <nav aria-label="Navigation principale">
 *  - Contrastes WCAG AA respectés (cf. portfolio.css)
 * ---------------------------------------------------------------------------
 */
?><!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Portfolio BTS SIO — préparation à l'épreuve E5, Bloc 1.">
    <title>Portfolio BTS SIO — Bloc 1 (E5)</title>
    <link rel="stylesheet" href="/css/portfolio.css">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%93%9A%3C/text%3E%3C/svg%3E">
</head>
<body>
<!-- Lien d'évitement : permet aux utilisateurs au clavier d'aller direct au contenu -->
<a href="#contenu-principal" class="lien-evitement" data-testid="skip-link">Aller au contenu principal</a>

<header role="banner" class="entete" data-testid="site-header">
    <div class="conteneur entete__inner">
        <a href="#hero" class="entete__marque" data-testid="header-brand" aria-label="Retour en haut">
            <span class="entete__logo" aria-hidden="true">◆</span>
            <span>Portfolio BTS SIO</span>
        </a>

        <nav class="entete__nav" aria-label="Navigation principale" data-testid="main-nav">
            <ul>
                <li><a href="#apropos"      data-testid="nav-apropos">À propos</a></li>
                <li><a href="#realisations" data-testid="nav-realisations">Réalisations</a></li>
                <li><a href="#competences"  data-testid="nav-competences">Compétences</a></li>
                <li><a href="#veille"       data-testid="nav-veille">Veille</a></li>
                <li><a href="#contact"      data-testid="nav-contact">Contact</a></li>
            </ul>
        </nav>

        <button id="btnModeEdition" type="button" class="btn btn--primaire"
                data-testid="toggle-edit-mode" aria-pressed="false">
            <span aria-hidden="true">✎</span> Mode édition
        </button>
    </div>
</header>
