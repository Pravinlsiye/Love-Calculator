export type Category =
  | "Friends"
  | "Love"
  | "Affection"
  | "Marriage"
  | "Enemy"
  | "Sister";

export interface LoveResult {
  percentage: number;
  category: Category;
  tagline: string;
  emoji: string;
  perfectMatch: boolean;
  remaining: number;
}

export interface MatchPair {
  i: number;
  j: number;
  char: string;
}

export interface FlamesStep {
  before: string[];
  startIdx: number;
  visited: number[];
  removeIdx: number;
  removed: string;
  after: string[];
}

export interface LoveAnimation {
  name1: string;
  name2: string;
  pairs: MatchPair[];
  struck1: boolean[];
  struck2: boolean[];
  remaining1: string;
  remaining2: string;
  count: number;
  flamesSteps: FlamesStep[];
  result: LoveResult;
}

const CATEGORIES: Category[] = [
  "Friends",
  "Love",
  "Affection",
  "Marriage",
  "Enemy",
  "Sister",
];

const TAGLINES: Record<Category, { tagline: string; emoji: string }> = {
  Friends: { tagline: "Best buddies forever.", emoji: "🤝" },
  Love: { tagline: "Sparks are flying.", emoji: "💖" },
  Affection: { tagline: "Soft, warm, sweet.", emoji: "🌸" },
  Marriage: { tagline: "Wedding bells incoming.", emoji: "💍" },
  Enemy: { tagline: "Tension in the air.", emoji: "⚔️" },
  Sister: { tagline: "Family-level bond.", emoji: "👯" },
};

const sanitize = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, "");

function findPairs(a: string, b: string): MatchPair[] {
  const arrA = a.split("");
  const arrB = b.split("");
  const pairs: MatchPair[] = [];
  for (let i = 0; i < arrA.length; i++) {
    for (let j = 0; j < arrB.length; j++) {
      if (arrA[i] !== "." && arrB[j] !== "." && arrA[i] === arrB[j]) {
        pairs.push({ i, j, char: arrA[i] });
        arrA[i] = ".";
        arrB[j] = ".";
        break;
      }
    }
  }
  return pairs;
}

function flamesElimination(count: number): {
  steps: FlamesStep[];
  finalIdx: number;
} {
  const steps: FlamesStep[] = [];
  let list = ["F", "L", "A", "M", "E", "S"];
  let startIdx = 0;
  while (list.length > 1) {
    const visited: number[] = [];
    let pos = startIdx;
    for (let k = 0; k < count; k++) {
      pos = pos % list.length;
      visited.push(pos);
      pos++;
    }
    const removeIdx = visited[visited.length - 1];
    const removed = list[removeIdx];
    const after = list.filter((_, i) => i !== removeIdx);
    steps.push({
      before: [...list],
      startIdx,
      visited,
      removeIdx,
      removed,
      after,
    });
    startIdx = removeIdx % after.length;
    list = after;
  }
  return { steps, finalIdx: CATEGORIES.indexOf(list[0] as Category) };
}

function categoryFromLetter(letter: string): Category {
  switch (letter) {
    case "F":
      return "Friends";
    case "L":
      return "Love";
    case "A":
      return "Affection";
    case "M":
      return "Marriage";
    case "E":
      return "Enemy";
    case "S":
      return "Sister";
    default:
      return "Friends";
  }
}

function loveLetterScore(combined: string): number {
  const targets = "LOVES";
  let score = 0;
  for (const ch of targets) {
    const occurrences = combined.split(ch).length - 1;
    score += occurrences;
  }
  return score;
}

export function calculateAnimation(
  rawName1: string,
  rawName2: string
): LoveAnimation | null {
  const name1 = sanitize(rawName1);
  const name2 = sanitize(rawName2);
  if (!name1 || !name2) return null;

  const pairs = findPairs(name1, name2);
  const struck1 = new Array(name1.length).fill(false);
  const struck2 = new Array(name2.length).fill(false);
  for (const p of pairs) {
    struck1[p.i] = true;
    struck2[p.j] = true;
  }
  const remaining1 = name1
    .split("")
    .filter((_, i) => !struck1[i])
    .join("");
  const remaining2 = name2
    .split("")
    .filter((_, i) => !struck2[i])
    .join("");
  const count = remaining1.length + remaining2.length;

  const totalLen = name1.length + name2.length;
  const overlapRatio = (pairs.length * 2) / totalLen;
  const lovesBonus = Math.min(loveLetterScore(name1 + name2) / 8, 1);
  const lengthSymmetry =
    1 -
    Math.abs(name1.length - name2.length) /
      Math.max(name1.length, name2.length);
  const raw = overlapRatio * 55 + lovesBonus * 25 + lengthSymmetry * 20;
  const percentage = Math.max(1, Math.min(100, Math.round(raw)));

  if (count === 0) {
    return {
      name1,
      name2,
      pairs,
      struck1,
      struck2,
      remaining1,
      remaining2,
      count,
      flamesSteps: [],
      result: {
        percentage: 100,
        category: "Marriage",
        tagline: "Perfect Match. Written in the stars.",
        emoji: "💞",
        perfectMatch: true,
        remaining: 0,
      },
    };
  }

  const { steps } = flamesElimination(count);
  const finalLetter = steps.length
    ? steps[steps.length - 1].after[0]
    : "F";
  const category = categoryFromLetter(finalLetter);
  const meta = TAGLINES[category];

  return {
    name1,
    name2,
    pairs,
    struck1,
    struck2,
    remaining1,
    remaining2,
    count,
    flamesSteps: steps,
    result: {
      percentage,
      category,
      tagline: meta.tagline,
      emoji: meta.emoji,
      perfectMatch: false,
      remaining: count,
    },
  };
}
