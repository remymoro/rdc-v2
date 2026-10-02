import {
  CodeProduitInvalide,
  FamilleVide,
  ProduitIdInvalide,
} from '@rdc/referentiel-domain';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreerProduitRequete,
  ModifierProduitRequete,
  versChangerActiviteProduitCommande,
  versCreerProduitCommande,
  versModifierProduitCommande,
} from './produit.requetes';

const id = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const corpsValide = {
  code: 'D000123',
  famille: 'Épicerie',
  sousFamille: 'Pâtes',
};

describe('CreerProduitRequete (TENETS-VALIDATE-002)', () => {
  it('accepte une requête complète et construit la commande', async () => {
    const requete = plainToInstance(CreerProduitRequete, corpsValide);

    expect(await validate(requete)).toEqual([]);
    const commande = versCreerProduitCommande(requete);
    expect(commande.code.valeur).toBe('D000123');
    expect(commande.famille.valeur).toBe('Épicerie');
    expect(commande.sousFamille.valeur).toBe('Pâtes');
  });

  it.each(['code', 'famille', 'sousFamille'])(
    'refuse une requête sans %s',
    async (champ) => {
      const corps: Record<string, unknown> = { ...corpsValide };
      delete corps[champ];

      const erreurs = await validate(
        plainToInstance(CreerProduitRequete, corps),
      );

      expect(erreurs.map((e) => e.property)).toContain(champ);
    },
  );

  it('laisse le domaine refuser un code mal formé', () => {
    expect(() =>
      versCreerProduitCommande(
        plainToInstance(CreerProduitRequete, { ...corpsValide, code: 'X1' }),
      ),
    ).toThrow(CodeProduitInvalide);
  });
});

describe('ModifierProduitRequete', () => {
  it('ne garde que les champs fournis', async () => {
    const requete = plainToInstance(ModifierProduitRequete, {
      famille: 'Hygiène',
    });

    expect(await validate(requete)).toEqual([]);
    const commande = versModifierProduitCommande(id, requete);
    expect(commande.produitId.valeur).toBe(id);
    expect(commande.changements.famille?.valeur).toBe('Hygiène');
    expect(commande.changements).not.toHaveProperty('code');
  });

  it('refuse un champ à null', async () => {
    const erreurs = await validate(
      plainToInstance(ModifierProduitRequete, { famille: null }),
    );

    expect(erreurs.map((e) => e.property)).toContain('famille');
  });

  it('laisse le domaine refuser une famille vide', () => {
    expect(() =>
      versModifierProduitCommande(
        id,
        plainToInstance(ModifierProduitRequete, { famille: '  ' }),
      ),
    ).toThrow(FamilleVide);
  });
});

describe('versChangerActiviteProduitCommande', () => {
  it('construit le ProduitId et refuse un identifiant mal formé', () => {
    expect(versChangerActiviteProduitCommande(id).produitId.valeur).toBe(id);
    expect(() => versChangerActiviteProduitCommande('x')).toThrow(
      ProduitIdInvalide,
    );
  });
});
