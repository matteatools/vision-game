(function () {
  "use strict";

  const VERSION = 2;
  const KEY = "sekai_dobutsuen_save_v2";
  const LEGACY_KEYS = ["sekai_dobutsuen_save_v1"];

  function uniqueValidIds(value, allowedIds) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((id) => allowedIds.has(id)))];
  }

  function createDefault(options = {}) {
    const areaTabletCounts = options.areaTabletCounts || {};
    const initiallyUnlockedAreas = new Set(options.initiallyUnlockedAreas || ["forest"]);
    const areaProgress = {};
    Object.entries(areaTabletCounts).forEach(([areaId, tabletCount]) => {
      areaProgress[areaId] = {
        unlockedTablet: tabletCount > 0 && initiallyUnlockedAreas.has(areaId) ? 1 : 0,
        clearedTablets: [],
      };
    });
    return {
      version: VERSION,
      introSeen: false,
      unlockedAreas: [...initiallyUnlockedAreas].filter((areaId) => Object.hasOwn(areaTabletCounts, areaId)),
      areaProgress,
      revived: [],
      seenRevival: [],
      secretFound: [],
      sound: true,
    };
  }

  function normalize(raw, options = {}) {
    const animalIds = new Set(options.animalIds || []);
    const areaTabletCounts = options.areaTabletCounts || {};
    const areaIds = new Set(Object.keys(areaTabletCounts));
    const defaults = createDefault(options);
    const legacyForest = {
      unlockedTablet: raw?.unlockedTablet,
      clearedTablets: raw?.clearedTablets,
    };
    const areaProgress = {};

    Object.entries(areaTabletCounts).forEach(([areaId, tabletCountValue]) => {
      const tabletCount = Math.max(0, Number(tabletCountValue) || 0);
      const source = raw?.areaProgress?.[areaId] || (areaId === "forest" ? legacyForest : null) || {};
      const clearedTablets = Array.isArray(source.clearedTablets)
        ? [...new Set(source.clearedTablets.map(Number).filter((number) => number >= 1 && number <= tabletCount))]
        : [];
      const minimumUnlocked = defaults.unlockedAreas.includes(areaId) && tabletCount > 0 ? 1 : 0;
      const furthestCleared = clearedTablets.length ? Math.max(...clearedTablets) : 0;
      const unlockedAfterClear = furthestCleared ? Math.min(tabletCount, furthestCleared + 1) : 0;
      areaProgress[areaId] = {
        unlockedTablet: Math.max(minimumUnlocked, unlockedAfterClear, Math.min(tabletCount, Number(source.unlockedTablet) || 0)),
        clearedTablets,
      };
    });

    const requestedUnlockedAreas = Array.isArray(raw?.unlockedAreas) ? raw.unlockedAreas : [];
    const unlockedAreas = [...new Set([...defaults.unlockedAreas, ...requestedUnlockedAreas.filter((areaId) => areaIds.has(areaId))])];
    const areaOrder = Array.isArray(options.areaOrder)
      ? options.areaOrder.filter((areaId) => areaIds.has(areaId))
      : [];
    for (let index = 1; index < areaOrder.length; index += 1) {
      const previousAreaId = areaOrder[index - 1];
      const nextAreaId = areaOrder[index];
      const previousTabletCount = Math.max(0, Number(areaTabletCounts[previousAreaId]) || 0);
      const previousCleared = areaProgress[previousAreaId]?.clearedTablets || [];
      const previousComplete = previousTabletCount > 0
        && Array.from({ length: previousTabletCount }, (_, tabletIndex) => tabletIndex + 1)
          .every((tabletNumber) => previousCleared.includes(tabletNumber));
      if (!previousComplete) break;
      if (!unlockedAreas.includes(nextAreaId)) unlockedAreas.push(nextAreaId);
      if ((areaProgress[nextAreaId]?.unlockedTablet || 0) < 1 && (Number(areaTabletCounts[nextAreaId]) || 0) > 0) {
        areaProgress[nextAreaId].unlockedTablet = 1;
      }
    }

    return {
      version: VERSION,
      introSeen: Boolean(raw?.introSeen),
      unlockedAreas,
      areaProgress,
      revived: uniqueValidIds(raw?.revived, animalIds),
      seenRevival: uniqueValidIds(raw?.seenRevival, animalIds),
      secretFound: uniqueValidIds(raw?.secretFound, animalIds),
      sound: raw?.sound !== false,
    };
  }

  window.WorldZooSaveData = Object.freeze({
    version: VERSION,
    key: KEY,
    legacyKeys: Object.freeze([...LEGACY_KEYS]),
    createDefault,
    normalize,
  });
})();
