# Didacticiel 8ème

Site Next.js pour permettre aux élèves de 8ème de se connecter, réviser des modules et tester leurs connaissances.

## Fonctionnalités

- Connexion par rôle élève / enseignant
- Dashboard élève avec modules de révision
- Quiz simple pour tester les acquis
- Dashboard enseignant qui affiche les activités des élèves

## Installation

1. Ouvrir un terminal dans le dossier `g:\PROJET DEV\didacticiel`
2. Exécuter `npm install`
3. Lancer le projet avec `npm run dev`
4. Ouvrir le navigateur sur `http://localhost:3000`

## Utilisation

- `Se connecter` : choisir « élève » ou « enseignant »
- `Tableau élève` : sélectionner un module, réviser le contenu et tester ses connaissances
- `Tableau enseignant` : suivre les actions des élèves en temps réel

## Structure

- `app/` : pages React de l’application
- `app/api/` : API utilisée pour stocker et lire les activités et les modules
- `data/` : fichiers JSON de données
- `app/globals.css` : styles globaux
