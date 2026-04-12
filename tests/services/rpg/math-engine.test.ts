import { describe, expect, it, beforeEach } from 'bun:test';
import { MathEngine } from '../../../src/services/rpg/math-engine';

describe('MathEngine', () => {
  let engine: MathEngine;

  beforeEach(() => {
    engine = new MathEngine();
  });

  describe('basic arithmetic', () => {
    it('evaluates addition', () => {
      expect(engine.evaluate('2 + 3')).toBe(5);
      expect(engine.evaluate('10 + 20 + 30')).toBe(60);
    });

    it('evaluates subtraction', () => {
      expect(engine.evaluate('5 - 3')).toBe(2);
      expect(engine.evaluate('10 - 20')).toBe(-10);
    });

    it('evaluates multiplication', () => {
      expect(engine.evaluate('3 * 4')).toBe(12);
      expect(engine.evaluate('2 * 3 * 4')).toBe(24);
    });

    it('evaluates division', () => {
      expect(engine.evaluate('10 / 2')).toBe(5);
      expect(engine.evaluate('7 / 2')).toBe(3.5);
    });

    it('evaluates modulo', () => {
      expect(engine.evaluate('10 % 3')).toBe(1);
      expect(engine.evaluate('15 % 5')).toBe(0);
    });

    it('respects operator precedence', () => {
      expect(engine.evaluate('2 + 3 * 4')).toBe(14);
      expect(engine.evaluate('10 - 2 * 3')).toBe(4);
      expect(engine.evaluate('8 / 2 + 3')).toBe(7);
      expect(engine.evaluate('2 * 3 + 4 * 5')).toBe(26);
    });

    it('handles parentheses', () => {
      expect(engine.evaluate('(2 + 3) * 4')).toBe(20);
      expect(engine.evaluate('(10 - 2) * (3 + 1)')).toBe(32);
      expect(engine.evaluate('((2 + 3))')).toBe(5);
    });
  });

  describe('negative numbers', () => {
    it('handles negative numbers in expression', () => {
      expect(engine.evaluate('-5')).toBe(-5);
      expect(engine.evaluate('-5 + 3')).toBe(-2);
      expect(engine.evaluate('5 + -3')).toBe(2);
    });

    it('handles double negatives', () => {
      expect(engine.evaluate('--5')).toBe(5);
      expect(engine.evaluate('-(-5)')).toBe(5);
    });
  });

  describe('Math functions', () => {
    it('evaluates Math.floor', () => {
      expect(engine.evaluate('Math.floor(3.7)')).toBe(3);
      expect(engine.evaluate('Math.floor(-2.3)')).toBe(-3);
    });

    it('evaluates Math.ceil', () => {
      expect(engine.evaluate('Math.ceil(3.2)')).toBe(4);
      expect(engine.evaluate('Math.ceil(-2.7)')).toBe(-2);
    });

    it('evaluates Math.round', () => {
      expect(engine.evaluate('Math.round(3.5)')).toBe(4);
      expect(engine.evaluate('Math.round(3.4)')).toBe(3);
    });

    it('evaluates Math.abs', () => {
      expect(engine.evaluate('Math.abs(-5)')).toBe(5);
      expect(engine.evaluate('Math.abs(5)')).toBe(5);
    });

    it('evaluates Math.min', () => {
      expect(engine.evaluate('Math.min(3, 1, 4, 1, 5)')).toBe(1);
      expect(engine.evaluate('Math.min(-5, -2)')).toBe(-5);
    });

    it('evaluates Math.max', () => {
      expect(engine.evaluate('Math.max(3, 1, 4, 1, 5)')).toBe(5);
      expect(engine.evaluate('Math.max(-5, -2)')).toBe(-2);
    });

    it('evaluates functions without Math prefix', () => {
      expect(engine.evaluate('floor(3.7)')).toBe(3);
      expect(engine.evaluate('ceil(3.2)')).toBe(4);
      expect(engine.evaluate('round(3.5)')).toBe(4);
      expect(engine.evaluate('abs(-5)')).toBe(5);
      expect(engine.evaluate('min(3, 1)')).toBe(1);
      expect(engine.evaluate('max(3, 1)')).toBe(3);
    });

    it('handles functions in expressions', () => {
      expect(engine.evaluate('Math.floor(10 / 3)')).toBe(3);
      expect(engine.evaluate('2 + Math.max(3, 4)')).toBe(6);
    });
  });

  describe('whitespace handling', () => {
    it('ignores whitespace', () => {
      expect(engine.evaluate('  2 + 3  ')).toBe(5);
      expect(engine.evaluate('2  +  3')).toBe(5);
    });
  });

  describe('injection prevention', () => {
    it('blocks eval', () => {
      expect(() => engine.evaluate('eval(1)')).toThrow();
      expect(() => engine.evaluate('1 + eval("2")')).toThrow();
    });

    it('blocks Function', () => {
      expect(() => engine.evaluate('Function(1)')).toThrow();
    });

    it('blocks process', () => {
      expect(() => engine.evaluate('process.env')).toThrow();
    });

    it('blocks require', () => {
      expect(() => engine.evaluate('require(1)')).toThrow();
    });

    it('blocks import', () => {
      expect(() => engine.evaluate('import(1)')).toThrow();
    });

    it('blocks __proto__', () => {
      expect(() => engine.evaluate('obj.__proto__')).toThrow();
    });

    it('blocks constructor', () => {
      expect(() => engine.evaluate('constructor')).toThrow();
    });

    it('blocks prototype', () => {
      expect(() => engine.evaluate('prototype')).toThrow();
    });

    it('blocks window', () => {
      expect(() => engine.evaluate('window')).toThrow();
    });

    it('blocks global', () => {
      expect(() => engine.evaluate('global')).toThrow();
    });

    it('blocks globalThis', () => {
      expect(() => engine.evaluate('globalThis')).toThrow();
    });

    it('blocks disguised dangerous functions', () => {
      expect(() => engine.evaluate('Math.eval(1)')).toThrow();
      expect(() => engine.evaluate('window.eval(1)')).toThrow();
    });
  });

  describe('error handling', () => {
    it('throws for empty string', () => {
      expect(() => engine.evaluate('')).toThrow();
      expect(() => engine.evaluate('   ')).toThrow();
    });

    it('throws for invalid characters', () => {
      expect(() => engine.evaluate('2 @ 3')).toThrow();
      expect(() => engine.evaluate('2 $ 3')).toThrow();
    });

    it('throws for mismatched parentheses', () => {
      expect(() => engine.evaluate('(2 + 3')).toThrow();
      expect(() => engine.evaluate('2 + 3)')).toThrow();
      expect(() => engine.evaluate('((2 + 3)')).toThrow();
    });

    it('throws for division by zero', () => {
      expect(() => engine.evaluate('5 / 0')).toThrow();
    });

    it('throws for unknown functions', () => {
      expect(() => engine.evaluate('unknown(1)')).toThrow();
      expect(() => engine.evaluate('sqrt(4)')).toThrow();
    });

    it('throws for invalid numbers', () => {
      expect(() => engine.evaluate('.')).toThrow();
    });
  });

  describe('complex expressions', () => {
    it('evaluates complex arithmetic expressions', () => {
      expect(engine.evaluate('2 * 3 + 4 * 5')).toBe(26);
    });

    it('evaluates nested function calls', () => {
      expect(engine.evaluate('Math.floor(Math.max(3.5, 2.7))')).toBe(3);
    });

    it('evaluates complex arithmetic with functions', () => {
      const result = engine.evaluate('Math.floor((10 + 5) / 2) + Math.max(1, 2)');
      expect(result).toBe(7 + 2);
    });
  });
});
