(function () {
  "use strict";

  const Core = window.WorldZooCore;
  const SaveData = window.WorldZooSaveData;
  const ROSTER_AREAS = window.WorldZooRoster || [];
  const ASSET_CATALOG = window.WorldZooAssetCatalog || {};
  const ROSTER_ANIMALS = ROSTER_AREAS.flatMap((area) => area.animals.map((animal) => ({
    ...animal,
    ...(ASSET_CATALOG[animal.id] || {}),
    areaId: area.id,
    areaTitle: area.title,
  })));
  const ROSTER_SIZE = ROSTER_ANIMALS.length || 100;
  const SAVE_KEY = SaveData.key;
  const LEGACY_SAVE_KEYS = SaveData.legacyKeys;
  const FIRST_AREA_ID = ROSTER_AREAS.find((area) => area.available)?.id || ROSTER_AREAS[0]?.id || "forest";
  const MOGUTAN_IMAGE = "assets/ui/mogutan-archaeologist-v2.webp";

  const DISCOVERABLE_ANIMALS = ROSTER_ANIMALS
    .filter((animal) => (animal.playable || animal.discoverable) && animal.status === "pair_ready" && animal.fact && animal.quote);
  const STORY = [
    { symbol: "⛏️", title: "わすれられた いせき", text: "こうこがくしゃの モグタンは、もりの おくで ふしぎな いりぐちを みつけました。そこは、せかいじゅうの どうぶつが くらした せかいどうぶつえんでした。" },
    { symbol: "🗿", title: "いしに なった どうぶつ", text: "どうぶつたちは いしになり、『なまえの いし』は 25この もじに くだけています。なまえが もどれば、どうぶつも よみがえりそうです。" },
    { symbol: "✨", title: "もじを つなごう", text: "うえ・した・ひだり・みぎへ、つながった もじを なぞりましょう。どうぶつの なまえを みつけて、せかいどうぶつえんを もういちど にぎやかにしよう！" },
  ];

  const PRACTICE_STAGES = [
    { id: "bear", title: "① みちを なぞろう", message: "ひかっている『く → ま』を なぞって、ゆびを はなそう。", showName: true, showPath: true, hints: 0 },
    { id: "fox", title: "② なまえから さがそう", message: "つぎは『きつね』。みちは じぶんで みつけよう。", showName: true, showPath: false, hints: 0 },
    { id: "mouse", title: "③ なまえを かくして さがそう", message: "まだ みつけていない どうぶつなら、どれを みつけても せいかいだよ。", showName: false, showPath: false, hints: 0, acceptAny: true },
    { id: "hamster", title: "④ せきぞうヒントを つかおう", message: "『ヒント』を 1かい おして、せきぞうを みよう。そのあと、まだ みつけていない どうぶつを さがそう。", showName: false, showPath: false, hints: 1, acceptAny: true },
    { id: "wolf", title: "⑤ さいしょの もじヒント", message: "『ヒント』を 2かい おして、さいしょの もじまで みよう。さいごの どうぶつを さがそう。", showName: false, showPath: false, hints: 2, acceptAny: true },
  ];
  const PRACTICE_ANIMAL_IDS = PRACTICE_STAGES.map((stage) => stage.id);
  function createDefaultSave() {
    return SaveData.createDefault({
      areaTabletCounts: Object.fromEntries(ROSTER_AREAS.map((area) => [area.id, area.tablets?.length || 0])),
      initiallyUnlockedAreas: [FIRST_AREA_ID],
      areaOrder: ROSTER_AREAS.filter((area) => area.available).map((area) => area.id),
    });
  }

  const app = document.getElementById("app");
  const modalRoot = document.getElementById("modalRoot");
  const liveRegion = document.getElementById("liveRegion");
  const saveStatus = document.getElementById("saveStatus");

  let save = loadSave();
  let currentView = "title";
  let currentAreaId = FIRST_AREA_ID;
  let storyPage = 0;
  let selectedMapTablet = initialSelectedTablet(currentAreaId);
  let game = null;
  let audioContext = null;
  let selectionLocked = false;
  let toastTimer = null;
  let lastFocus = null;
  let resizeTimer = null;

  function animalById(id) {
    return DISCOVERABLE_ANIMALS.find((animal) => animal.id === id);
  }

  function animalByName(name) {
    return DISCOVERABLE_ANIMALS.find((animal) => animal.name === name || animal.aliases?.includes(name));
  }

  function rosterAreaById(areaId) {
    return ROSTER_AREAS.find((area) => area.id === areaId);
  }

  function tabletsForArea(areaId) {
    return rosterAreaById(areaId)?.tablets || [];
  }

  function playableAnimalsForArea(areaId) {
    return DISCOVERABLE_ANIMALS
      .filter((animal) => animal.areaId === areaId && animal.playable)
      .sort((a, b) => a.order - b.order);
  }

  function tabletByNumber(number, areaId = currentAreaId) {
    return tabletsForArea(areaId).find((tablet) => tablet.number === number);
  }

  function areaPlaceName(area) {
    return area.title.replace(/のなかま$/, "");
  }

  function renderHabitatScene(area, animals, options = {}) {
    const { className = "" } = options;
    return `<figure class="habitat-scene ${className}">
      <img class="habitat-scene-image" src="${area.scene}" alt="${area.title}の どうぶつたちが くらす いちまいえ">
    </figure>`;
  }

  function initialSelectedTablet(areaId) {
    const tabletCount = tabletsForArea(areaId).length;
    const unlockedTablet = areaProgress(areaId).unlockedTablet;
    return Math.max(1, Math.min(tabletCount || 1, unlockedTablet || 1));
  }

  function areaProgress(areaId) {
    return save.areaProgress[areaId] || { unlockedTablet: 0, clearedTablets: [] };
  }

  function normalizeSave(raw) {
    return SaveData.normalize(raw, {
      animalIds: ROSTER_ANIMALS.map((animal) => animal.id),
      areaTabletCounts: Object.fromEntries(ROSTER_AREAS.map((area) => [area.id, area.tablets?.length || 0])),
      initiallyUnlockedAreas: [FIRST_AREA_ID],
      areaOrder: ROSTER_AREAS.filter((area) => area.available).map((area) => area.id),
    });
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return normalizeSave(JSON.parse(raw));
      for (const legacyKey of LEGACY_SAVE_KEYS) {
        const legacy = localStorage.getItem(legacyKey);
        if (!legacy) continue;
        const migrated = normalizeSave(JSON.parse(legacy));
        localStorage.setItem(SAVE_KEY, JSON.stringify(migrated));
        return migrated;
      }
      return createDefaultSave();
    } catch (error) {
      console.warn("ほぞんデータを しょきかしました。", error);
      return createDefaultSave();
    }
  }

  function writeSave() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      saveStatus.textContent = "ほぞんしました";
      window.setTimeout(() => { saveStatus.textContent = ""; }, 1300);
    } catch (error) {
      console.warn("ほぞんできませんでした。", error);
      saveStatus.textContent = "ほぞんできません";
    }
    updateSoundButtons();
  }

  function resetPagePosition() {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  function setView(name) {
    resetPagePosition();
    currentView = name;
    closeModal(false);
    if (name !== "game" && name !== "practice") game = null;
    render();
    resetPagePosition();
    window.requestAnimationFrame(resetPagePosition);
    app.focus({ preventScroll: true });
  }

  function navigateToArea(areaId) {
    const area = rosterAreaById(areaId);
    if (!area?.available || !save.unlockedAreas.includes(areaId) || !tabletsForArea(areaId).length) return false;
    currentAreaId = areaId;
    selectedMapTablet = initialSelectedTablet(areaId);
    setView("area");
    return true;
  }

  function render() {
    document.documentElement.dataset.view = currentView;
    document.body.dataset.view = currentView;
    if (currentView === "title") renderTitle();
    else if (currentView === "story") renderStory();
    else if (currentView === "areas") renderAreaMap();
    else if (currentView === "area") renderArea();
    else if (currentView === "game") renderGame();
    else if (currentView === "practice") renderGame();
    else if (currentView === "zoo") renderZoo();
    else if (currentView === "completion") renderCompletion();
  }

  function mogutanCard(message) {
    return `
      <div class="mogutan-card">
        <div class="mogutan-avatar" aria-hidden="true"><img src="${MOGUTAN_IMAGE}" alt=""></div>
        <p class="mogutan-speech"><strong>モグタン</strong><br>${message}</p>
      </div>`;
  }

  function soundToggleButton(extraClass = "") {
    const label = save.sound ? "おとを きる" : "おとを だす";
    return `<button class="sound-toggle ${extraClass}" data-sound-button type="button" aria-label="${label}" aria-pressed="${save.sound}" title="${label}">${save.sound ? "♪" : "×"}</button>`;
  }

  function renderTitle() {
    app.innerHTML = `
      <section class="screen title-screen" aria-labelledby="title-heading">
        <img class="title-art" src="assets/ui/title-world-zoo-v3.webp" alt="">
        <div class="title-scrim" aria-hidden="true"></div>
        <div class="title-progress" aria-label="ふっかつした どうぶつ ${save.revived.length}ひき、ぜんぶで ${ROSTER_SIZE}ひき">
          <span>ふっかつ</span><strong>${save.revived.length} / ${ROSTER_SIZE}</strong>
        </div>
        <div class="title-logo">
          <p>もじで いのちを もどす</p>
          <div class="title-emblem">
            <img class="title-logo-art" src="assets/ui/title-logo-illustrated-v2.webp" alt="">
            <h1 class="visually-hidden" id="title-heading">せかいどうぶつえん</h1>
          </div>
        </div>
        <nav class="title-menu" aria-label="メニュー">
          <button class="title-button title-practice-button" id="practiceButton" type="button">れんしゅう</button>
          <button class="title-button title-start-button" id="startButton" type="button">スタート</button>
          <button class="title-list-button" id="zooButton" type="button">どうぶつリスト <span>${save.revived.length} / ${ROSTER_SIZE}</span></button>
          <button class="title-park-link" id="parkButton" type="button">← ゲームパークへ もどる</button>
          ${soundToggleButton("title-sound-toggle")}
        </nav>
      </section>`;
    document.getElementById("startButton").addEventListener("click", () => {
      ensureAudio();
      if (save.introSeen) setView("areas");
      else { storyPage = 0; setView("story"); }
    });
    document.getElementById("practiceButton").addEventListener("click", startPractice);
    document.getElementById("zooButton").addEventListener("click", () => setView("zoo"));
    document.getElementById("parkButton").addEventListener("click", returnToGamePark);
  }

  function renderStory() {
    const page = STORY[storyPage];
    app.innerHTML = `
      <section class="screen panel story-screen" aria-labelledby="story-title">
        <div class="story-progress" aria-label="${storyPage + 1}ページめ、ぜんぶで 3ページ">
          ${STORY.map((_, index) => `<span class="story-dot ${index === storyPage ? "current" : ""}"></span>`).join("")}
        </div>
        <div class="story-scene">
          <div class="story-illustration"><span class="story-symbol" aria-hidden="true">${page.symbol}</span></div>
          <div class="story-copy">
            <p class="eyebrow">ものがたり ${storyPage + 1} / 3</p>
            <h2 id="story-title">${page.title}</h2>
            <p>${page.text}</p>
          </div>
        </div>
        <div class="button-row">
          ${storyPage > 0 ? '<button class="ghost-button" id="storyBack" type="button">もどる</button>' : ""}
          <button class="primary-button" id="storyNext" type="button">${storyPage === STORY.length - 1 ? "エリアへ いこう" : "つぎへ"}</button>
          <button class="ghost-button" id="storySkip" type="button">おはなしを とばす</button>
          ${soundToggleButton()}
        </div>
      </section>`;
    document.getElementById("storyBack")?.addEventListener("click", () => { storyPage -= 1; renderStory(); });
    document.getElementById("storyNext").addEventListener("click", () => {
      if (storyPage < STORY.length - 1) { storyPage += 1; renderStory(); }
      else finishStory();
    });
    document.getElementById("storySkip").addEventListener("click", finishStory);
  }

  function finishStory() {
    save.introSeen = true;
    writeSave();
    setView("areas");
  }

  function renderAreaMap() {
    const revived = new Set(save.revived);
    const revivedTotal = ROSTER_ANIMALS.filter((animal) => revived.has(animal.id)).length;
    const journeyArea = ROSTER_AREAS.find((area) => {
      if (!area.available || !save.unlockedAreas.includes(area.id)) return false;
      const tablets = tabletsForArea(area.id);
      const cleared = areaProgress(area.id).clearedTablets;
      return tablets.some((tablet) => !cleared.includes(tablet.number));
    }) || ROSTER_AREAS.find((area) => area.available && save.unlockedAreas.includes(area.id));
    app.innerHTML = `
      <section class="screen area-map-screen" aria-labelledby="area-map-title">
        <header class="panel area-map-header">
          <div><p class="eyebrow">100しゅるいの なかまを さがす たび</p><h1 class="screen-title" id="area-map-title">せかいどうぶつえん エリアマップ</h1><p class="screen-lead">エリアの せきばんを よんで、100リストを かんせいさせよう。</p></div>
          <div class="progress-badge">${revivedTotal} / ${ROSTER_SIZE} ふっかつ</div>
        </header>
        <div class="area-grid" aria-label="せかいどうぶつえんの エリア">
          ${ROSTER_AREAS.map((area) => {
            const found = area.animals.filter((animal) => revived.has(animal.id)).length;
            const unlocked = area.available && save.unlockedAreas.includes(area.id);
            const complete = found === area.animals.length;
            return `<button class="area-card ${unlocked ? "ready" : "locked"} ${complete ? "complete" : ""}" type="button" data-area="${area.id}" ${unlocked ? "" : "disabled"}>
              <span class="area-icon" aria-hidden="true">${area.icon}</span>
              <span class="area-card-copy"><strong>${area.title}</strong><small>${area.description}</small></span>
              <span class="area-progress">${found} / ${area.animals.length}</span>
              <span class="area-status">${complete ? "かんせい！" : unlocked ? "せきばんを えらぶ" : area.available ? "まえの エリアを かんせいしよう" : "じゅんびちゅう"}</span>
            </button>`;
          }).join("")}
        </div>
        ${mogutanCard(journeyArea ? `${journeyArea.title}の せきばんを しらべよう。よみがえった どうぶつは、100リストに きろくされるよ！` : "よみがえった どうぶつは、100リストに きろくされるよ！")}
        <div class="button-row">
          <button class="secondary-button" id="areaZooButton" type="button">どうぶつリスト</button>
          <button class="ghost-button" id="areaHomeButton" type="button">タイトルへ</button>
          ${soundToggleButton()}
        </div>
      </section>`;
    app.querySelectorAll("[data-area]").forEach((button) => {
      button.addEventListener("click", () => {
        navigateToArea(button.dataset.area);
      });
    });
    document.getElementById("areaZooButton").addEventListener("click", () => setView("zoo"));
    document.getElementById("areaHomeButton").addEventListener("click", () => setView("title"));
  }

  function renderArea() {
    const area = rosterAreaById(currentAreaId);
    const tablets = tabletsForArea(currentAreaId);
    const animals = playableAnimalsForArea(currentAreaId);
    const selected = tabletByNumber(selectedMapTablet);
    const progress = areaProgress(currentAreaId);
    const areaRevived = animals.filter((animal) => save.revived.includes(animal.id)).length;
    const areaNumber = ROSTER_AREAS.findIndex((candidate) => candidate.id === currentAreaId) + 1;
    if (!area || !selected) {
      setView("areas");
      return;
    }
    app.innerHTML = `
      <section class="screen forest-screen area-screen" data-area="${area.id}" aria-labelledby="area-title">
        <header class="panel forest-header area-header">
          <div><p class="eyebrow">せかいどうぶつえん・${areaNumber === 1 ? "さいしょ" : `${areaNumber}ばんめ`}の エリア</p><h1 class="screen-title" id="area-title">${area.title}</h1><p class="screen-lead">${tablets.length}まいの せきばんを よんで、${animals.length}ひきの なかまを よみがえらせよう。</p></div>
          <div class="progress-badge">${areaRevived} / ${animals.length} ふっかつ</div>
        </header>
        <div class="tablet-grid" aria-label="せきばんを えらぶ">
          ${tablets.map((tablet) => {
            const cleared = progress.clearedTablets.includes(tablet.number);
            const unlocked = tablet.number <= progress.unlockedTablet || cleared;
            const selectedClass = tablet.number === selectedMapTablet ? "ready" : "";
            return `<button class="tablet-card ${cleared ? "cleared" : selectedClass} ${unlocked ? "" : "locked"}" type="button" data-tablet="${tablet.number}" ${unlocked ? "" : "disabled"} aria-pressed="${tablet.number === selectedMapTablet}">
              <span class="tablet-number">${cleared ? "✓" : unlocked ? tablet.number : "🔒"}</span>
              <h3>${tablet.title}</h3>
              <p>${unlocked ? `${tablet.ids.length}びき・${tablet.copy}` : "まえの せきばんを クリアすると ひらくよ"}</p>
            </button>`;
          }).join("")}
        </div>
        <div class="panel map-guide">
          <div class="mogutan-avatar" aria-hidden="true"><img src="${MOGUTAN_IMAGE}" alt=""></div>
          <p class="mogutan-speech"><strong>モグタン</strong><br>${progress.clearedTablets.includes(selected.number) ? "この せきばんは よめたよ。なんどでも あそべるよ！" : `${selected.title}を しらべよう。なまえは せきばんの なかに かくれているよ。`}</p>
          <button class="primary-button" id="readTabletButton" type="button">せきばんを よむ</button>
        </div>
        <div class="button-row">
          <button class="ghost-button" id="areaBackButton" type="button">エリアマップへ</button>
          <button class="ghost-button" id="areaListButton" type="button">どうぶつリストを みる</button>
          <button class="ghost-button" id="areaTitleButton" type="button">タイトルへ</button>
          ${soundToggleButton()}
        </div>
      </section>`;
    app.querySelectorAll("[data-tablet]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedMapTablet = Number(button.dataset.tablet);
        startTablet(selectedMapTablet);
      });
    });
    document.getElementById("readTabletButton").addEventListener("click", () => startTablet(selectedMapTablet));
    document.getElementById("areaBackButton").addEventListener("click", () => setView("areas"));
    document.getElementById("areaListButton").addEventListener("click", () => setView("zoo"));
    document.getElementById("areaTitleButton").addEventListener("click", () => setView("title"));
  }

  function startTablet(number, areaId = currentAreaId) {
    resetPagePosition();
    const area = rosterAreaById(areaId);
    const tablet = tabletByNumber(number, areaId);
    const progress = areaProgress(areaId);
    if (!area?.available || !save.unlockedAreas.includes(areaId) || !tablet || number > progress.unlockedTablet) return false;
    currentAreaId = areaId;
    const targets = tablet.ids.map(animalById);
    let board;
    let previous = null;
    const boardKey = `world_zoo_board_${areaId}_${number}`;
    try { previous = sessionStorage.getItem(boardKey); } catch (error) { console.warn(error); }
    for (let retry = 0; retry < 6; retry += 1) {
      board = Core.generateBoard(targets.map((animal) => animal.name), { difficulty: tablet.difficulty });
      if (board.signature !== previous) break;
    }
    try { sessionStorage.setItem(boardKey, board.signature); } catch (error) { console.warn(error); }
    game = {
      mode: "game",
      areaId,
      tablet,
      targets,
      board,
      foundTargetIds: new Set(),
      foundSecretIds: new Set(),
      foundPaths: [],
      selected: [],
      selecting: false,
      activePointer: null,
      hintIndex: 0,
      hintLevel: 0,
      searchAfterClear: false,
    };
    currentView = "game";
    render();
    resetPagePosition();
    window.requestAnimationFrame(resetPagePosition);
    return true;
  }

  function startPractice() {
    resetPagePosition();
    ensureAudio();
    const board = Core.createPracticeBoard();
    game = {
      mode: "practice",
      tablet: { number: 0, title: "れんしゅうの せきばん" },
      targets: PRACTICE_STAGES.map((stage) => animalById(stage.id)),
      board,
      practiceStage: 0,
      practiceHintLevel: 0,
      foundPracticeIds: new Set(),
      foundTargetIds: new Set(),
      foundSecretIds: new Set(),
      foundPaths: [],
      selected: [],
      selecting: false,
      activePointer: null,
    };
    currentView = "practice";
    render();
    resetPagePosition();
    window.requestAnimationFrame(resetPagePosition);
  }

  function practiceInfo() {
    return PRACTICE_STAGES[game.practiceStage];
  }

  function practiceAnimal() {
    return animalById(practiceInfo().id);
  }

  function practiceHintAnimal() {
    const preferred = practiceAnimal();
    if (!game.foundPracticeIds.has(preferred.id)) return preferred;
    return game.targets.find((animal) => !game.foundPracticeIds.has(animal.id)) || preferred;
  }

  function renderGame() {
    if (!game) { navigateToArea(currentAreaId); return; }
    const practice = game.mode === "practice";
    const info = practice ? practiceInfo() : null;
    const gameTablets = practice ? [] : tabletsForArea(game.areaId);
    const gameArea = practice ? null : rosterAreaById(game.areaId);
    const remaining = practice ? PRACTICE_STAGES.length - game.practiceStage : game.targets.length - game.foundTargetIds.size;
    const title = practice ? info.title : game.tablet.title;
    const message = practice ? info.message : game.searchAfterClear ? "ひみつの どうぶつが いるかも？ いつでも つぎへ すすめるよ。" : "うえ・した・ひだり・みぎへ、つながった もじを なぞろう。";
    const displayWord = practice && info.showName ? practiceAnimal().name : "なにが みつかるかな？";

    app.innerHTML = `
      <section class="screen game-screen${practice ? " practice-game-screen" : ""}" ${practice ? "" : `data-area="${game.areaId}"`} aria-labelledby="game-title">
        ${practice ? `<div class="practice-banner">れんしゅう ${game.practiceStage + 1} / ${PRACTICE_STAGES.length}</div>` : ""}
        <div class="game-layout">
          <aside class="panel game-side${!practice && game.foundTargetIds.size === game.targets.length ? " is-complete" : ""}">
            <span class="game-kicker">${practice ? "なぞりかたを おぼえよう" : `だい${game.tablet.number}せきばん`}</span>
            ${practice
              ? `<h1 class="screen-title" id="game-title">${title}</h1>`
              : `<h1 class="visually-hidden" id="game-title">だい${game.tablet.number}せきばん</h1>`}
            <div class="game-mogutan">
              <img src="${MOGUTAN_IMAGE}" alt="こうこがくしゃの モグタン">
              <p class="game-message game-mogutan-speech"><strong>モグタン</strong><br><span id="gameMessage">${message}</span></p>
            </div>
            <div class="remaining-badge" id="remainingBadge">${practice ? `あと ${remaining}ステップ` : `あと ${remaining}びき`}</div>
            <div class="current-word" id="currentWord" aria-label="いま なぞっている もじ">${displayWord}</div>
            <div class="hint-preview" id="hintPreview" aria-live="polite"></div>
            <div class="game-actions${practice ? "" : " has-roster"}">
              <button class="primary-button" id="hintButton" type="button" ${practice && info.hints === 0 ? "disabled" : ""}>ヒント</button>
              ${practice ? "" : '<button class="secondary-button" id="gameRosterButton" type="button" aria-label="でてくる どうぶつを みる">なにがいる？</button>'}
              <button class="ghost-button" id="quitButton" type="button">やめる</button>
              ${soundToggleButton()}
            </div>
            ${practice ? "" : `
              <div class="clear-actions ${game.foundTargetIds.size === game.targets.length ? "visible" : ""}" id="clearActions">
                <button class="primary-button" id="nextTabletButton" type="button">${game.tablet.number === gameTablets.length ? `${areaPlaceName(gameArea)}を かんせいさせる` : "つぎの せきばん"}</button>
                <button class="secondary-button" id="keepSearchingButton" type="button">まだ さがす</button>
              </div>`}
          </aside>
          <div class="panel board-panel">
            <div class="board-frame" id="boardFrame">
              <div class="board" id="board" aria-label="5かける5の もじの せきばん">
                <svg class="path-layer" id="pathLayer" aria-hidden="true"></svg>
                ${game.board.grid.flatMap((row, rowIndex) => row.map((letter, colIndex) => `<div class="letter-cell" role="button" tabindex="0" data-row="${rowIndex}" data-col="${colIndex}" aria-label="${letter}">${letter}</div>`)).join("")}
              </div>
            </div>
          </div>
        </div>
      </section>`;

    bindBoard();
    document.getElementById("hintButton").addEventListener("click", useHint);
    document.getElementById("gameRosterButton")?.addEventListener("click", showGameRoster);
    document.getElementById("quitButton").addEventListener("click", confirmQuit);
    document.getElementById("nextTabletButton")?.addEventListener("click", goNextTablet);
    document.getElementById("keepSearchingButton")?.addEventListener("click", keepSearching);
    updateBoardClasses();
    window.requestAnimationFrame(drawPaths);
  }

  function bindBoard() {
    const board = document.getElementById("board");
    board.querySelectorAll(".letter-cell").forEach((cell) => {
      cell.addEventListener("pointerdown", (event) => {
        if (selectionLocked || modalRoot.firstChild) return;
        ensureAudio();
        event.preventDefault();
        game.selecting = true;
        game.activePointer = event.pointerId;
        game.selected = [];
        board.setPointerCapture?.(event.pointerId);
        addSelectedCell(Number(cell.dataset.row), Number(cell.dataset.col));
        playSound("start");
      });
      cell.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleKeyboardCell(Number(cell.dataset.row), Number(cell.dataset.col));
        }
      });
    });
    board.addEventListener("pointermove", (event) => {
      if (!game.selecting || event.pointerId !== game.activePointer) return;
      event.preventDefault();
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".letter-cell");
      if (target && board.contains(target)) addSelectedCell(Number(target.dataset.row), Number(target.dataset.col));
    });
    board.addEventListener("pointerup", finishPointerSelection);
    board.addEventListener("pointercancel", cancelSelection);
    board.addEventListener("lostpointercapture", () => {
      if (game?.selecting) finishSelection();
    });
  }

  function handleKeyboardCell(row, col) {
    if (selectionLocked) return;
    if (!game.selected.length) {
      game.selected = [];
      addSelectedCell(row, col);
      showToast("つぎの もじを えらぼう。おなじ もじで かくてい！");
      return;
    }
    const last = game.selected[game.selected.length - 1];
    if (last.row === row && last.col === col) finishSelection();
    else addSelectedCell(row, col);
  }

  function finishPointerSelection(event) {
    if (!game?.selecting || event.pointerId !== game.activePointer) return;
    event.preventDefault();
    finishSelection();
  }

  function addSelectedCell(row, col) {
    const next = { row, col };
    const selected = game.selected;
    const last = selected[selected.length - 1];
    if (Core.sameCell(last, next)) return;
    if (!last) selected.push(next);
    else {
      const previous = selected[selected.length - 2];
      if (Core.sameCell(previous, next)) selected.pop();
      else if (!Core.isAdjacent(last, next)) return;
      else if (selected.some((cell) => Core.sameCell(cell, next))) return;
      else selected.push(next);
    }
    if (selected.length > 1) playSound("add");
    updateBoardClasses();
    updateCurrentWord();
    drawPaths();
  }

  function cancelSelection() {
    if (!game) return;
    game.selecting = false;
    game.activePointer = null;
    game.selected = [];
    updateBoardClasses();
    updateCurrentWord();
    drawPaths();
  }

  function finishSelection() {
    if (!game || !game.selected.length) return;
    game.selecting = false;
    game.activePointer = null;
    const path = game.selected.map((cell) => ({ ...cell }));
    const word = path.map((cell) => game.board.grid[cell.row][cell.col]).join("");
    game.selected = [];
    updateBoardClasses();
    updateCurrentWord();
    drawPaths();
    checkAnswer(word, path);
  }

  async function checkAnswer(word, path) {
    if (selectionLocked) return;
    if (game.mode === "practice") {
      await checkPracticeAnswer(word, path);
      return;
    }
    const animal = animalByName(word);
    if (!animal) {
      showWrong();
      return;
    }
    const answerName = word === animal.name ? "" : word;
    const isTarget = game.targets.some((target) => target.id === animal.id);
    if (isTarget) {
      if (game.foundTargetIds.has(animal.id)) {
        playSound("add");
        showToast(answerName
          ? `『${answerName}』も せいかい！ ${animal.name}には もう あえたよ！`
          : `${animal.name}には もう あえたよ！`);
        return;
      }
      game.foundTargetIds.add(animal.id);
      game.foundPaths.push(path);
      updateBoardClasses();
      drawPaths();
      await revealAnimal(animal, false, answerName);
      updateGameProgress();
      return;
    }
    if (game.foundSecretIds.has(animal.id)) {
      playSound("add");
      showToast(answerName
        ? `『${answerName}』も せいかい！ ${animal.name}に また あえた！`
        : `${animal.name}に また あえた！`);
      return;
    }
    game.foundSecretIds.add(animal.id);
    game.foundPaths.push(path);
    updateBoardClasses();
    drawPaths();
    await revealAnimal(animal, true, answerName);
    updateGameProgress();
  }

  async function checkPracticeAnswer(word, path) {
    const info = practiceInfo();
    const expected = practiceAnimal();
    const answer = animalByName(word);
    if (!answer) {
      showWrong("ちがうみたい。もういちど さがそう！");
      return;
    }
    if (game.foundPracticeIds.has(answer.id)) {
      const message = `『${answer.name}』は みつけたね。ほかには いない？`;
      const speech = document.getElementById("gameMessage");
      if (speech) speech.textContent = message;
      showToast(message);
      announce(message);
      return;
    }
    if (!info.acceptAny && answer.id !== expected.id) {
      showToast(`${answer.name}も いるね！ まずは『${expected.name}』を なぞろう。`);
      return;
    }
    if (game.practiceHintLevel < info.hints) {
      const message = info.hints === 1
        ? "まず『ヒント』を 1かい おして、せきぞうを みてみよう！"
        : "『ヒント』を もういちど おして、さいしょの もじも みてみよう！";
      const speech = document.getElementById("gameMessage");
      if (speech) speech.textContent = message;
      showToast(message);
      announce(message);
      return;
    }
    game.foundPracticeIds.add(answer.id);
    game.foundPaths.push(path);
    playSound("correct");
    if (game.practiceStage === PRACTICE_STAGES.length - 1) {
      await showPracticeComplete();
      return;
    }
    game.practiceStage += 1;
    game.practiceHintLevel = 0;
    showToast("できた！ つぎへ すすもう");
    renderGame();
  }

  function showWrong(message = "ちがうみたい。もういちど さがそう！") {
    playSound("wrong");
    const frame = document.getElementById("boardFrame");
    frame?.classList.remove("wrong");
    void frame?.offsetWidth;
    frame?.classList.add("wrong");
    const messageNode = document.getElementById("gameMessage");
    if (messageNode) messageNode.textContent = message;
    announce(message);
  }

  async function revealAnimal(animal, secret, answerName = "") {
    const newlyRevived = !save.revived.includes(animal.id);
    if (newlyRevived) save.revived.push(animal.id);
    if (secret && !save.secretFound.includes(animal.id)) save.secretFound.push(animal.id);
    const seenBefore = save.seenRevival.includes(animal.id);
    if (!save.seenRevival.includes(animal.id)) save.seenRevival.push(animal.id);
    writeSave();
    playSound(secret ? "secret" : "correct");
    selectionLocked = true;
    await showRevivalModal(animal, { secret, quick: !newlyRevived || seenBefore, answerName });
    selectionLocked = false;
  }

  function updateGameProgress() {
    if (!game || game.mode !== "game") return;
    const remaining = game.targets.length - game.foundTargetIds.size;
    const badge = document.getElementById("remainingBadge");
    if (badge) badge.textContent = `あと ${remaining}びき`;
    if (remaining > 0) {
      const message = document.getElementById("gameMessage");
      if (message) message.textContent = "みつけた！ ほかの なまえも さがそう。";
      return;
    }
    const progress = areaProgress(game.areaId);
    const tablets = tabletsForArea(game.areaId);
    if (!progress.clearedTablets.includes(game.tablet.number)) progress.clearedTablets.push(game.tablet.number);
    progress.clearedTablets.sort((a, b) => a - b);
    progress.unlockedTablet = Math.max(progress.unlockedTablet, Math.min(tablets.length, game.tablet.number + 1));
    if (tablets.length && tablets.every((tablet) => progress.clearedTablets.includes(tablet.number))) unlockNextArea(game.areaId);
    writeSave();
    const hintPreview = document.getElementById("hintPreview");
    if (hintPreview) {
      hintPreview.classList.remove("visible");
      hintPreview.innerHTML = "";
    }
    const clearActions = document.getElementById("clearActions");
    clearActions?.classList.add("visible");
    const message = document.getElementById("gameMessage");
    if (message) message.textContent = "ぜんぶみつけた！";
    announce("ぜんぶみつけた！");
  }

  function useHint() {
    ensureAudio();
    if (game.mode === "practice") {
      usePracticeHint();
      return;
    }
    if (game.foundTargetIds.size === game.targets.length) {
      showToast("ひみつは じぶんで さがしてね！");
      return;
    }
    const unfound = game.targets.filter((animal) => !game.foundTargetIds.has(animal.id));
    if (!unfound.length) return;
    const animal = unfound[game.hintIndex % unfound.length];
    if (game.hintLevel === 0) {
      showHintPreview(animal, "この せきぞうの どうぶつを さがそう。", true);
      game.hintLevel = 1;
    } else {
      const start = game.board.paths[animal.name][0];
      showHintPreview(animal, `さいしょの もじは『${animal.name[0]}』だよ。`, false);
      flashStartCell(start);
      game.hintLevel = 0;
      game.hintIndex = (game.hintIndex + 1) % Math.max(1, unfound.length);
    }
    playSound("hint");
  }

  function usePracticeHint() {
    const info = practiceInfo();
    const animal = practiceHintAnimal();
    if (!info.hints) return;
    if (game.practiceHintLevel === 0) {
      game.practiceHintLevel = 1;
      showHintPreview(animal, "この せきぞうの どうぶつを さがそう。", true);
    } else if (info.hints >= 2 && game.practiceHintLevel === 1) {
      game.practiceHintLevel = 2;
      showHintPreview(animal, `さいしょの もじは『${animal.name[0]}』だよ。`, false);
      flashStartCell(game.board.paths[animal.name][0]);
    } else {
      showToast("ヒントは もう でているよ！");
    }
    playSound("hint");
  }

  function showHintPreview(animal, text, showStone) {
    const preview = document.getElementById("hintPreview");
    if (!preview) return;
    preview.classList.add("visible");
    preview.innerHTML = `${showStone ? `<img src="${animal.stone}" alt="${animal.name}の せきぞう">` : `<div class="tablet-number">${animal.name[0]}</div>`}<p>${text}</p>`;
    announce(text);
  }

  function flashStartCell(cell) {
    const node = document.querySelector(`.letter-cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
    if (!node) return;
    node.classList.add("hint-start");
    window.setTimeout(() => node.classList.remove("hint-start"), 4200);
  }

  function updateCurrentWord() {
    const node = document.getElementById("currentWord");
    if (!node || !game) return;
    const word = game.selected.map((cell) => game.board.grid[cell.row][cell.col]).join("");
    if (word) node.textContent = word;
    else if (game.mode === "practice" && practiceInfo().showName) node.textContent = practiceAnimal().name;
    else node.textContent = "なにが みつかるかな？";
  }

  function updateBoardClasses() {
    if (!game) return;
    document.querySelectorAll(".letter-cell").forEach((node) => {
      const cell = { row: Number(node.dataset.row), col: Number(node.dataset.col) };
      node.classList.toggle("selected", game.selected.some((selected) => Core.sameCell(selected, cell)));
      node.classList.toggle("found", game.foundPaths.some((path) => path.some((found) => Core.sameCell(found, cell))));
      node.classList.remove("practice-path");
    });
    if (game.mode === "practice" && practiceInfo().showPath) {
      const animal = practiceAnimal();
      game.board.paths[animal.name].forEach((cell) => {
        document.querySelector(`.letter-cell[data-row="${cell.row}"][data-col="${cell.col}"]`)?.classList.add("practice-path");
      });
    }
  }

  function pathPoints(path) {
    const board = document.getElementById("board");
    if (!board) return "";
    const rect = board.getBoundingClientRect();
    return path.map((cell) => {
      const node = board.querySelector(`.letter-cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
      const cellRect = node.getBoundingClientRect();
      return `${cellRect.left - rect.left + cellRect.width / 2},${cellRect.top - rect.top + cellRect.height / 2}`;
    }).join(" ");
  }

  function drawPaths() {
    const layer = document.getElementById("pathLayer");
    const board = document.getElementById("board");
    if (!layer || !board || !game) return;
    layer.setAttribute("viewBox", `0 0 ${board.clientWidth} ${board.clientHeight}`);
    const found = game.foundPaths.map((path) => `<polyline class="found-line" points="${pathPoints(path)}"></polyline>`).join("");
    const active = game.selected.length > 1 ? `<polyline class="active-line" points="${pathPoints(game.selected)}"></polyline>` : "";
    layer.innerHTML = found + active;
  }

  function keepSearching() {
    game.searchAfterClear = true;
    const message = document.getElementById("gameMessage");
    if (message) message.textContent = "ひみつの どうぶつが いるかも？ いつでも つぎへ すすめるよ。";
    document.getElementById("keepSearchingButton").disabled = true;
    showToast("ひみつの どうぶつが いるかも？");
  }

  function goNextTablet() {
    const tablets = tabletsForArea(game.areaId);
    if (game.tablet.number < tablets.length) startTablet(game.tablet.number + 1, game.areaId);
    else {
      playSound("complete");
      setView("completion");
    }
  }

  function unlockNextArea(areaId) {
    const areaIndex = ROSTER_AREAS.findIndex((area) => area.id === areaId);
    const nextArea = ROSTER_AREAS[areaIndex + 1];
    if (!nextArea?.available || !tabletsForArea(nextArea.id).length) return;
    if (!save.unlockedAreas.includes(nextArea.id)) save.unlockedAreas.push(nextArea.id);
    const nextProgress = areaProgress(nextArea.id);
    nextProgress.unlockedTablet = Math.max(1, nextProgress.unlockedTablet);
  }

  function confirmQuit() {
    const returnAreaId = game?.areaId || currentAreaId;
    const returnArea = rosterAreaById(returnAreaId);
    showConfirm({
      title: "せきばんを やめる？",
      message: game.mode === "practice" ? "れんしゅうの とちゅうです。タイトルへ もどりますか？" : "みつけて よみがえった どうぶつは、ちゃんと のこるよ。",
      confirmText: game.mode === "practice" ? "タイトルへ" : `${areaPlaceName(returnArea)}へ もどる`,
      onConfirm: () => game.mode === "practice" ? setView("title") : navigateToArea(returnAreaId),
    });
  }

  function showGameRoster() {
    openModal(`
      <div class="panel game-roster-modal" role="dialog" aria-modal="true" aria-labelledby="game-roster-title">
        <header class="game-roster-modal-header">
          <div><p class="eyebrow">せかいどうぶつえんの 100リスト</p><h2 id="game-roster-title">でてくる どうぶつ</h2><p>この 100しゅるいの なまえが せいかいになるよ。いまの せきばんの こたえだけを みせる リストでは ないよ。</p></div>
          <button class="ghost-button modal-close" type="button">とじる</button>
        </header>
        <div class="game-roster-areas">
          ${ROSTER_AREAS.map((area) => `<section class="game-roster-area ${area.id === game?.areaId ? "current" : ""}" data-roster-area="${area.id}" aria-labelledby="game-roster-${area.id}">
            <h3 id="game-roster-${area.id}">${area.title}</h3>
            <ul>${area.animals.map((animal) => `<li data-roster-animal="${animal.id}">${animal.name}</li>`).join("")}</ul>
          </section>`).join("")}
        </div>
      </div>`);
  }

  function renderZoo() {
    const revived = new Set(save.revived);
    const revivedTotal = ROSTER_ANIMALS.filter((animal) => revived.has(animal.id)).length;
    const unlockedPlayableAreas = ROSTER_AREAS.filter((area) => area.available && save.unlockedAreas.includes(area.id));
    const zooReturnArea = unlockedPlayableAreas.find((area) => area.id === currentAreaId) || unlockedPlayableAreas[0];
    const secretGuests = DISCOVERABLE_ANIMALS.filter((animal) => {
      const formalAreaOpen = rosterAreaById(animal.areaId)?.available && save.unlockedAreas.includes(animal.areaId);
      return revived.has(animal.id) && save.secretFound.includes(animal.id) && !formalAreaOpen;
    });
    app.innerHTML = `
      <section class="screen zoo-screen" aria-labelledby="zoo-title">
        <header class="panel zoo-header">
          <div><p class="eyebrow">100しゅるいの なかまの きろく</p><h1 class="screen-title" id="zoo-title">せかいどうぶつえんの どうぶつリスト</h1><p class="screen-lead">ここに のっている 100しゅるいが、せかいどうぶつえんで まっている なかまだよ。</p></div>
          <div class="zoo-records"><span class="record-chip">ぜんぶ ${revivedTotal} / ${ROSTER_SIZE}</span>${unlockedPlayableAreas.map((area) => `<span class="record-chip">${areaPlaceName(area)} ${area.animals.filter((animal) => revived.has(animal.id)).length} / ${area.animals.length}</span>`).join("")}<span class="record-chip">ひみつはっけん ${save.secretFound.length}しゅるい</span></div>
        </header>
        ${unlockedPlayableAreas.map((area, index) => {
          const animals = playableAnimalsForArea(area.id);
          const areaRevived = animals.filter((animal) => revived.has(animal.id)).length;
          const sceneReady = areaRevived === animals.length;
          return `<section class="zoo-current-area" aria-labelledby="playable-area-${area.id}">
            <div class="section-heading">
              <div><p class="eyebrow">${index === 0 ? "いま あそべる エリア" : "つぎに ひらいた エリア"}</p><h2 id="playable-area-${area.id}">${area.title}</h2></div>
              <div class="section-heading-actions"><span class="record-chip">${areaRevived} / ${animals.length}</span><button class="secondary-button area-scene-button" type="button" ${sceneReady ? `data-area-scene="${area.id}"` : "disabled"}>${sceneReady ? "いちまいえを みる" : "かんせいで ひらく"}</button></div>
            </div>
            <div class="animal-grid" aria-label="${area.title}の どうぶつずかん">
              ${animals.map((animal) => {
                const known = revived.has(animal.id);
                return `<button class="animal-card ${known ? "" : "unknown"}" type="button" data-animal="${animal.id}">
                  <img src="${known ? animal.color : animal.stone}" alt="${known ? animal.name : "まだ ふっかつしていない せきぞう"}" loading="lazy" decoding="async">
                  <strong>${known ? animal.name : "？？？"}</strong>
                  <span>${known ? `${area.title}・ふっかつ` : "まだ ねむっているよ"}</span>
                </button>`;
              }).join("")}
            </div>
          </section>`;
        }).join("")}
        ${secretGuests.length ? `<section class="zoo-current-area secret-guest-section" aria-labelledby="secret-guests-title">
          <div class="section-heading">
            <div><p class="eyebrow">よていより はやく あえた なかま</p><h2 id="secret-guests-title">ひみつの らいえんしゃ</h2></div>
            <span class="record-chip">${secretGuests.length}しゅるい</span>
          </div>
          <div class="animal-grid secret-guest-grid" aria-label="ひみつに はっけんした どうぶつ">
            ${secretGuests.map((animal) => `<button class="animal-card" type="button" data-animal="${animal.id}">
              <img src="${animal.color}" alt="${animal.name}" loading="lazy" decoding="async">
              <strong>${animal.name}</strong>
              <span>${animal.areaTitle}・ひみつはっけん</span>
            </button>`).join("")}
          </div>
        </section>` : ""}
        <section class="panel roster-panel" aria-labelledby="roster-title">
          <div class="section-heading roster-heading">
            <div><p class="eyebrow">さいしょから なまえを かくにんできるよ</p><h2 id="roster-title">せかいどうぶつえんの 100リスト</h2></div>
            <span class="roster-legend"><i aria-hidden="true">✓</i> ふっかつずみ</span>
          </div>
          <p class="roster-explanation">せきばんで みつかる「ひみつの どうぶつ」も、このリストの なかまだけ。リストに いない いきものは、もんだいには でてこないよ。</p>
          <div class="roster-areas">
            ${ROSTER_AREAS.map((area) => {
              const areaRevived = area.animals.filter((animal) => revived.has(animal.id)).length;
              return `<section class="roster-area" data-roster-area="${area.id}" aria-labelledby="roster-${area.id}">
                <header><h3 id="roster-${area.id}">${area.title}</h3><span>${areaRevived} / ${area.animals.length}</span></header>
                <ul>${area.animals.map((animal) => {
                  const known = revived.has(animal.id);
                  return `<li class="${known ? "revived" : ""}" data-roster-animal="${animal.id}"><span aria-hidden="true">${known ? "✓" : "○"}</span><strong>${animal.name}</strong></li>`;
                }).join("")}</ul>
              </section>`;
            }).join("")}
          </div>
        </section>
        <div class="button-row">
          ${zooReturnArea ? `<button class="secondary-button" id="zooAreaButton" type="button">${areaPlaceName(zooReturnArea)}へ いく</button>` : ""}
          <button class="ghost-button" id="zooHomeButton" type="button">タイトルへ</button>
          <button class="danger-button" id="resetButton" type="button">きろくを けす</button>
          ${soundToggleButton()}
        </div>
      </section>`;
    app.querySelectorAll("[data-animal]").forEach((button) => button.addEventListener("click", () => showAnimalDetail(animalById(button.dataset.animal))));
    app.querySelectorAll("[data-area-scene]").forEach((button) => button.addEventListener("click", () => showAreaScene(button.dataset.areaScene)));
    document.getElementById("zooAreaButton")?.addEventListener("click", () => navigateToArea(zooReturnArea.id));
    document.getElementById("zooHomeButton").addEventListener("click", () => setView("title"));
    document.getElementById("resetButton").addEventListener("click", confirmReset);
  }

  function showAreaScene(areaId) {
    const area = rosterAreaById(areaId);
    const animals = playableAnimalsForArea(areaId);
    const knownIds = new Set(save.revived);
    const knownCount = animals.filter((animal) => knownIds.has(animal.id)).length;
    openModal(`
      <div class="panel area-scene-modal" role="dialog" aria-modal="true" aria-labelledby="area-scene-title">
        <header class="area-scene-modal-header"><div><p class="eyebrow">${knownCount} / ${animals.length}ひき ふっかつ</p><h2 id="area-scene-title">${area.title}の いちまいえ</h2></div><button class="ghost-button modal-close" type="button">とじる</button></header>
        ${renderHabitatScene(area, animals, { className: "zoo-habitat-scene" })}
      </div>`);
  }

  function showAnimalDetail(animal) {
    const known = save.revived.includes(animal.id);
    if (!known) {
      openModal(`
        <div class="panel modal-card" role="dialog" aria-modal="true" aria-labelledby="unknown-title">
          <img class="animal-detail-image" src="${animal.stone}" alt="まだ ふっかつしていない どうぶつの せきぞう">
          <h2 id="unknown-title">まだ ねむっているよ</h2>
          <p>せきばんから なまえを みつけると、ここに すがたが きろくされるよ。</p>
          <button class="primary-button modal-close" type="button">とじる</button>
        </div>`);
      return;
    }
    openModal(`
      <div class="panel modal-card" role="dialog" aria-modal="true" aria-labelledby="animal-detail-title">
        <img class="animal-detail-image" src="${animal.color}" alt="${animal.name}">
        <p class="eyebrow">${animal.areaTitle}・ふっかつずみ</p>
        <h2 id="animal-detail-title">${animal.name}</h2>
        <div class="fact-box"><strong>ちいさな ひみつ</strong><br>${animal.fact}</div>
        <div class="quote-box"><strong>${animal.name}より</strong><br>「${animal.quote}」</div>
        <button class="primary-button modal-close" type="button">とじる</button>
      </div>`);
  }

  function confirmReset() {
    showConfirm({
      title: "きろくを けす？",
      message: "ふっかつした どうぶつ、せきばんの クリア、ひみつはっけんが すべて さいしょに もどります。",
      confirmText: "けす",
      danger: true,
      onConfirm: () => {
        const sound = save.sound;
        save = createDefaultSave();
        save.sound = sound;
        try {
          localStorage.removeItem(SAVE_KEY);
          LEGACY_SAVE_KEYS.forEach((key) => localStorage.removeItem(key));
        } catch (error) { console.warn(error); }
        writeSave();
        currentAreaId = FIRST_AREA_ID;
        selectedMapTablet = 1;
        showToast("きろくを けしました");
        renderZoo();
      },
    });
  }

  function renderCompletion() {
    const area = rosterAreaById(currentAreaId);
    const tablets = tabletsForArea(currentAreaId);
    const animals = playableAnimalsForArea(currentAreaId);
    const placeName = areaPlaceName(area);
    const nextArea = ROSTER_AREAS[ROSTER_AREAS.findIndex((candidate) => candidate.id === currentAreaId) + 1];
    const nextAreaReady = nextArea?.available && save.unlockedAreas.includes(nextArea.id);
    app.innerHTML = `
      <section class="screen completion-screen" data-area="${area.id}" aria-labelledby="completion-title">
        <div class="completion-scene-shell">
          ${renderHabitatScene(area, animals, { className: "completion-habitat-scene" })}
          <header class="completion-scene-copy">
            <p class="eyebrow">${area.title}・ぜん${tablets.length}まい クリア</p>
            <h1 id="completion-title"><span>${placeName}の ${animals.length}ひきが</span><span>よみがえった！</span></h1>
          </header>
          <div class="completion-mogutan-badge"><img src="${MOGUTAN_IMAGE}" alt=""><span>モグタン「やったね！ みんなの いろと えがおが もどったよ。」</span></div>
        </div>
        <div class="button-row completion-actions">
          <button class="primary-button" id="completionZooButton" type="button">どうぶつリストを みる</button>
          ${nextAreaReady ? `<button class="secondary-button" id="completionNextAreaButton" type="button">${nextArea.title}へ</button>` : ""}
          <button class="secondary-button" id="completionAreaButton" type="button">せきばんで また あそぶ</button>
          <button class="ghost-button" id="completionAreasButton" type="button">エリアマップへ</button>
          <button class="ghost-button" id="completionHomeButton" type="button">タイトルへ</button>
          ${soundToggleButton()}
        </div>
      </section>`;
    document.getElementById("completionZooButton").addEventListener("click", () => setView("zoo"));
    document.getElementById("completionNextAreaButton")?.addEventListener("click", () => navigateToArea(nextArea.id));
    document.getElementById("completionAreaButton").addEventListener("click", () => navigateToArea(currentAreaId));
    document.getElementById("completionAreasButton").addEventListener("click", () => setView("areas"));
    document.getElementById("completionHomeButton").addEventListener("click", () => setView("title"));
    window.setTimeout(() => {
      document.querySelector(".completion-scene-copy")?.classList.add("is-hidden");
    }, 2000);
  }

  function showRevivalModal(animal, options) {
    return new Promise((resolve) => {
      const { secret, quick, answerName = "" } = options;
      const title = quick ? `${animal.name}に また あえた！` : `${animal.name}が よみがえった！`;
      const stage = quick
        ? `<div class="revival-stage"><img class="color-form" style="opacity:1;animation:none;transform:none" src="${animal.color}" alt="${animal.name}"></div>`
        : `<div class="revival-stage"><img class="stone-form" src="${animal.stone}" alt="${animal.name}の せきぞう"><img class="color-form" src="${animal.color}" alt=""></div>`;
      openModal(`
        <div class="panel modal-card revival-modal-card" role="dialog" aria-modal="true" aria-labelledby="revival-title">
          ${secret ? '<div class="secret-label">✦ ひみつの どうぶつを みつけた！</div>' : ""}
          ${answerName ? `<div class="alias-answer-label">『${answerName}』も せいかい！</div>` : ""}
          ${stage}
          <h2 id="revival-title">${title}</h2>
          <div class="quote-box revival-quote"><strong>${animal.name}より</strong><br>「${animal.quote}」</div>
          <button class="primary-button" id="revivalClose" type="button">つづける</button>
        </div>`, { closeOnBackdrop: false, onClose: resolve });
      const button = document.getElementById("revivalClose");
      if (!quick) {
        button.disabled = true;
        window.setTimeout(() => { button.disabled = false; button.focus(); playSound("revive"); }, 1250);
      }
      button.addEventListener("click", () => closeModal());
    });
  }

  function showPracticeComplete() {
    selectionLocked = true;
    return new Promise((resolve) => {
      openModal(`
        <div class="panel modal-card" role="dialog" aria-modal="true" aria-labelledby="practice-complete-title">
          <div class="story-symbol" aria-hidden="true">🎓</div>
          <h2 id="practice-complete-title">れんしゅう かんりょう！</h2>
          <p>つながった もじを なぞる ほうほうと、2しゅるいの ヒントを おぼえたよ。れんしゅうの どうぶつは きろくには ふえません。</p>
          <div class="button-row"><button class="primary-button" id="practiceStartGame" type="button">ほんばんを はじめる</button><button class="ghost-button" id="practiceToTitle" type="button">タイトルへ</button></div>
        </div>`, { closeOnBackdrop: false, onClose: resolve });
      document.getElementById("practiceStartGame").addEventListener("click", () => { selectionLocked = false; closeModal(false); navigateToArea(FIRST_AREA_ID); resolve(); });
      document.getElementById("practiceToTitle").addEventListener("click", () => { selectionLocked = false; closeModal(false); setView("title"); resolve(); });
    });
  }

  function openModal(html, options = {}) {
    const { closeOnBackdrop = true, onClose = null } = options;
    lastFocus = document.activeElement;
    modalRoot.innerHTML = `<div class="modal-backdrop">${html}</div>`;
    modalRoot._onClose = onClose;
    const backdrop = modalRoot.firstElementChild;
    if (closeOnBackdrop) backdrop.addEventListener("pointerdown", (event) => { if (event.target === backdrop) closeModal(); });
    modalRoot.querySelectorAll(".modal-close").forEach((button) => button.addEventListener("click", () => closeModal()));
    const focusable = modalRoot.querySelector("button:not(:disabled)");
    focusable?.focus();
  }

  function closeModal(restoreFocus = true) {
    if (!modalRoot.firstChild) return;
    const callback = modalRoot._onClose;
    modalRoot.innerHTML = "";
    modalRoot._onClose = null;
    if (restoreFocus) lastFocus?.focus?.();
    if (typeof callback === "function") callback();
  }

  function showConfirm({ title, message, confirmText, onConfirm, danger = false }) {
    openModal(`
      <div class="panel modal-card" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">${title}</h2>
        <p>${message}</p>
        <div class="button-row"><button class="ghost-button modal-close" type="button">やめない</button><button class="${danger ? "danger-button" : "primary-button"}" id="confirmAction" type="button">${confirmText}</button></div>
      </div>`);
    document.getElementById("confirmAction").addEventListener("click", () => { closeModal(false); onConfirm(); });
  }

  function showToast(message) {
    document.querySelector(".toast")?.remove();
    window.clearTimeout(toastTimer);
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    announce(message);
    toastTimer = window.setTimeout(() => toast.remove(), 2400);
  }

  function announce(message) {
    liveRegion.textContent = "";
    window.setTimeout(() => { liveRegion.textContent = message; }, 20);
  }

  function returnToGamePark() {
    window.location.href = "../../";
  }

  function ensureAudio() {
    if (!save.sound) return null;
    if (!audioContext) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      audioContext = new AudioCtor();
    }
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    return audioContext;
  }

  function tone(frequency, start, duration, volume = 0.035, type = "sine") {
    const context = ensureAudio();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + start);
    gain.gain.setValueAtTime(0.0001, context.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + start);
    oscillator.stop(context.currentTime + start + duration + 0.02);
  }

  function playSound(type) {
    if (!save.sound) return;
    if (type === "start") tone(300, 0, 0.08, 0.02, "triangle");
    else if (type === "add") tone(430, 0, 0.055, 0.018, "triangle");
    else if (type === "wrong") { tone(180, 0, 0.16, 0.035, "sawtooth"); tone(145, 0.11, 0.2, 0.03, "sawtooth"); }
    else if (type === "correct") { tone(523, 0, 0.18, 0.04); tone(659, 0.12, 0.2, 0.04); tone(784, 0.24, 0.28, 0.045); }
    else if (type === "secret") { tone(659, 0, 0.16, 0.04); tone(880, 0.1, 0.2, 0.045); tone(1047, 0.21, 0.32, 0.04); }
    else if (type === "hint") { tone(392, 0, 0.12, 0.026); tone(523, 0.1, 0.16, 0.026); }
    else if (type === "revive") { tone(330, 0, 0.25, 0.035, "triangle"); tone(660, 0.18, 0.4, 0.045); }
    else if (type === "complete") { [523, 659, 784, 1047].forEach((frequency, index) => tone(frequency, index * 0.12, 0.35, 0.04)); }
  }

  function updateSoundButtons() {
    const label = save.sound ? "おとを きる" : "おとを だす";
    app.querySelectorAll("[data-sound-button]").forEach((button) => {
      button.textContent = save.sound ? "♪" : "×";
      button.setAttribute("aria-label", label);
      button.setAttribute("aria-pressed", String(save.sound));
      button.title = label;
    });
  }

  app.addEventListener("click", (event) => {
    if (!event.target.closest("[data-sound-button]")) return;
    save.sound = !save.sound;
    if (save.sound) { ensureAudio(); playSound("hint"); }
    writeSave();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modalRoot.firstChild) closeModal();
  });

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(drawPaths, 80);
  });

  window.addEventListener("error", (event) => {
    console.error("せかいどうぶつえんで エラーが おきました。", event.error || event.message);
  });

  window.WorldZooGame = {
    getSave: () => JSON.parse(JSON.stringify(save)),
    getGame: () => game ? { mode: game.mode, areaId: game.areaId || null, tablet: game.tablet.number, grid: game.board.grid, targets: game.targets.map((animal) => animal.name) } : null,
    resolveAnimalName: (name) => animalByName(name)?.id || null,
    startTablet,
    startPractice,
    normalizeSaveForTest: (raw) => normalizeSave(raw),
    resetForTest: () => {
      save = createDefaultSave();
      currentAreaId = FIRST_AREA_ID;
      selectedMapTablet = initialSelectedTablet(currentAreaId);
      writeSave();
      setView("title");
    },
  };

  updateSoundButtons();
  render();
})();
