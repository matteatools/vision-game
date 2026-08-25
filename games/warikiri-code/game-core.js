(function (root, factory) {
  const core = factory(root.WarikiriData || (typeof require === "function" ? require("./stage-data.js") : null));
  if (typeof module === "object" && module.exports) module.exports = core;
  root.WarikiriCore = core;
})(typeof globalThis !== "undefined" ? globalThis : this, function (data) {
  "use strict";

  if (!data) throw new Error("WarikiriData is required");

  function gcd(a, b) {
    let x = Math.abs(Math.trunc(a));
    let y = Math.abs(Math.trunc(b));
    while (y) [x, y] = [y, x % y];
    return x;
  }

  function isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0;
  }

  function canDivideSingle(value, factor) {
    return isPositiveInteger(value) && isPositiveInteger(factor) && factor > 1 && value % factor === 0;
  }

  function canDividePair(values, factor) {
    return Array.isArray(values) && values.length === 2 && values.every((value) => canDivideSingle(value, factor));
  }

  function applyFactor(target, factor) {
    if (!target || !isPositiveInteger(factor) || factor < 2) {
      return Object.freeze({ ok: false, complete: false, target });
    }

    if (target.type === "double" || target.type === "fraction") {
      if (!canDividePair(target.values, factor)) return Object.freeze({ ok: false, complete: false, target });
      const values = target.values.map((value) => value / factor);
      return Object.freeze({
        ok: true,
        complete: gcd(values[0], values[1]) === 1,
        target: Object.freeze({ ...target, values: Object.freeze(values) })
      });
    }

    if (!canDivideSingle(target.value, factor)) return Object.freeze({ ok: false, complete: false, target });
    const value = target.value / factor;
    return Object.freeze({
      ok: true,
      complete: value === 1,
      target: Object.freeze({ ...target, value })
    });
  }

  function validFactors(target, factors) {
    return factors.filter((factor) => {
      if (target.type === "double" || target.type === "fraction") return canDividePair(target.values, factor);
      return canDivideSingle(target.value, factor);
    });
  }

  function createDoubleFragments(values) {
    if (!Array.isArray(values) || values.length !== 2) throw new Error("Two values are required");
    const pair = values.map((value) => Math.max(1, Math.trunc(Number(value) || 1)));
    if (gcd(pair[0], pair[1]) !== 1) return Object.freeze([]);
    return Object.freeze(pair
      .filter((value) => value > 1)
      .map((value) => Object.freeze({ type: "single", value })));
  }

  function factorFamily(factor) {
    const found = data.factorFamilies.find((family) => family.factors.includes(factor));
    return found ? found.id : "prime";
  }

  function mulberry32(seed) {
    let state = (Number(seed) || 1) >>> 0;
    return function random() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(list, random) {
    if (!list.length) throw new Error("Cannot pick from an empty list");
    return list[Math.floor(random() * list.length)];
  }

  function shuffle(list, random) {
    const copy = list.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const other = Math.floor(random() * (index + 1));
      [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    return copy;
  }

  function uniqueSorted(values) {
    return [...new Set(values)].sort((a, b) => a - b);
  }

  function createSingleNumber(activeFactors, options = {}) {
    const random = options.random || Math.random;
    const maxValue = Math.max(18, options.maxValue || 180);
    const minValue = Math.max(2, Math.min(maxValue, options.minValue || 2));
    const allowed = uniqueSorted(activeFactors.filter((factor) => factor >= 2 && factor <= 13));
    if (!allowed.length) throw new Error("At least one active factor is required");

    for (let attempt = 0; attempt < 80; attempt += 1) {
      const first = pick(allowed, random);
      let value = first;
      const steps = 1 + Math.floor(random() * (options.maxSteps || 3));
      for (let step = 1; step < steps; step += 1) {
        const possible = allowed.filter((factor) => value * factor <= maxValue);
        if (!possible.length) break;
        value *= pick(possible, random);
      }
      if (value >= minValue && value <= maxValue && validFactors({ type: "single", value }, allowed).length) return value;
    }

    const queue = [1];
    const seen = new Set(queue);
    for (let index = 0; index < queue.length; index += 1) {
      for (const factor of allowed) {
        const value = queue[index] * factor;
        if (value > maxValue || seen.has(value)) continue;
        if (value >= minValue) return value;
        seen.add(value);
        queue.push(value);
      }
    }

    return Math.min(maxValue, allowed[0]);
  }

  function primeBasesFor(factors) {
    const primes = [2, 3, 5, 7, 11, 13];
    const usable = primes.filter((prime) => factors.some((factor) => factor % prime === 0));
    return usable.length ? usable : [2, 3];
  }

  function createDoubleValues(activeFactors, options = {}) {
    const random = options.random || Math.random;
    const maxValue = Math.max(24, options.maxValue || 180);
    const allowed = uniqueSorted(activeFactors);
    const commonChoices = allowed.filter((factor) => factor <= Math.floor(maxValue / 3));
    const common = pick(commonChoices.length ? commonChoices : allowed, random);
    const bases = primeBasesFor(allowed);

    for (let attempt = 0; attempt < 80; attempt += 1) {
      const leftBase = pick(bases, random);
      let rightBase = pick(bases, random);
      if (rightBase === leftBase && bases.length > 1) rightBase = pick(bases.filter((value) => value !== leftBase), random);
      const left = common * leftBase;
      const right = common * rightBase;
      if (left <= maxValue && right <= maxValue && left !== right && gcd(left, right) > 1) return [left, right];
    }

    return [common * 2, common * 3];
  }

  function createBoss(activeFactors, bossNumber, elapsed, random = Math.random) {
    if (bossNumber <= data.fixedBosses.length) {
      const fixed = data.fixedBosses[bossNumber - 1];
      return fixed.type === "double"
        ? { type: "double", values: fixed.values.slice() }
        : { type: "boss", value: fixed.value };
    }

    const doubleChance = elapsed >= 50 ? 0.45 : 0;
    if (random() < doubleChance) {
      return { type: "double", values: createDoubleValues(activeFactors, { random, maxValue: 260 }) };
    }
    return { type: "boss", value: createSingleNumber(activeFactors, {
      random,
      minValue: 300,
      maxValue: 1300,
      maxSteps: 6
    }) };
  }

  function formatTime(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const minutesPart = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secondsPart = String(seconds % 60).padStart(2, "0");
    return `${minutesPart}:${secondsPart}`;
  }

  function scoreForHit(factor, combo) {
    return 12 + factor * 2 + Math.min(40, combo * 2);
  }

  return Object.freeze({
    gcd,
    canDivideSingle,
    canDividePair,
    applyFactor,
    validFactors,
    createDoubleFragments,
    factorFamily,
    mulberry32,
    pick,
    shuffle,
    uniqueSorted,
    createSingleNumber,
    createDoubleValues,
    createBoss,
    formatTime,
    scoreForHit
  });
});
