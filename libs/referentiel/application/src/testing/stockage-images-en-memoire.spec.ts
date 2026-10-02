import { verifierContratStockageImages } from '../ports/stockage-images.contrat.test-utils';
import { HorlogeReglable } from './horloge-reglable.test-utils';
import { StockageImagesEnMemoire } from './stockage-images-en-memoire.test-utils';

// Le fake des tests de use case respecte le même contrat que l'adapter disque.
verifierContratStockageImages('StockageImagesEnMemoire', async () => {
  const stockage = new StockageImagesEnMemoire(
    new HorlogeReglable(new Date('2026-10-02T09:00:00.000Z')),
  );
  return {
    stockage,
    lireFichier: async (magasinId, fichier) =>
      stockage.contenu(magasinId, fichier),
    nettoyer: async () => undefined,
  };
});
