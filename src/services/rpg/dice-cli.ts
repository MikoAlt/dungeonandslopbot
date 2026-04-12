import type { SeededRandom } from '../utils/random.js';

export type AdvantageMode = 'none' | 'advantage' | 'disadvantage';

export interface DiceCliResult {
  notation: string;
  rolls: number[];
  dropped: number[];
  total: number;
  modifier: number;
  isCrit: boolean;
  isFumble: boolean;
}

interface ParsedDice {
  count: number;
  sides: number;
  modifier: number;
  advantage: AdvantageMode;
  keepMode: 'none' | 'highest' | 'lowest';
  keepCount: number;
  exploding: boolean;
}

function parseDiceExpression(input: string): ParsedDice {
  const original = input.trim();
  const noSpaces = original.replace(/\s+/g, '').toLowerCase();

  let exploding = false;
  let cleaned = noSpaces;

  if (cleaned.endsWith('!crit')) {
    exploding = true;
    cleaned = cleaned.slice(0, -5);
  }

  let advantage: AdvantageMode = 'none';
  if (cleaned.endsWith('disadvantage')) {
    advantage = 'disadvantage';
    cleaned = cleaned.slice(0, -13);
  } else if (cleaned.endsWith('advantage')) {
    advantage = 'advantage';
    cleaned = cleaned.slice(0, -9);
  }

  let keepMode: 'none' | 'highest' | 'lowest' = 'none';
  let keepCount = 0;

  const khPos = cleaned.indexOf('kh');
  const klPos = cleaned.indexOf('kl');

  if (khPos > 0) {
    keepMode = 'highest';
    const beforeKh = cleaned.slice(0, khPos);
    const afterKh = cleaned.slice(khPos + 2);
    const countAndSides = beforeKh.match(/^(\d+)d(\d+)$/);
    if (!countAndSides) {
      throw new Error(`Invalid dice notation: "${input}"`);
    }
    keepCount = parseInt(afterKh, 10);
    cleaned = beforeKh;
  } else if (klPos > 0) {
    keepMode = 'lowest';
    const beforeKl = cleaned.slice(0, klPos);
    const afterKl = cleaned.slice(klPos + 2);
    const countAndSides = beforeKl.match(/^(\d+)d(\d+)$/);
    if (!countAndSides) {
      throw new Error(`Invalid dice notation: "${input}"`);
    }
    keepCount = parseInt(afterKl, 10);
    cleaned = beforeKl;
  }

  const diceMatch = cleaned.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!diceMatch) {
    throw new Error(`Invalid dice notation: "${input}"`);
  }

  const count = parseInt(diceMatch[1]!, 10);
  const sides = parseInt(diceMatch[2]!, 10);
  const modifier = diceMatch[3] ? parseInt(diceMatch[3], 10) : 0;

  if (count < 1) {
    throw new Error(`Invalid dice count: ${count}. Must be >= 1.`);
  }
  if (sides < 1) {
    throw new Error(`Invalid die sides: ${sides}. Must be >= 1.`);
  }

  const finalKeepCount = keepMode === 'none' ? count : keepCount;
  if (keepMode !== 'none' && (finalKeepCount < 1 || finalKeepCount > count)) {
    throw new Error(`Invalid keep count: ${finalKeepCount}. Must be between 1 and ${count}.`);
  }

  return {
    count,
    sides,
    modifier,
    advantage,
    keepMode,
    keepCount: finalKeepCount,
    exploding,
  };
}

function rollDie(sides: number, rng: () => number): number {
  return Math.floor(rng() * sides) + 1;
}

function rollExploding(sides: number, rng: () => number): number[] {
  const rolls: number[] = [];
  let current = rollDie(sides, rng);
  rolls.push(current);

  while (current === sides) {
    current = rollDie(sides, rng);
    rolls.push(current);
  }

  return rolls;
}

export class DiceCli {
  private rng: () => number;

  constructor(rng?: SeededRandom) {
    this.rng = rng ? () => rng.next() : () => Math.random();
  }

  roll(input: string): DiceCliResult {
    const parsed = parseDiceExpression(input);

    let rolls: number[] = [];
    let dropped: number[] = [];
    let keptDice: number[] = [];
    let isCrit = false;
    let isFumble = false;

    if (parsed.advantage !== 'none') {
      const roll1 = rollDie(parsed.sides, this.rng);
      const roll2 = rollDie(parsed.sides, this.rng);

      rolls = [roll1, roll2];

      if (parsed.advantage === 'advantage') {
        if (roll1 >= roll2) {
          dropped = [roll2];
          keptDice = [roll1];
        } else {
          dropped = [roll1];
          keptDice = [roll2];
        }
      } else {
        if (roll1 <= roll2) {
          dropped = [roll2];
          keptDice = [roll1];
        } else {
          dropped = [roll1];
          keptDice = [roll2];
        }
      }

      isCrit = rolls.some((r) => r === parsed.sides);
      isFumble = rolls.some((r) => r === 1);
    } else if (parsed.keepMode !== 'none') {
      const allRolls: number[] = [];
      for (let i = 0; i < parsed.count; i++) {
        allRolls.push(rollDie(parsed.sides, this.rng));
      }

      const sorted = [...allRolls].sort((a, b) => a - b);

      if (parsed.keepMode === 'highest') {
        keptDice = sorted.slice(-parsed.keepCount).reverse();
        dropped = sorted.slice(0, parsed.count - parsed.keepCount);
      } else {
        keptDice = sorted.slice(0, parsed.keepCount);
        dropped = sorted.slice(parsed.keepCount);
      }
      rolls = keptDice;

      isCrit = keptDice.some((r) => r === parsed.sides);
      isFumble = keptDice.some((r) => r === 1);
    } else if (parsed.exploding) {
      const allRolls: number[] = [];
      for (let i = 0; i < parsed.count; i++) {
        const explodingRolls = rollExploding(parsed.sides, this.rng);
        allRolls.push(...explodingRolls);
      }
      rolls = allRolls;
      keptDice = allRolls;

      isCrit = rolls.some((r) => r === parsed.sides);
      isFumble = rolls.some((r) => r === 1);
    } else {
      for (let i = 0; i < parsed.count; i++) {
        rolls.push(rollDie(parsed.sides, this.rng));
      }
      keptDice = rolls;

      isCrit = rolls.some((r) => r === parsed.sides);
      isFumble = rolls.some((r) => r === 1);
    }

    const total = keptDice.reduce((sum, r) => sum + r, 0) + parsed.modifier;

    return {
      notation: input.trim(),
      rolls,
      dropped,
      total,
      modifier: parsed.modifier,
      isCrit,
      isFumble,
    };
  }
}
