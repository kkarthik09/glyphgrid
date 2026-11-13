export type Direction = 1 | -1;
export type Rotation = { row: number; col: number; dir: Direction };

export type Level = {
  id: number;
  size: number;
  tileKinds: number;
  goal: number[];
  start: number[];
  par: number;
  moveBudget: number;
  scramble: Rotation[];
  title: string;
};

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rotateBlock(
  board: number[],
  size: number,
  row: number,
  col: number,
  dir: Direction,
): number[] {
  if (!Number.isInteger(size) || size < 2 || board.length !== size * size || !Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= size - 1 || col >= size - 1 || (dir !== 1 && dir !== -1)) throw new RangeError("Invalid rotation");
  const next = [...board];
  const a = row * size + col;
  const b = a + 1;
  const c = a + size;
  const d = c + 1;

  if (dir === 1) {
    next[b] = board[a]!;
    next[d] = board[b]!;
    next[c] = board[d]!;
    next[a] = board[c]!;
  } else {
    next[c] = board[a]!;
    next[d] = board[c]!;
    next[b] = board[d]!;
    next[a] = board[b]!;
  }
  return next;
}

export function boardsEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function mismatchCount(a: number[], b: number[]): number {
  return a.reduce((count, value, index) => count + (value === b[index] ? 0 : 1), 0);
}

function makeGoal(size: number, tileKinds: number, seed: number): number[] {
  const rng = mulberry32(seed * 911 + size * 37);
  const modes = 4;
  const mode = seed % modes;
  const goal: number[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      let value: number;
      if (mode === 0) value = (row + col) % tileKinds;
      else if (mode === 1) value = (row * 2 + col) % tileKinds;
      else if (mode === 2) value = Math.min(row, col, size - 1 - row, size - 1 - col) % tileKinds;
      else value = Math.floor(rng() * tileKinds);
      goal.push(value);
    }
  }
  return goal;
}

export function generateLevel(id: number, customSeed?: number): Level {
  const seed = customSeed ?? id * 104729;
  const rng = mulberry32(seed);
  const size = id <= 6 ? 3 : id <= 24 ? 4 : 5;
  const tileKinds = id <= 4 ? 3 : id <= 20 ? 4 : 5;
  const goal = makeGoal(size, tileKinds, seed);
  const scrambleCount = Math.min(5 + Math.floor(id * 0.55), size === 5 ? 22 : 17);

  let board = [...goal];
  const scramble: Rotation[] = [];
  let previous: Rotation | undefined;

  for (let i = 0; i < scrambleCount; i += 1) {
    let move: Rotation;
    do {
      move = {
        row: Math.floor(rng() * (size - 1)),
        col: Math.floor(rng() * (size - 1)),
        dir: rng() > 0.5 ? 1 : -1,
      };
    } while (
      previous &&
      move.row === previous.row &&
      move.col === previous.col &&
      move.dir === -previous.dir
    );
    board = rotateBlock(board, size, move.row, move.col, move.dir);
    scramble.push(move);
    previous = move;
  }

  if (boardsEqual(board, goal)) {
    board = rotateBlock(board, size, 0, 0, 1);
    scramble.push({ row: 0, col: 0, dir: 1 });
  }

  const titles = ['First Light', 'Twin Turn', 'Color Current', 'Quiet Orbit', 'Neon Knot', 'Prism Trail'];
  return {
    id,
    size,
    tileKinds,
    goal,
    start: board,
    par: scramble.length,
    moveBudget: scramble.length + Math.max(4, Math.floor(size * 1.5)),
    scramble,
    title: titles[(id - 1) % titles.length]!,
  };
}

export function dailyLevel(date = new Date()): Level {
  const key = Number(`${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`);
  const level = generateLevel(32, key);
  return { ...level, id: 0, title: 'Daily Glyph' };
}

export function bestHint(board: number[], goal: number[], size: number): Rotation {
  let best: Rotation = { row: 0, col: 0, dir: 1 };
  let bestScore = Number.POSITIVE_INFINITY;

  for (let row = 0; row < size - 1; row += 1) {
    for (let col = 0; col < size - 1; col += 1) {
      for (const dir of [1, -1] as Direction[]) {
        const candidate = rotateBlock(board, size, row, col, dir);
        const score = mismatchCount(candidate, goal);
        if (score < bestScore) {
          bestScore = score;
          best = { row, col, dir };
        }
      }
    }
  }
  return best;
}

export function starsFor(moves: number, level: Level, hints: number): number {
  const adjusted = moves + hints * 2;
  if (adjusted <= level.par) return 3;
  if (adjusted <= level.par + 3) return 2;
  return 1;
}
