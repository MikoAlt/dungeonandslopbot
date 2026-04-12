export interface ParsedNarrative {
  narrative: string;
  diceRolls: DiceRollRequest[];
  stateChanges: StateChange[];
}

export interface DiceRollRequest {
  notation: string;
  modifier: number;
}

export interface StateChange {
  key: string;
  operation: 'set' | 'modify';
  value: string | number;
}

const DICE_ROLL_PATTERN = /\[roll:([^\]]+)\]/g;
const STATE_CHANGE_PATTERN = /\[state:([^\]]+)\]/g;

export function parseNarrativeResponse(raw: string): ParsedNarrative {
  const diceRolls = parseDiceRolls(raw);
  const stateChanges = parseStateChanges(raw);

  let narrative = raw;
  narrative = narrative.replace(/\s*\[roll:[^\]]+\]\s*/g, ' ');
  narrative = narrative.replace(/\s*\[state:[^\]]+\]\s*/g, ' ');
  narrative = narrative.replace(/  +/g, ' ');
  narrative = narrative.replace(/ *\n */g, '\n');
  narrative = narrative.replace(/\n{3,}/g, '\n\n').trim();

  return { narrative, diceRolls, stateChanges };
}

export function parseDiceRolls(raw: string): DiceRollRequest[] {
  const rolls: DiceRollRequest[] = [];
  const pattern = /\[roll:([^\]]+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(raw)) !== null) {
    const notation = match[1]!.trim();
    const parsed = parseDiceNotation(notation);
    if (parsed) {
      rolls.push(parsed);
    }
  }

  return rolls;
}

function parseDiceNotation(notation: string): DiceRollRequest | null {
  const dicePattern = /^(\d+)d(\d+)([+-]\d+)?$/i;
  const match = notation.match(dicePattern);
  if (!match) return null;

  const count = parseInt(match[1]!, 10);
  const sides = parseInt(match[2]!, 10);

  if (count < 1 || count > 100) return null;
  if (sides < 2 || sides > 1000) return null;

  const modifier = match[3] ? parseInt(match[3]!, 10) : 0;

  return {
    notation: notation.toLowerCase(),
    modifier,
  };
}

export function parseStateChanges(raw: string): StateChange[] {
  const changes: StateChange[] = [];
  const pattern = /\[state:([^\]]+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(raw)) !== null) {
    const stateExpr = match[1]!.trim();
    const parsed = parseStateExpression(stateExpr);
    if (parsed) {
      changes.push(parsed);
    }
  }

  return changes;
}

function parseStateExpression(expr: string): StateChange | null {
  const setMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)=(.+)$/);
  if (setMatch) {
    const key = setMatch[1]!;
    const value = setMatch[2]!.trim();
    const numericValue = Number(value);
    return {
      key,
      operation: 'set',
      value: isNaN(numericValue) ? value : numericValue,
    };
  }

  const modifyMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)([+-]\d+)$/);
  if (modifyMatch) {
    const key = modifyMatch[1]!;
    const value = parseInt(modifyMatch[2]!, 10);
    return {
      key,
      operation: 'modify',
      value,
    };
  }

  return null;
}
