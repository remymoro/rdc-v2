import { CentreIdInvalide, NomVide } from '@rdc/referentiel-domain';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ModifierMagasinRequete,
  versModifierMagasinCommande,
} from './modifier-magasin.requete';

const id = '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b';

function requete(corps: Record<string, unknown>): ModifierMagasinRequete {
  return plainToInstance(ModifierMagasinRequete, corps);
}

describe('ModifierMagasinRequete — forme de la requête (TENETS-VALIDATE-002)', () => {
  it('accepte une requête vide : rien ne change', async () => {
    expect(await validate(requete({}))).toEqual([]);
  });

  it('accepte null pour le téléphone et l’email (suppression)', async () => {
    expect(await validate(requete({ telephone: null, email: null }))).toEqual(
      [],
    );
  });

  it.each(['nom', 'ville', 'codePostal', 'adresse', 'centreId'])(
    'refuse %s à null : seuls téléphone et email se suppriment',
    async (champ) => {
      const erreurs = await validate(requete({ [champ]: null }));

      expect(erreurs.map((e) => e.property)).toContain(champ);
    },
  );

  it('refuse un champ qui n’est pas du texte', async () => {
    const erreurs = await validate(requete({ ville: 47 }));

    expect(erreurs.map((e) => e.property)).toContain('ville');
  });
});

describe('versModifierMagasinCommande', () => {
  it('laisse absents les champs non fournis', () => {
    const commande = versModifierMagasinCommande(id, requete({}));

    expect(commande.magasinId.valeur).toBe(id);
    expect(commande.changements).toEqual({});
    expect(commande.centreId).toBeUndefined();
  });

  it('construit les value objects des champs fournis et le centre cible', () => {
    const commande = versModifierMagasinCommande(
      id,
      requete({
        nom: 'Leclerc Agen Nord',
        telephone: '05 53 11 22 33',
        centreId: '0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b',
      }),
    );

    expect(commande.changements.nom?.valeur).toBe('Leclerc Agen Nord');
    expect(commande.changements.telephone?.valeur).toBe('+33553112233');
    expect(commande.centreId?.valeur).toBe(
      '0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b',
    );
  });

  it.each([null, '', '   '])(
    'traduit un téléphone ou un email %j en suppression (null)',
    (valeur) => {
      const commande = versModifierMagasinCommande(
        id,
        requete({ telephone: valeur, email: valeur }),
      );

      expect(commande.changements.telephone).toBeNull();
      expect(commande.changements.email).toBeNull();
    },
  );

  it('laisse le domaine refuser les valeurs invalides', () => {
    expect(() =>
      versModifierMagasinCommande(id, requete({ nom: '  ' })),
    ).toThrow(NomVide);
    expect(() =>
      versModifierMagasinCommande(id, requete({ centreId: 'pas-un-uuid' })),
    ).toThrow(CentreIdInvalide);
  });
});
