import type { DiceGroup, DiceResults } from "./types/chat.js";

const DICE_REGEX = /^([+\-]?\s*\d*[dwDW]\d+|\d+)(\s*[+\-]\s*(\d*[dwDW]\d+|\d+))*$/;
const GROUP_REGEX = /([+\-]?)\s*(\d*)[dwDW](\d+)/g;
const MODIFIER_REGEX = /([+\-])\s*(\d+)(?![dwDW])/g;

export function parseDiceFormula(formula: string): {
  groups: { count: number; sides: number }[];
  modifier: number;
} | null {
  const trimmed = formula.trim();
  if (!DICE_REGEX.test(trimmed)) return null;

  const groups: { count: number; sides: number }[] = [];
  let modifier = 0;

  // Extract dice groups
  let match: RegExpExecArray | null;
  const groupRegex = new RegExp(GROUP_REGEX.source, "g");
  while ((match = groupRegex.exec(trimmed)) !== null) {
    const sign = match[1] === "-" ? -1 : 1;
    const count = (match[2] ? parseInt(match[2], 10) : 1) * sign;
    const sides = parseInt(match[3]!, 10);
    if (sides < 1 || Math.abs(count) < 1 || Math.abs(count) > 100 || sides > 10000) return null;
    groups.push({ count, sides });
  }

  // Extract flat modifiers (numbers not followed by d/w)
  // We need to handle the initial number too
  const withoutDice = trimmed.replace(/\d*[dwDW]\d+/g, "");
  const modRegex = new RegExp(MODIFIER_REGEX.source, "g");
  while ((match = modRegex.exec(withoutDice)) !== null) {
    const sign = match[1] === "-" ? -1 : 1;
    modifier += sign * parseInt(match[2]!, 10);
  }

  // Check for leading plain number (modifier)
  const leadingNum = trimmed.match(/^(\d+)(?![dwDW])/);
  if (leadingNum && !trimmed.match(/^\d*[dwDW]/)) {
    modifier += parseInt(leadingNum[1]!, 10);
  }

  if (groups.length === 0) return null;

  return { groups, modifier };
}

export function rollDice(
  formula: string,
  randomFn: (max: number) => number = (max) => Math.floor(Math.random() * max) + 1,
): DiceResults | null {
  const parsed = parseDiceFormula(formula);
  if (!parsed) return null;

  const groups: DiceGroup[] = parsed.groups.map(({ count, sides }) => {
    const absCount = Math.abs(count);
    const rolls = Array.from({ length: absCount }, () => randomFn(sides));
    const subtotal = rolls.reduce((a, b) => a + b, 0) * Math.sign(count);
    return { count, sides, rolls, subtotal };
  });

  const total = groups.reduce((sum, g) => sum + g.subtotal, 0) + parsed.modifier;

  return {
    formula,
    groups,
    modifier: parsed.modifier,
    total,
  };
}
