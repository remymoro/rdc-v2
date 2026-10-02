import { JournalNest } from './journal-nest';

describe('JournalNest', () => {
  it('écrit un avertissement avec ses détails et la cause', () => {
    const avertissements: unknown[][] = [];
    const journal = new JournalNest({
      warn: (...elements: unknown[]) => avertissements.push(elements),
    });

    journal.avertir(
      'Fichier orphelin',
      { magasinId: 'm1', fichier: 'f1.jpg' },
      new Error('disque plein'),
    );

    expect(avertissements).toEqual([
      [
        'Fichier orphelin (magasinId=m1, fichier=f1.jpg) — cause : disque plein',
      ],
    ]);
  });

  it('écrit un avertissement sans cause', () => {
    const avertissements: unknown[][] = [];
    const journal = new JournalNest({
      warn: (...elements: unknown[]) => avertissements.push(elements),
    });

    journal.avertir('Fichier orphelin', { fichier: 'f1.jpg' });

    expect(avertissements).toEqual([['Fichier orphelin (fichier=f1.jpg)']]);
  });
});
