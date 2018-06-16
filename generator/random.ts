/**
 * Pseudorandom number generator. Not actually anywhere close to random but good enough for seeding and generating data.
 */
export class Random {

  constructor(
    private seed: number = Math.floor(Math.random() * 1000000)
  ) {}

  public next(min: number, max: number): number {
    return min + Math.floor(((Math.sin(this.seed++) + 1) / 2) * (max - min + 1));
  }
}
