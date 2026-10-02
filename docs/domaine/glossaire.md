# Glossaire — langage métier RDC

Un terme = un sens dans son contexte. Le code utilise ces mots tels quels, en
français, sans synonyme (TENETS-NAME-001). Colonne « À éviter » : synonymes
vus dans la v1 ou tentants, qui ne doivent pas entrer dans le code v2.

## Acteurs

| Terme                                            | Contexte       | Définition                                                                                                                                                                                                 | À éviter                                                   |
| ------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Administrateur** (`ADMIN`)                     | identite-acces | Administrateur du siège de l'AD47, unique : pilote toutes les collectes, ouvre la vérification, inscrit les magasins, gère le référentiel.                                                                 | superadmin, gestionnaire                                   |
| **Responsable de centre** (`RESPONSABLE_CENTRE`) | identite-acces | Compte unique d'un centre, partagé par l'équipe qui gère le centre ; email propre au compte, mot de passe défini par l'admin. Gère les bénévoles, plannings et pesées du centre. Ce n'est pas un bénévole. | manager, chef de centre, compte personnel, compte bénévole |
| **Bénévole**                                     | benevoles      | Personne qui participe au terrain (magasin, centre, conduite). Ce n'est pas un utilisateur de l'application.                                                                                               | volontaire, user                                           |
| **Chauffeur**                                    | planification  | Bénévole affecté à un créneau du planning chauffeur. Ce n'est pas un type de personne distinct.                                                                                                            | driver, livreur                                            |

## Référentiel

| Terme                                   | Contexte    | Définition                                                                                                                         | À éviter                            |
| --------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Centre**                              | referentiel | Centre de distribution des Restos du Cœur du Lot-et-Garonne. Unité opérationnelle et périmètre d'accès.                            | site, antenne, agence               |
| **Magasin**                             | referentiel | Point de vente où se déroule la collecte. Rattaché en permanence à un centre.                                                      | boutique, shop, store               |
| **Rattachement**                        | referentiel | Lien permanent magasin → centre. Distinct du centre gestionnaire d'une collecte.                                                   | affectation                         |
| **Transférer** (`transfererVers`)       | referentiel | Changer le centre de rattachement permanent d'un magasin.                                                                          | réassigner (réservé à une collecte) |
| **Clé de doublon** (`CleDoublonCentre`) | referentiel | Valeur normalisée qui identifie deux centres de même nom et adresse.                                                               | identifiant, clé métier             |
| **Produit**                             | referentiel | Élément du catalogue de référence : code (`D` + 6 chiffres), famille, sous-famille, actif ou non.                                  | article (≠ article pesé)            |
| **Famille / Sous-famille**              | referentiel | Classement des produits utilisé par les statistiques.                                                                              | catégorie                           |
| **Actif / Inactif / Archivé**           | referentiel | Statut d'un centre ou d'un magasin. Inactif = en pause, réversible et sans nouveau rattachement ; archivé = retiré définitivement. | supprimé                            |
| **Activer** (`activer`)                 | referentiel | Passer un élément INACTIF à ACTIF.                                                                                                 | réactiver                           |
| **Désactiver** (`desactiver`)           | referentiel | Passer un élément ACTIF à INACTIF, de façon réversible.                                                                            | mettre en pause                     |
| **Archiver** (`archiver`)               | referentiel | Passer définitivement un élément ACTIF ou INACTIF à ARCHIVE.                                                                       | supprimer                           |
| **Image d'un magasin** (`ImageMagasin`) | referentiel | Photo d'un magasin, à sa position (ordre) dans la liste de ses images. Son fichier porte un nom UUID, jamais le nom envoyé.        | photo, blob, pièce jointe           |
| **Ajouter / Retirer une image**         | referentiel | `ajouterImage` place l'image après les autres ; `retirerImage` l'enlève du magasin, puis son fichier est supprimé.                 | téléverser, supprimer l'image       |
| **Image orpheline**                     | referentiel | Fichier d'image sans image enregistrée en base (échec d'écriture). Toléré, puis supprimé par le nettoyage après une heure.         | blob orphelin, fichier perdu        |

## Collecte

