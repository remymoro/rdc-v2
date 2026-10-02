import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { Presentation } from './presentation';

describe('Présentation (carrousel de l’accueil)', () => {
  let fixture: ComponentFixture<Presentation>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Presentation);
    await fixture.whenStable();
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function titre(): string | undefined {
    return element().querySelector('h3')?.textContent?.trim();
  }

  function position(): string | undefined {
    return element().querySelector('[data-position]')?.textContent?.trim();
  }

  async function cliquer(libelle: string): Promise<void> {
    element()
      .querySelector<HTMLButtonElement>(`button[aria-label="${libelle}"]`)
      ?.click();
    await fixture.whenStable();
  }

  async function touche(key: string): Promise<void> {
    element()
      .querySelector('section')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key }));
    await fixture.whenStable();
  }

  it('affiche la première diapositive au départ', () => {
    expect(titre()).toBe('Qu’est-ce qu’une collecte ?');
    expect(position()).toBe('1 / 4');
  });

  it('passe à la diapositive suivante', async () => {
    await cliquer('Diapositive suivante');

    expect(titre()).toBe('Préparer');
    expect(position()).toBe('2 / 4');
  });

  it('revient à la dernière en reculant depuis la première', async () => {
    await cliquer('Diapositive précédente');

    expect(titre()).toBe('Analyser');
    expect(position()).toBe('4 / 4');
  });

  it('revient à la première en avançant depuis la dernière', async () => {
    for (let i = 0; i < 4; i += 1) {
      await cliquer('Diapositive suivante');
    }

    expect(titre()).toBe('Qu’est-ce qu’une collecte ?');
  });

  it('va directement à une diapositive par son point, marqué comme actif', async () => {
    await cliquer('Aller à la diapositive 3');

    expect(titre()).toBe('Peser');
    const actif = element().querySelector('button[aria-current="true"]');
    expect(actif?.getAttribute('aria-label')).toBe('Aller à la diapositive 3');
  });

  it('se pilote au clavier avec les flèches', async () => {
    await touche('ArrowRight');
    expect(titre()).toBe('Préparer');

    await touche('ArrowLeft');
    expect(titre()).toBe('Qu’est-ce qu’une collecte ?');
  });

  it('se présente comme un carrousel aux lecteurs d’écran', () => {
    const region = element().querySelector('section');

    expect(region?.getAttribute('aria-roledescription')).toBe('carrousel');
    expect(region?.getAttribute('aria-label')).toBe('Présentation de RDC');
    // Annonce le changement de diapositive, sans interrompre la lecture.
    expect(
      element().querySelector('[aria-live="polite"]')?.textContent,
    ).toContain('Qu’est-ce qu’une collecte ?');
  });
});
