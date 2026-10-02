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

  it('souhaite la bienvenue', () => {
    expect(page().querySelector('h2')?.textContent).toContain('Bienvenue');
  });

  it('affiche le carrousel de présentation avant les rubriques', () => {
    const carrousel = page().querySelector('rdc-presentation');
    const rubriques = page().querySelector('ul');

    expect(carrousel).not.toBeNull();
    expect(
      carrousel!.compareDocumentPosition(rubriques!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('présente chaque rubrique de l’application', () => {
    const rubriques = [...page().querySelectorAll('li h3')].map((titre) =>
      titre.textContent?.trim(),
    );

    expect(rubriques).toEqual([
      'Référentiel',
      'Collectes',
      'Planification',
      'Saisie des pesées',
      'Statistiques',
    ]);
  });

  it('donne son titre à l’onglet du navigateur', () => {
    expect(TestBed.inject(Title).getTitle()).toBe('Accueil — RDC');
  });
});
