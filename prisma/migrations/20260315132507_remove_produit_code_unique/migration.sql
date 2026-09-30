-- DropIndex
DROP INDEX "Produit_code_key";

-- CreateIndex
CREATE INDEX "Produit_code_idx" ON "Produit"("code");

-- CreateIndex
CREATE INDEX "Produit_actif_code_idx" ON "Produit"("actif", "code");
