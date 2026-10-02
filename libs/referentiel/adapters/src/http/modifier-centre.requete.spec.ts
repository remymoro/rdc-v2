import { CentreIdInvalide, NomVide } from '@rdc/referentiel-domain';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ModifierCentreRequete,
  versModifierCentreCommande,
} from './modifier-centre.requete';

const id = '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12';

function requete(corps: Record<string, unknown>): ModifierCentreRequete {
  return plainToInstance(ModifierCentreRequete, corps);
}

describe('ModifierCentreRequete — forme de la requête (TENETS-VALIDATE-002)', () => {
  it('accepte une requête vide : rien ne change', async () => {
    expect(await validate(requete({}))).toEqual([]);
  });

  it('accepte null pour le téléphone et l’email (suppression)', async () => {
    expect(await validate(requete({ telephone: null, email: null }))).toEqual(
      [],
    );
  });

  it.each(['nom', 'ville', 'codePostal', 'adresse'])(
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

describe('versModifierCentreCommande', () => {
  it('laisse absents les champs non fournis', () => {
    const commande = versModifierCentreCommande(id, requete({}));

    expect(commande.centreId.valeur).toBe(id);
    expect(commande.changements).toEqual({});
  });

  it('construit les value objects des champs fournis', () => {
    const commande = versModifierCentreCommande(
      id,
      requete({
        nom: "Centre d'Agen Nord",
        adresse: '3 avenue de la Liberté',
        codePostal: '47520',
        ville: 'Le Passage',
        telephone: '05 53 11 22 33',
        email: 'agen@restosducoeur.org',
      }),
    );

    expect(commande.changements.nom?.valeur).toBe("Centre d'Agen Nord");
    expect(commande.changements.adresse?.valeur).toBe('3 avenue de la Liberté');
    expect(commande.changements.codePostal?.valeur).toBe('47520');
    expect(commande.changements.ville?.valeur).toBe('Le Passage');
    expect(commande.changements.telephone?.valeur).toBe('+33553112233');
    expect(commande.changements.email?.valeur).toBe('agen@restosducoeur.org');
  });

  it.each([null, '', '   '])(
    'traduit un téléphone ou un email %j en suppression (null)',
    (valeur) => {
      const commande = versModifierCentreCommande(
        id,
        requete({ telephone: valeur, email: valeur }),
      );

      expect(commande.changements.telephone).toBeNull();
      expect(commande.changements.email).toBeNull();
    },
  );

  it('laisse le domaine refuser les valeurs invalides', () => {
    expect(() =>
      versModifierCentreCommande(id, requete({ nom: '  ' })),
    ).toThrow(NomVide);
    expect(() => versModifierCentreCommande('x', requete({}))).toThrow(
      CentreIdInvalide,
    );
  });
});
