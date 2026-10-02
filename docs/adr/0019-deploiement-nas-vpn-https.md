# ADR-0019 — Déploiement sur le NAS local, accès par VPN et HTTPS

- **Statut :** accepté
- **Date :** 2026-10-02

## Contexte

La v1 tourne sur un NAS de l'association, derrière nginx. Plusieurs règles de
l'étape 4 dépendent de l'exposition de l'API : le changement de mot de passe en
libre-service (D-09, RDC-ACCES-009), la configuration du cookie de session
(RDC-ACCES-006) et la limitation de débit (RDC-ACCES-007). Les responsables se
connectent depuis leur centre, réparti dans le Lot-et-Garonne, donc à distance
du NAS.

## Décision

1. La v2 est installée sur le **NAS local** de l'association, comme la v1.
2. Les centres y accèdent **par VPN**. Aucun port de l'API n'est ouvert sur
   Internet.
3. Tous les échanges passent en **HTTPS**, terminé par nginx sur le NAS, même
   sur le réseau local : mots de passe, jetons et données des bénévoles ne
   circulent jamais en clair (RGPD art. 32).
4. Le cookie de rafraîchissement porte l'attribut `Secure` (RDC-ACCES-006).
5. Pas de changement de mot de passe en libre-service (D-09) : l'admin le
   modifie à la demande du responsable.

## Options écartées

- **Ports ouverts sur Internet** : surface d'attaque publique ; imposerait un
  libre-service de mot de passe et une protection renforcée.
- **HTTP sans chiffrement sur le réseau local** : identifiants et données
  personnelles lisibles par toute personne sur le même réseau ; incompatible
  avec un cookie `Secure`.

## Conséquences

- Il faut un certificat sur le NAS : Let's Encrypt si le NAS a un nom de
  domaine, sinon un certificat interne installé sur chaque poste. Choix à faire
  avec la mise en place du NAS (même rendez-vous que le stockage des images,
  lot C de l'étape 3).
- La limitation de débit (RDC-ACCES-007) reste utile derrière le VPN : un poste
  compromis d'un centre ne doit pas pouvoir tester des mots de passe sans fin.
  L'IP réelle est lue derrière nginx.
- En développement, l'API tourne en HTTP sur `localhost`, que les navigateurs
  traitent comme un contexte sûr.
- **À revoir** si l'API devient accessible depuis Internet : D-09 serait
  rouverte et un nouvel ADR remplacerait celui-ci.
