CREATE UNIQUE INDEX "Benevole_centreId_nom_prenom_non_anonymise_key"
ON "Benevole"("centreId", "nom", "prenom")
WHERE "anonymise" = false;
