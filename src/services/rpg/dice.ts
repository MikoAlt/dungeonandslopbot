export interface DiceNotation {
  count: number;
  sides: number;
  modifier: number;
}

export interface DiceResult {
  rolls: number[];
  total: number;
  modifier: number;
  notation: DiceNotation;
}

export function roll(sides: number): number {
  if (sides < 1) {
    throw new Error(`Invalid die sides: ${sides}. Must be >= 1.`);
  }
  return Math.floor(Math.random() * sides) + 1;
}

export function rollMultiple(count: number, sides: number): number[] {
  if (count < 1) {
    throw new Error(`Invalid die count: ${count}. Must be >= 1.`);
  }
  return Array.from({ length: count }, () => roll(sides));
}

export function rollWithModifier(count: number, sides: number, modifier: number): DiceResult {
  const rolls = rollMultiple(count, sides);
  const notation: DiceNotation = { count, sides, modifier };
  return {
    rolls,
    total: rolls.reduce((sum, r) => sum + r, 0) + modifier,
    modifier,
    notation,
  };
}

export function parseDiceNotation(notation: string): DiceNotation {
  const trimmed = notation.trim().toLowerCase();

  // Pattern: XdY[+/-Z]
  const match = trimmed.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) {
    throw new Error(
      `Invalid dice notation: "${notation}". Expected format: XdY[+/-Z] (e.g., "2d6+3", "1d20-1").`,
    );
  }

  const count = parseInt(match[1]!, 10);
  const sides = parseInt(match[2]!, 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  if (count < 1) {
    throw new Error(`Invalid dice count: ${count}. Must be >= 1.`);
  }
  if (sides < 1) {
    throw new Error(`Invalid die sides: ${sides}. Must be >= 1.`);
  }

  return { count, sides, modifier };
}

export function rollFromNotation(notation: string): DiceResult {
  const parsed = parseDiceNotation(notation);
  return rollWithModifier(parsed.count, parsed.sides, parsed.modifier);
}
