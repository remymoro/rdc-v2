# Revue du durcissement des images — I1 à I7

Branche feat/referentiel-images-robustesse, complément du lot C.
Décisions et limites : ADR-0022. Revue effectuée sur le diff de la branche,
sans délégation à d'autres agents.

## Preuves TDD

Chaque cycle a été exécuté rouge puis vert et enregistré séparément.

| Constat | Échec observé avant correction                                                                      | Validation après correction                                                |
| ------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| I1      | Transaction déjà ouverte pendant le stockage ; ajout concurrent perdu ; archivage concurrent ignoré | 10 tests du use case                                                       |
| I6      | Le fake remplace les octets ; le disque expose EEXIST brut                                          | Contrat commun passé par les deux adapters, filtre HTTP 503                |
| I2      | Nom public visible pendant l'écriture partielle ; temporaire ancien conservé                        | Écriture partielle, concurrence et collecte des seuls temporaires reconnus |
| I3      | Champs texte avant/après le fichier transmis au use case                                            | 4 tests multipart HTTP réels                                               |
| I4      | Racine, HTML et SVG accessibles ; en-têtes absents                                                  | 11 tests HTTP GET/HEAD                                                     |
| I5      | Un magasin illisible arrête la tâche ; les URL incompatibles ne sont pas signalées                  | 9 tests de nettoyage et 3 tests du contrôle de reprise                     |
| I7      | 12 codes de panne non traduits ; ENOENT pendant stat interrompt la liste                            | 35 tests disque, contrat compris                                           |

## Architecture et métier

- **TENETS-APP-006, UOW-003/007** : une seule transaction, après écriture du
  fichier, avec relecture sous verrou et commit explicite. Le pré-contrôle
  utilise un aperçu non enregistré ; les décisions restent dans l'agrégat.
- **RDC-REF-002/007** : l'archivage concurrent est revérifié ; l'ordre des
  images tient compte d'un ajout concurrent. Les magasins inconnus ou déjà
  archivés restent refusés avant écriture disque.
- **TENETS-PORT-002, ERROR-004/005/006, TEST-003** : collision définie près du
  port, contrat commun, causes techniques conservées, statut choisi par HTTP.
- **TENETS-UOW-010** : le nettoyage d'un temporaire ne masque pas la panne
  d'écriture ; un résidu est journalisé et reste inaccessible par HTTP.
- **TENETS-ADAPTER-002, VALIDATE-002** : limites multipart et restriction des
  chemins publics dans les adapters ; aucun framework ajouté au domaine ou
  à l'application.
- **TENETS-VALIDATE-001, RDC-REF-007** : aucun assouplissement des noms du
  domaine pour accepter une reprise invalide. Contrôle préalable en lecture
  seule, code de sortie non nul en cas d'anomalie.
- **TENETS-ERROR-007** : le traitement de chaque magasin est une frontière
  du nettoyage ; un chargement impossible est journalisé une fois, ses
  fichiers sont conservés et les autres magasins sont traités.

## Validation globale

- **pnpm verify** : vert dans le workspace principal.
- **pnpm agent:gate -- --full** : vert dans un checkout propre du commit
  81e2e58 (les ajouts suivants ne concernent que cette preuve documentaire).
  Format, lint, types, tests, build, migrations, deux projets d'intégration
  PostgreSQL et **87 E2E dans 10 suites** passent.
- Le gate du workspace principal s'arrêtait sur des différences de fins de
  ligne déjà présentes et un cache Angular extérieur à ce lot. Ces fichiers
  n'ont pas été embarqués dans la branche ; aucun changement métier
  préexistant n'a été écrasé.
- L'export réel v1 et le NAS ne sont pas disponibles dans cette validation :
  appliquer les procédures de reprise et nginx avant la bascule. Vérifier
  le support des liens physiques. R1 (COMMIT incertain) reste ouvert ;
  Busboy ignore le plafond configuré de 100 paires d'en-têtes (ADR-0022).
