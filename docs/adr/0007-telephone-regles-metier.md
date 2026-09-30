# ADR-0007 — Téléphone : règles de RDC v1, métropole, champ vide = absent

- **Statut :** accepté
- **Date :** 2026-09-30

## Contexte

`Telephone` reprend la règle de RDC v1 : séparateurs retirés, format
international `+33…`, seuls les numéros commençant par 01 à 07 et 09 sont
acceptés. La relecture de cette règle a soulevé trois questions métier.

## Décision

1. **Numéros en 08 : règle v1 conservée.** Tous les 08 sont refusés, y compris
   les numéros verts gratuits (0800 à 0805).
2. **Métropole uniquement.** Aucun centre n'est en outre-mer : la conversion
   `0X…` → `+33X…` suffit. Les indicatifs +262, +590, +594, +596, +269… ne
   sont pas gérés.
3. **Champ vide = pas de téléphone.** Le téléphone est facultatif. Quand une
   requête HTTP envoie `""` (ou seulement des espaces), l'adapter HTTP le
   convertit en « absent » avant d'appeler le domaine. Le domaine garde
   `TelephoneVide` comme garde-fou : `Telephone.creer("")` reste refusé.

## Conséquences

- Les points 1 et 2 sont des comportements voulus : un 0800 refusé ou un
  numéro d'outre-mer mal converti ne sont pas des défauts à signaler en revue.
- Le point 3 s'écarte de la v1 (qui renvoyait `TELEPHONE_EMPTY`) : il doit être
  couvert par un test de l'adapter HTTP de création de centre, et s'appliquera
  de la même façon à l'email s'il est facultatif.
- Si un centre ouvre en outre-mer ou si un numéro vert devient nécessaire,
  écrire un nouvel ADR qui remplace les points concernés.
