import { SystemClock } from './system-clock';

describe('SystemClock', () => {
  it("donne l'heure courante du système", () => {
    const avant = Date.now();
    const maintenant = new SystemClock().now().getTime();
    const apres = Date.now();

    expect(maintenant).toBeGreaterThanOrEqual(avant);
    expect(maintenant).toBeLessThanOrEqual(apres);
  });
});
