# Rapport de Projet CDA — Alvio

## Contexte
- Projet : Alvio — plateforme de trading propulsée par IA (web + mobile)
- Auteur : Adam Ijjai — Formation CDA (RNCP 37873, niveau 6) — 2024-2025
- Concept : moteur IA qui apprend les stratégies de trading de l'utilisateur et 
  détecte en temps réel les patterns de marché correspondants.

## Stack réelle (à vérifier dans le code, ne rien inventer)
- Backend : NestJS 10 + TypeScript + Prisma + PostgreSQL + Redis
- Frontend : Next.js 13 App Router + Tailwind + Zustand + Axios
- Mobile : React Native + Expo
- IA/ML : Python (pandas, scikit-learn, TA-Lib) + Claude API (claude-sonnet) 
  pour le Strategy Engine
- Données marché : CoinGecko API
- Déploiement : Railway (backend+PostgreSQL+Redis) + Vercel (frontend)

## 6 modules IA
1. Import & parsing PDF (Multer + pdf-parse)
2. Strategy Engine IA (Claude API → règles JSON)
3. Détection de patterns Python (bridge child_process)
4. Signaux de trading avec scores de confiance
5. Simulateur intérêts composés
6. Rapports mensuels automatisés

## Fonctionnalités faites
- Page Markets (CoinGecko, temps réel, sparklines, chandeliers lightweight-charts, 
  cache Redis anti-429, fallback line chart)
- Module Formation (Prisma : Course/Lesson/UserProgress, seed SMC/RSI/MACD + YouTube)

## Charte graphique
- Amber #f59e0b (primaire), vert #10b981 (signaux), navy #0f172a (fond), 
  violet #6366f1 (accent), UI glassmorphism
- Logo : triangle + ligne graphique ascendante

## Structure du rapport (~50 pages)
1. Page de titre
2. Présentation & Remerciements
3. À propos de moi
4. Sommaire
5. Introduction (contexte, problématique, livrables)
6. Gestion de projet (Scrum, PBS/OBS, organisation solo, risques)
7. Conception fonctionnelle UI/UX (zoning, wireframes web+mobile, charte, SEO)
8. Conception BDD (dictionnaire de données, MCD, MLD, MPD)
9. Modélisation UML (cas d'utilisation, classes, séquence)
10. Architecture logicielle (vue d'ensemble, endpoints, sécurité, vulnérabilités 
    CSRF/XSS/SQLi, dépendances, workflow d'une requête)
11. Application Web (auth, modules IA, markets, formation, sécurité)
12. Application Mobile (vue d'ensemble, fonctionnalités, intégration backend)
13. Module IA/ML (pipeline, Strategy Engine, détection patterns, signaux)
14. Tests (unitaires + intégration, exemples)
15. Déploiement (Railway + Vercel, CI/CD)
16. Annexes (diagrammes complets, captures de code)
17. Mapping blocs de compétences RNCP CDA (Bloc 1 dév sécurisé, Bloc 2 conception 
    en couches, Bloc 3 déploiement) — relier chaque compétence à une section + 
    un élément technique d'Alvio.

## TÂCHES (cocher au fur et à mesure)

- [x] T1. Scanner le projet réel (package.json back+front, schema.prisma, 
      controllers/services, scripts Python) et noter les vraies données dans 
      /docs/DONNEES_REELLES.md
      <!-- FAIT le 2026-06-20 — DONNEES_REELLES.md créé (9 sections, ~200 lignes) -->

- [x] T2. Générer les diagrammes via Graphviz/Matplotlib → images dans /docs/img/ :
      MCD, MLD, MPD (depuis schema.prisma réel), diagramme de classes, cas 
      d'utilisation, séquence (création stratégie IA + auth), architecture globale
      <!-- FAIT le 2026-06-20 — 8 PNG générés via matplotlib (dot absent) :
           mcd.png (247 KB), mld.png (306 KB), mpd.png (186 KB), classes.png (382 KB),
           use_cases.png (366 KB), seq_strategy.png (185 KB), seq_auth.png (143 KB),
           architecture.png (458 KB). Script : /docs/diagrams/generate_all.py -->

- [ ] T3. Rédiger le contenu section par section dans /docs/sections/ (un fichier 
      .md par section, avec vrais extraits de code commentés)
      <!-- EN COURS — suivi des sections (17 au total) :
           [x] 01_presentation_remerciements.md — FAIT 2026-06-20
           [x] 02_a_propos_de_moi.md — FAIT 2026-06-20
           [x] 03_introduction.md — FAIT 2026-06-20
           [x] 04_gestion_de_projet.md — FAIT 2026-06-20
           [x] 05_conception_ui_ux.md — FAIT 2026-06-20
           [x] 06_conception_bdd.md — FAIT 2026-06-20
           [x] 07_modelisation_uml.md — FAIT 2026-06-20
           [x] 08_architecture_logicielle.md — FAIT 2026-06-20
           [x] 09_application_web.md — FAIT 2026-06-20
           [x] 10_application_mobile.md — FAIT 2026-06-20
           [x] 11_module_ia_ml.md — FAIT 2026-06-20
           [x] 12_tests.md — FAIT 2026-06-20
           [x] 13_deploiement.md — FAIT 2026-06-20
           [~] 14_securite.md — SUPPRIMÉ (doublon avec section 08_architecture_logicielle)
           [x] 15_annexes.md — FAIT 2026-06-20
           [x] 16_mapping_rncp.md — FAIT 2026-06-20
           Nota : certaines sections peuvent être fusionnées au moment de build_pdf.py -->

- [x] T4. Écrire le script ReportLab /docs/build_pdf.py qui assemble texte + images 
      en PDF (page de titre, sommaire paginé, en-têtes, charte Alvio)
      <!-- FAIT le 2026-06-20 — /docs/build_pdf.py créé (~370 lignes) :
           page de titre navy/amber, TOC 2 passes, H1-H4, bullets, tables, images,
           blocs code, en-têtes/pieds de page, palette Alvio complète. -->

- [x] T5. Exécuter build_pdf.py → /docs/RAPPORT_PROJET_ALVIO.pdf
      <!-- FAIT le 2026-06-20 — RAPPORT_PROJET_ALVIO.pdf généré : 108 pages, 2.52 MB,
           15 sections incluses (01→16 sans 14), 8 images PNG intégrées. -->

## Règles de travail
- Une seule tâche/section à la fois, écrite dans un FICHIER (jamais un long bloc 
  dans le chat).
- Après chaque étape : cocher la case dans PLAN.md, résumer en 2 lignes, 
  s'arrêter et attendre "continue".
- Ne rien inventer : se baser sur le code réel scanné en T1.
- Projet SOLO : adapter la gestion de projet (pas de matrice RACI multi-personnes).

## Journal de session
- 2026-06-20 : Session initiale — rapport_generator.py créé + RAPPORT_PROJET_ALVIO.pdf
  généré (sans images). Backend démarré (port 3001), Frontend (port 3000).
  Bug TS7006 reports.service.ts corrigé. DATABASE_URL corrigé.
- 2026-06-20 : PLAN.md créé — état initial documenté, reprise propre possible.