| Terme                                 | Contexte | Définition                                                                                                                                        | À éviter                                     |
| ------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Collecte**                          | collecte | Opération de collecte alimentaire sur une période, dans un ensemble de magasins. Nom unique.                                                      | campagne, événement, opération               |
| **Préparation / En cours / Terminée** | collecte | Les trois seuls statuts d'une collecte.                                                                                                           | ouverte, clôturée (comme statut)             |
| **Période**                           | collecte | Dates de début et de fin de la collecte. La fin posée à minuit couvre toute la journée.                                                           | dates, durée                                 |
| **Participation**                     | collecte | Inscription d'un magasin à une collecte, avec son centre gestionnaire. Inscrire = l'accord du magasin est obtenu ; pas de statut.                 | participation confirmée, en attente, refusée |
| **Liste de vérification**             | collecte | Liste des magasins d'un centre à contacter avant une collecte, préremplie à sa création. Une par collecte et par centre.                          | liste de démarchage, prospection             |
| **Ouvrir la vérification**            | collecte | Action du siège qui lance la campagne et crée une liste préremplie par centre.                                                                    | lancer le démarchage                         |
| **Transmettre la liste**              | collecte | Retour officiel du centre au siège : ses réponses et son avis. Ensuite, le centre ne modifie plus.                                                | valider, envoyer, clôturer                   |
| **Avis du centre**                    | collecte | Commentaire global joint par le centre à sa liste transmise.                                                                                      | remarque, note                               |
| **Renvoyer la liste**                 | collecte | Demande motivée du siège au centre de corriger sa liste transmise.                                                                                | rejeter, refuser la liste                    |
| **Réponse du magasin**                | collecte | « À contacter », « participe » ou « ne participe pas » : saisie dans la liste de vérification, jamais sur la participation.                       | confirmation, statut de participation        |
| **Inscription en lot**                | collecte | Inscription par l'admin, depuis une liste transmise, des magasins qui ont répondu « participe » et ne sont pas encore inscrits.                   | validation automatique                       |
| **Collecte précédente**               | collecte | Dernière collecte terminée, par date de début. Sert au préremplissage.                                                                            | collecte N-1, année précédente               |
| **Inscrire / Retirer un magasin**     | collecte | Ajouter ou enlever une participation (préparation uniquement).                                                                                    | ajouter, supprimer                           |
| **Centre gestionnaire**               | collecte | Centre qui gère un magasin pour une collecte donnée. Par défaut le centre de rattachement, réassignable en préparation.                           | centre du magasin                            |
| **Réassigner**                        | collecte | Changer le centre gestionnaire d'une participation.                                                                                               | transférer (≠ transfert de rattachement)     |
| **Planification ouverte / fermée**    | collecte | Interrupteur piloté par l'admin : les plannings ne se modifient que lorsqu'elle est ouverte.                                                      | inscriptions ouvertes (ancien nom v1)        |
| **Démarrer**                          | collecte | Passer PREPARATION → EN_COURS, automatiquement à la date de début ou manuellement par l'admin.                                                    | lancer, ouvrir                               |
| **Fenêtre de saisie**                 | collecte | Période pendant laquelle les pesées sont permises. Calculée à partir de la date de fin.                                                           | saisie ouverte (comme état stocké)           |
| **Saisie d'un centre**                | collecte | État de saisie d'un centre pour une collecte : en cours, terminée par le centre, rouverte par l'admin.                                            | statut de saisie                             |
| **Déclarer la saisie terminée**       | collecte | Le centre (ou l'admin, en forçant) affirme que toutes ses pesées sont faites.                                                                     | valider la saisie (≠ valider une pesée)      |
| **Rouvrir la saisie**                 | collecte | Décision tracée de l'admin qui permet à un centre de peser à nouveau ; la raison saisie par l'admin ou fournie par défaut reste à décider (D-13). | débloquer                                    |
| **En attente de clôture**             | collecte | Drapeau d'une collecte en cours : fenêtre dépassée et tous les centres ont terminé. Ce n'est pas un statut.                                       | statut EN_ATTENTE_CLOTURE                    |
| **Approuver la clôture / Terminer**   | collecte | Décision de l'admin qui passe la collecte en TERMINEE.                                                                                            | clôturer automatiquement                     |

## Planification

| Terme                         | Contexte      | Définition                                                                                   | À éviter                       |
| ----------------------------- | ------------- | -------------------------------------------------------------------------------------------- | ------------------------------ |
| **Planning magasin**          | planification | Créneaux des bénévoles dans un magasin pour une collecte (un par couple collecte × magasin). | agenda                         |
| **Planning bénévoles centre** | planification | Créneaux des bénévoles au centre pour une collecte (un par couple collecte × centre).        | planning interne               |
| **Planning chauffeur**        | planification | Créneaux de conduite d'un centre pour une collecte (un par couple collecte × centre).        | tournée                        |
| **Créneau**                   | planification | Plage horaire (début < fin) affectée à un bénévole dans un planning. Planifié ou annulé.     | slot (nom technique v1), shift |
| **Chevauchement**             | planification | Deux créneaux dont les plages horaires se recouvrent.                                        | conflit (trop vague)           |
| **Type d'engagement**         | benevoles     | `BNV_Restos` (bénévole régulier, par défaut) ou `BNV_1_jour` (bénévole d'un jour).           | statut du bénévole             |

## Saisie

| Terme                 | Contexte | Définition                                                                                | À éviter             |
| --------------------- | -------- | ----------------------------------------------------------------------------------------- | -------------------- |
| **Pesée** (`passage`) | saisie   | Enregistrement des poids collectés dans un magasin, numéroté par passage (1, 2, 3…).      | saisie entry, entrée |
| **Article pesé**      | saisie   | Ligne d'une pesée : référence, famille et sous-famille du produit (copiées), poids en kg. | item, produit        |
| **Poids**             | saisie   | Masse strictement positive, stockée en millièmes de kg.                                   | quantité             |
| **Valider une pesée** | saisie   | Figer une pesée (EN_COURS → VALIDEE). Sens métier exact à confirmer (a-trancher D-08).    | confirmer            |

## Statistiques

| Terme                    | Contexte     | Définition                                                                                                                                    | À éviter           |
| ------------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| **Enseigne**             | statistiques | Regroupement v1 par nom après `UPPER(TRIM(nom))` : casse et espaces aux extrémités ignorés, espaces internes conservés. Aucun attribut dédié. | chaîne, marque     |
| **Synthèse**             | statistiques | Totaux d'une collecte par centre, magasin, enseigne ou famille.                                                                               | rapport, dashboard |
| **Comparaison annuelle** | statistiques | Comparaison de l'année N avec l'année N-1, sur les mêmes axes.                                                                                | historique         |
| **Évolution**            | statistiques | Variation en % de N-1 vers N ; « Nouveau » quand N-1 vaut zéro et N non.                                                                      | delta, progression |
| **AD47**                 | statistiques | Association départementale du Lot-et-Garonne : l'ensemble du réseau.                                                                          | global, total      |
