# ADR-0023 — Front Angular 22 : `apps/web`, Vitest, Tailwind, sans SSR

- **Statut :** proposé
- **Date :** 2026-10-02

## Contexte

L'ADR-0001 prévoit un front Angular 22.1 dans le même workspace que l'API, et
demande de passer Node à 24.15 ou plus avant de l'ajouter. La feuille de route
le place à l'étape 8 ; son socle est posé dès maintenant pour que les écrans
puissent suivre les étapes métier, à commencer par la connexion (étape 4).
Le front n'est pas encore figé : garder celui de la v1 ou le refaire reste à
décider (roadmap, étape 4).

## Décision

1. **Node 24.20.0** (`.nvmrc`), `engines.node` relevé à `>=24.15.0`.
2. **`apps/web`**, généré par `@nx/angular` 23.2.1, composants autonomes,
   builder `@angular/build:application` (esbuild), préfixe `rdc`.
   **Angular 22.2** (`~22.2`) au lieu du 22.1 prévu par l'ADR-0001 :
   `@angular/router` 22.1 a une faille de gravité haute (GHSA-ff3f-86qr-9cv3),
   corrigée en 22.2.0, qui ferait échouer `pnpm audit --prod` en CI. Montée
   faite par `pnpm nx migrate @angular/core@22.2.1`, sans migration de code.
3. **Pas de SSR** : l'application est interne, servie derrière le VPN du NAS
   (ADR-0019) ; le rendu serveur n'apporte ni référencement ni gain utile.
4. **Vitest** (`@angular/build:unit-test`, jsdom) pour les tests unitaires du
   front, comme le permet l'ADR-0004 ; l'API et les libs restent sous Jest.
5. **Tailwind CSS v4** par PostCSS (`apps/web/.postcssrc.json`,
   `@import 'tailwindcss'` dans `styles.css`), sans `tailwind.config.js`.
6. **Pas de tests E2E du front pour l'instant** : ils arrivent avec le premier
   écran qu'ils vérifient (ADR-0004).
7. **Le front ne connaît l'API que par HTTP.** Il porte le tag
   `layer:frontend` et ne peut importer aucune lib de `domain`, `application`
   ni `adapters`, ni NestJS, Prisma ou Express (`@nx/enforce-module-boundaries`).
   En développement, `/api` est relayé vers l'API (`apps/web/proxy.conf.json`,
   port 3000).
8. Seul le front ajoute `dom` aux bibliothèques TypeScript
   (`apps/web/tsconfig.json`) ; `tsconfig.base.json` reste en `es2022`.

## Conséquences

- `pnpm nx serve web` lance le front ; `pnpm nx test web` et
  `pnpm nx build web` passent dans `pnpm verify` et dans la CI
  (`nx affected`), comme les autres projets.
- Les règles d'architecture Tenets visent le back-end : les règles propres au
  front (organisation des écrans, appels HTTP, gestion des erreurs `code`)
  feront l'objet d'un ADR avec le premier écran.
- Un type partagé entre le front et l'API (DTO) passera par une lib
  `layer:frontend` dédiée ou un contrat publié, à décider à ce moment-là ; le
  front n'importe jamais les DTO des adapters.
- Les montées de version d'Angular passent par `pnpm nx migrate`, comme le
  reste du workspace (ADR-0001).
