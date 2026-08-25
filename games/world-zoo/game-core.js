(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.WorldZooCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const GRID_SIZE = 5;
  const DIRECTIONS = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];
  const FILLER = Array.from("あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわんっゃゅょーぱず");

  function shuffle(items, rng = Math.random) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(rng() * (index + 1));
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }

  function inBounds(row, col) {
    return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
  }

  function sameCell(a, b) {
    return a && b && a.row === b.row && a.col === b.col;
  }

  function isAdjacent(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
  }

  function cellKey(row, col) {
    return `${row}:${col}`;
  }

  function countTurns(path) {
    let turns = 0;
    for (let index = 2; index < path.length; index += 1) {
      const before = path[index - 2];
      const middle = path[index - 1];
      const after = path[index];
      const first = { dr: middle.row - before.row, dc: middle.col - before.col };
      const second = { dr: after.row - middle.row, dc: after.col - middle.col };
      if (first.dr !== second.dr || first.dc !== second.dc) turns += 1;
    }
    return turns;
  }

  function findPlacement(grid, word, difficulty = 1, rng = Math.random) {
    const letters = Array.from(word);
    const starts = shuffle(
      Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => ({
        row: Math.floor(index / GRID_SIZE),
        col: index % GRID_SIZE,
      })),
      rng,
    ).sort((a, b) => {
      const av = grid[a.row][a.col] === letters[0] ? 1 : 0;
      const bv = grid[b.row][b.col] === letters[0] ? 1 : 0;
      return bv - av;
    });

    const maxTurns = difficulty === 1 ? Math.max(1, Math.ceil(letters.length / 3)) : difficulty === 2 ? Math.max(2, Math.ceil(letters.length / 2)) : Infinity;

    function walk(index, row, col, path, used) {
      if (!inBounds(row, col)) return null;
      if (used.has(cellKey(row, col))) return null;
      const current = grid[row][col];
      if (current !== null && current !== letters[index]) return null;

      const nextPath = [...path, { row, col }];
      if (countTurns(nextPath) > maxTurns) return null;
      if (index === letters.length - 1) return nextPath;

      const nextUsed = new Set(used);
      nextUsed.add(cellKey(row, col));
      const prior = nextPath.length > 1 ? nextPath[nextPath.length - 2] : null;
      const priorDirection = prior ? { dr: row - prior.row, dc: col - prior.col } : null;
      const candidates = shuffle(DIRECTIONS, rng)
        .map((direction) => {
          const nr = row + direction.dr;
          const nc = col + direction.dc;
          let score = rng();
          if (inBounds(nr, nc) && grid[nr][nc] === letters[index + 1]) score += 6;
          if (difficulty === 1 && priorDirection && direction.dr === priorDirection.dr && direction.dc === priorDirection.dc) score += 3;
          if (difficulty >= 3 && priorDirection && (direction.dr !== priorDirection.dr || direction.dc !== priorDirection.dc)) score += 1.25;
          return { direction, score };
        })
        .sort((a, b) => b.score - a.score);

      for (const candidate of candidates) {
        const result = walk(
          index + 1,
          row + candidate.direction.dr,
          col + candidate.direction.dc,
          nextPath,
          nextUsed,
        );
        if (result) return result;
      }
      return null;
    }

    for (const start of starts) {
      const path = walk(0, start.row, start.col, [], new Set());
      if (path) return path;
    }
    return null;
  }

  function findPaths(grid, word, limit = 1) {
    const letters = Array.from(word);
    const results = [];

    function walk(index, row, col, path, used) {
      if (results.length >= limit || !inBounds(row, col)) return;
      const key = cellKey(row, col);
      if (used.has(key) || grid[row][col] !== letters[index]) return;
      const nextPath = [...path, { row, col }];
      if (index === letters.length - 1) {
        results.push(nextPath);
        return;
      }
      const nextUsed = new Set(used);
      nextUsed.add(key);
      for (const direction of DIRECTIONS) {
        walk(index + 1, row + direction.dr, col + direction.dc, nextPath, nextUsed);
        if (results.length >= limit) return;
      }
    }

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        if (grid[row][col] === letters[0]) walk(0, row, col, [], new Set());
        if (results.length >= limit) return results;
      }
    }
    return results;
  }

  function validateBoard(grid, words) {
    return words.every((word) => findPaths(grid, word, 1).length === 1);
  }

  function generateBoard(words, options = {}) {
    const rng = options.rng || Math.random;
    const difficulty = options.difficulty || 1;
    const maxAttempts = options.maxAttempts || 600;
    const uniqueWords = [...new Set(words)];
    const placementOrder = [...uniqueWords].sort((a, b) => Array.from(b).length - Array.from(a).length);

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
      const paths = {};
      let failed = false;

      for (const word of placementOrder) {
        let path = null;
        for (let retry = 0; retry < 24 && !path; retry += 1) {
          path = findPlacement(grid, word, difficulty, rng);
        }
        if (!path) {
          failed = true;
          break;
        }
        Array.from(word).forEach((letter, index) => {
          const cell = path[index];
          grid[cell.row][cell.col] = letter;
        });
        paths[word] = path;
      }
      if (failed) continue;

      const targetLetters = Array.from(uniqueWords.join(""));
      for (let row = 0; row < GRID_SIZE; row += 1) {
        for (let col = 0; col < GRID_SIZE; col += 1) {
          if (grid[row][col] !== null) continue;
          const source = rng() < 0.58 && targetLetters.length ? targetLetters : FILLER;
          grid[row][col] = source[Math.floor(rng() * source.length)];
        }
      }

      if (validateBoard(grid, uniqueWords)) {
        return { grid, paths, signature: grid.flat().join("") };
      }
    }
    throw new Error("とける せきばんを つくれませんでした。");
  }

  function createPracticeBoard() {
    const grid = [
      ["ゆ", "そ", "あ", "き", "つ"],
      ["へ", "ほ", "う", "ね", "ね"],
      ["く", "ま", "お", "み", "ず"],
      ["は", "む", "す", "た", "ー"],
      ["お", "お", "か", "み", "ら"],
    ];
    const words = ["くま", "きつね", "ねずみ", "はむすたー", "おおかみ"];
    const paths = {};
    words.forEach((word) => {
      paths[word] = findPaths(grid, word, 1)[0];
    });
    return { grid, paths, signature: grid.flat().join("") };
  }

  return {
    GRID_SIZE,
    DIRECTIONS,
    isAdjacent,
    sameCell,
    countTurns,
    findPaths,
    validateBoard,
    generateBoard,
    createPracticeBoard,
  };
});
