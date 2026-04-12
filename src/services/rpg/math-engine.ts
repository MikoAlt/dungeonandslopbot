type Token =
  | { type: 'NUMBER'; value: number }
  | { type: 'PLUS' }
  | { type: 'MINUS' }
  | { type: 'MULTIPLY' }
  | { type: 'DIVIDE' }
  | { type: 'MODULO' }
  | { type: 'LPAREN' }
  | { type: 'RPAREN' }
  | { type: 'COMMA' }
  | { type: 'FUNCTION'; name: string };

const BLOCKED_NAMES = new Set([
  'eval',
  'Function',
  'process',
  'require',
  'import',
  '__proto__',
  'constructor',
  'prototype',
  'window',
  'global',
  'globalThis',
]);

const FUNCTIONS = new Set([
  'Math.floor',
  'Math.ceil',
  'Math.round',
  'Math.min',
  'Math.max',
  'Math.abs',
  'floor',
  'ceil',
  'round',
  'min',
  'max',
  'abs',
]);

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expression.length) {
    const char = expression[i]!;

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(expression[i + 1] ?? ''))) {
      let numStr = '';
      while (i < expression.length && /[0-9.]/.test(expression[i]!)) {
        numStr += expression[i]!;
        i++;
      }
      const value = parseFloat(numStr);
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid number: ${numStr}`);
      }
      tokens.push({ type: 'NUMBER', value });
      continue;
    }

    if (/[a-zA-Z_.]/.test(char)) {
      let name = '';
      while (i < expression.length && /[a-zA-Z0-9_.]/.test(expression[i]!)) {
        name += expression[i]!;
        i++;
      }

      if (BLOCKED_NAMES.has(name)) {
        throw new Error(`Blocked identifier: ${name}`);
      }

      if (FUNCTIONS.has(name)) {
        tokens.push({ type: 'FUNCTION', name });
      } else {
        throw new Error(`Unknown function: ${name}`);
      }
      continue;
    }

    switch (char) {
      case '+':
        tokens.push({ type: 'PLUS' });
        break;
      case '-':
        tokens.push({ type: 'MINUS' });
        break;
      case '*':
        tokens.push({ type: 'MULTIPLY' });
        break;
      case '/':
        tokens.push({ type: 'DIVIDE' });
        break;
      case '%':
        tokens.push({ type: 'MODULO' });
        break;
      case '(':
        tokens.push({ type: 'LPAREN' });
        break;
      case ')':
        tokens.push({ type: 'RPAREN' });
        break;
      case ',':
        tokens.push({ type: 'COMMA' });
        break;
      default:
        throw new Error(`Unexpected character: ${char}`);
    }
    i++;
  }

  return tokens;
}

class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token | undefined {
    return this.tokens[this.pos++];
  }

  private expect(type: Token['type']): void {
    const token = this.consume();
    if (!token || token.type !== type) {
      throw new Error(`Expected ${type}, got ${token?.type ?? 'end of input'}`);
    }
  }

  parse(): number {
    const result = this.parseExpression();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token at position ${this.pos}`);
    }
    return result;
  }

  private parseExpression(): number {
    return this.parseAdditive();
  }

  private parseAdditive(): number {
    let left = this.parseMultiplicative();

    while (this.peek()?.type === 'PLUS' || this.peek()?.type === 'MINUS') {
      const op = this.consume()!.type;
      const right = this.parseMultiplicative();
      if (op === 'PLUS') {
        left = left + right;
      } else {
        left = left - right;
      }
    }

    return left;
  }

  private parseMultiplicative(): number {
    let left = this.parseUnary();

    while (
      this.peek()?.type === 'MULTIPLY' ||
      this.peek()?.type === 'DIVIDE' ||
      this.peek()?.type === 'MODULO'
    ) {
      const op = this.consume()!.type;
      const right = this.parseUnary();
      switch (op) {
        case 'MULTIPLY':
          left = left * right;
          break;
        case 'DIVIDE':
          if (right === 0) {
            throw new Error('Division by zero');
          }
          left = left / right;
          break;
        case 'MODULO':
          left = left % right;
          break;
      }
    }

    return left;
  }

  private parseUnary(): number {
    if (this.peek()?.type === 'MINUS') {
      this.consume();
      return -this.parseUnary();
    }
    if (this.peek()?.type === 'PLUS') {
      this.consume();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const token = this.peek();

    if (token?.type === 'NUMBER') {
      this.consume();
      return token.value;
    }

    if (token?.type === 'LPAREN') {
      this.consume();
      const value = this.parseExpression();
      this.expect('RPAREN');
      return value;
    }

    if (token?.type === 'FUNCTION') {
      return this.parseFunctionCall();
    }

    throw new Error(`Unexpected token: ${token?.type ?? 'end of input'}`);
  }

  private parseFunctionCall(): number {
    const token = this.consume();
    if (!token || token.type !== 'FUNCTION') {
      throw new Error('Expected function');
    }

    this.expect('LPAREN');
    const args: number[] = [];

    if (this.peek()?.type !== 'RPAREN') {
      args.push(this.parseExpression());
      while (this.peek()?.type === 'COMMA') {
        this.consume();
        args.push(this.parseExpression());
      }
    }

    this.expect('RPAREN');

    const fn = token.name;
    switch (fn) {
      case 'Math.floor':
      case 'floor':
        if (args.length !== 1) throw new Error('floor expects 1 argument');
        return Math.floor(args[0]!);
      case 'Math.ceil':
      case 'ceil':
        if (args.length !== 1) throw new Error('ceil expects 1 argument');
        return Math.ceil(args[0]!);
      case 'Math.round':
      case 'round':
        if (args.length !== 1) throw new Error('round expects 1 argument');
        return Math.round(args[0]!);
      case 'Math.min':
      case 'min':
        if (args.length < 2) throw new Error('min expects at least 2 arguments');
        return Math.min(...args);
      case 'Math.max':
      case 'max':
        if (args.length < 2) throw new Error('max expects at least 2 arguments');
        return Math.max(...args);
      case 'Math.abs':
      case 'abs':
        if (args.length !== 1) throw new Error('abs expects 1 argument');
        return Math.abs(args[0]!);
      default:
        throw new Error(`Unknown function: ${fn}`);
    }
  }
}

export class MathEngine {
  evaluate(expression: string): number {
    if (typeof expression !== 'string' || expression.trim().length === 0) {
      throw new Error('Expression must be a non-empty string');
    }

    const trimmed = expression.trim();

    if (/[^0-9+\-*/%()\s.,a-zA-Z_]/.test(trimmed)) {
      throw new Error('Expression contains invalid characters');
    }

    const dangerous =
      /(?:^|[^a-zA-Z_])(eval|Function|process|require|import|__proto__|constructor|prototype|window|global|globalThis)(?:[^a-zA-Z0-9_]|$)/i;
    if (dangerous.test(trimmed)) {
      throw new Error('Expression contains blocked identifiers');
    }

    const tokens = tokenize(trimmed);
    const parser = new Parser(tokens);
    return parser.parse();
  }
}

export const mathEngine = new MathEngine();
