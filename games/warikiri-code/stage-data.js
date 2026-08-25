(function (root, factory) {
  const data = factory();
  if (typeof module === "object" && module.exports) module.exports = data;
  root.WarikiriData = data;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const factorFamilies = Object.freeze([
    Object.freeze({ id: "prime", label: "もと", factors: Object.freeze([2, 3, 5, 7, 11, 13]) }),
    Object.freeze({ id: "power", label: "くりかえし", factors: Object.freeze([4, 8, 9]) }),
    Object.freeze({ id: "mixed", label: "くみあわせ", factors: Object.freeze([6, 10, 12]) })
  ]);

  const keyOrder = Object.freeze([2, 3, 5, 7, 11, 13, 4, 8, 9, 6, 10, 12]);

  const mainUnlocks = Object.freeze([
    Object.freeze({ afterBoss: 1, factors: Object.freeze([5, 7]), message: "5と 7の キーが ひらいた！" }),
    Object.freeze({ afterBoss: 2, factors: Object.freeze([11, 13]), message: "11と 13の キーが ひらいた！" }),
    Object.freeze({ afterBoss: 3, factors: Object.freeze([4, 8, 9]), message: "くりかえし キーが ひらいた！" }),
    Object.freeze({ afterBoss: 4, factors: Object.freeze([6, 10, 12]), message: "くみあわせ キーが ひらいた！" })
  ]);

  const practiceSteps = Object.freeze([
    Object.freeze({
      id: "two-three",
      title: "2と 3で わる",
      message: "2だけ、3だけで われる かずの あとは、6のように どちらでも われる かずも ためそう。",
      unlock: Object.freeze([2, 3]),
      tasks: Object.freeze([
        Object.freeze({ type: "single", value: 8, prefer: 2 }),
        Object.freeze({ type: "single", value: 9, prefer: 3 }),
        Object.freeze({ type: "single", value: 6 })
      ])
    }),
    Object.freeze({
      id: "five-seven",
      title: "5と 7を ついか",
      message: "5と 7を ひとつずつ ためしたら、35のように どちらでも われる かずへ すすもう。",
      unlock: Object.freeze([5, 7]),
      tasks: Object.freeze([
        Object.freeze({ type: "single", value: 25, prefer: 5 }),
        Object.freeze({ type: "single", value: 49, prefer: 7 }),
        Object.freeze({ type: "single", value: 35 })
      ])
    }),
    Object.freeze({
      id: "eleven-thirteen",
      title: "11と 13を ついか",
      message: "11と 13を ひとつずつ ためしたら、143を どちらから わるか えらぼう。",
      unlock: Object.freeze([11, 13]),
      tasks: Object.freeze([
        Object.freeze({ type: "single", value: 121, prefer: 11 }),
        Object.freeze({ type: "single", value: 169, prefer: 13 }),
        Object.freeze({ type: "single", value: 143 })
      ])
    }),
    Object.freeze({
      id: "powers",
      title: "くりかえし キー",
      message: "4・8・9を ひとつずつ ためしたら、どれでも われる 72に ちょうせんしよう。",
      unlock: Object.freeze([4, 8, 9]),
      tasks: Object.freeze([
        Object.freeze({ type: "single", value: 16, prefer: 4 }),
        Object.freeze({ type: "single", value: 64, prefer: 8 }),
        Object.freeze({ type: "single", value: 81, prefer: 9 }),
        Object.freeze({ type: "single", value: 72 })
      ])
    }),
    Object.freeze({
      id: "mixed",
      title: "くみあわせ キー",
      message: "6・10・12を ひとつずつ ためしたら、3つとも つかえる 60で えらんでみよう。",
      unlock: Object.freeze([6, 10, 12]),
      tasks: Object.freeze([
        Object.freeze({ type: "single", value: 36, prefer: 6 }),
        Object.freeze({ type: "single", value: 100, prefer: 10 }),
        Object.freeze({ type: "single", value: 144, prefer: 12 }),
        Object.freeze({ type: "single", value: 60 })
      ])
    }),
    Object.freeze({
      id: "big-boss",
      title: "ビッグ ボス 3たい",
      message: "おおきな かずも おなじ。いちばん はやく ちいさく できる キーを さがそう。",
      unlock: Object.freeze([]),
      tasks: Object.freeze([
        Object.freeze({ type: "boss", value: 360 }),
        Object.freeze({ type: "boss", value: 484 }),
        Object.freeze({ type: "boss", value: 675 })
      ])
    }),
    Object.freeze({
      id: "double-boss",
      title: "ダブル ボス 3たい",
      message: "まずは ふたつを いっしょに わろう。ぶんりしたら、それぞれを 1まで わるよ！",
      unlock: Object.freeze([]),
      tasks: Object.freeze([
        Object.freeze({ type: "double", values: Object.freeze([15, 12]) }),
        Object.freeze({ type: "double", values: Object.freeze([20, 30]) }),
        Object.freeze({ type: "double", values: Object.freeze([44, 66]) })
      ])
    })
  ]);

  const fixedBosses = Object.freeze([
    Object.freeze({ type: "boss", value: 324 }),
    Object.freeze({ type: "boss", value: 350 }),
    Object.freeze({ type: "boss", value: 429 }),
    Object.freeze({ type: "boss", value: 576 }),
    Object.freeze({ type: "double", values: Object.freeze([60, 90]) })
  ]);

  const fractionQuestions = Object.freeze([
    Object.freeze([8, 12]),
    Object.freeze([12, 18]),
    Object.freeze([15, 25]),
    Object.freeze([14, 21]),
    Object.freeze([20, 30]),
    Object.freeze([18, 24]),
    Object.freeze([24, 36]),
    Object.freeze([28, 42]),
    Object.freeze([45, 60]),
    Object.freeze([66, 78])
  ]);

  return Object.freeze({
    factorFamilies,
    keyOrder,
    mainUnlocks,
    practiceSteps,
    fixedBosses,
    fractionQuestions
  });
});
