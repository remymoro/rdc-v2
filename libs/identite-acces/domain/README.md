# identite-acces-domain

Domaine du contexte `identite-acces` : utilisateurs (administrateur, comptes de
centre), rôles, adresse de connexion, mot de passe. Règles : `docs/domaine/identite-acces.md`.

Aucun import de NestJS, Prisma ou Express, ni d'un autre contexte
(`pureLayerRules`, `context:identite-acces`).

```bash
pnpm nx test identite-acces-domain
```
