import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { appRoutes } from '../app.routes';

// Les vraies routes de l'application : on vérifie ce que voit l'utilisateur
// en arrivant sur « / », sans simuler le routeur.
describe('Page d’accueil', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(appRoutes)] });
    harness = await RouterTestingHarness.create('/');
  });

  function page(): HTMLElement {
    return harness.routeNativeElement as HTMLElement;
  }

  /** Le guide d'un profil : son titre et ses étapes, dans l'ordre. */
  function guide(titre: string): string[] {
    const section = [...page().querySelectorAll('section')].find((s) =>
      s.querySelector('h3')?.textContent?.includes(titre),
    );
    return [...(section?.querySelectorAll('ol > li') ?? [])].map(
      (etape) => etape.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    );
  }

  it('souhaite la bienvenue', () => {
    expect(page().querySelector('h2')?.textContent).toContain('Bienvenue');
  });

  it('guide le responsable de centre, étape par étape', () => {
    const etapes = guide('Vous êtes responsable d’un centre');

    expect(etapes).toHaveLength(5);
    expect(etapes[0]).toMatch(/connectez-vous/i);
    expect(etapes[1]).toMatch(/appelez les magasins/i);
    expect(etapes[4]).toMatch(/déclarez votre saisie terminée/i);
  });

  it('guide l’administrateur du siège, étape par étape', () => {
    const etapes = guide('Vous êtes l’administrateur du siège');

    expect(etapes).toHaveLength(7);
    expect(etapes[0]).toMatch(/créez la collecte/i);
    expect(etapes[5]).toMatch(/approuvez la clôture/i);
    expect(etapes[6]).toMatch(/statistiques/i);
  });

  it('prévient que l’application est en construction', () => {
    expect(page().textContent).toContain('en construction');
  });

  it('donne son titre à l’onglet du navigateur', () => {
    expect(TestBed.inject(Title).getTitle()).toBe('Accueil — RDC');
  });
});
