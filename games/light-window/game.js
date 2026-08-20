(function () {
    "use strict";

    const Core = window.LightWindowShapes;
    const PUZZLE_BANK = window.LIGHT_WINDOW_PUZZLES || [];
    const { SHAPES, transform, orientations, bounds, cellKey } = Core;

    const BEST_KEY = "light_window_best_v1";
    const COLLECTION_KEY = "light_window_collection_v1";
    const PADDING = 1;
    const BLOCK_DOUBLE_CLICK_DELAY = 350;
    const BLOCK_DRAG_THRESHOLD = 7;
    const BLOCK_LONG_PRESS_DELAY = 220;
    const TIER_SEQUENCE = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
    const TIER_LABELS = {
        1: "やさしい まど",
        2: "くるっと まど",
        3: "ひらめきの まど",
        4: "むずかしい まど",
        5: "げいじゅつの まど"
    };
    const ARTIST_QUOTES = Object.freeze([
        "かんぺきさ。 うつくしさに かんぺきは ないけどね。",
        "ああ、 まどから よろこびのこえが きこえるよ。",
        "ひかりは いそがない。 いつも いちばんいい じかんにくる。",
        "いろは おしゃべりだ。 しずかなのにね。",
        "まどは そとをみせる。 でも ほんとうは こころをみているのさ。",
        "きょうのひかりは すこし きどっているね。",
        "うつくしいものは まがっていても まっすぐさ。",
        "げいじゅつは こたえじゃない。 すてきな なぞなぞさ。",
        "ひらめきは とつぜんくる。 おちゃも のまずにね。",
        "このまどは まだ じぶんのかおを しらないのさ。",
        "かげがあるから ひかりは おしゃれができる。",
        "しずかな いろほど おおきなうたを もっている。",
        "まどのむこうで そらが じゅんばんをまっているよ。",
        "ひかりを つかまえるなかれ。 まどに すわらせるのさ。",
        "うつくしさは はかれない。 ものさしが てれてしまうからね。",
        "いいまどには かぜも ノックをするのさ。",
        "いろといろの あいだには ひみつのあくしゅがある。",
        "まよいは げいじゅつの ちいさな まえおきさ。",
        "ひかりは すきまがすきだ。 きょうは おるすだけどね。",
        "このかたちは まだ うたの とちゅうなのさ。",
        "たいようも ときどき まどを みにくるんだよ。",
        "きれいだね。 まだ なにも できていないけど。",
        "まどは かべにかいた そらへの おてがみさ。",
        "げいじゅつかは なやむ。 なやんでいる かおも げいじゅつだ。",
        "ひかりのあしあとには いろが のこるのさ。",
        "このへやの しずけさは とても にぎやかだね。",
        "いろは となりのいろを みて すこし ほほえむ。",
        "うつくしさは さいごにくる。 さいしょから いたとしてもね。",
        "まどが ためいきをついた。 たのしみに しているらしい。",
        "きょうのげいじゅつは きのうより すこし あしただ。"
    ]);
    const WINDOW_NAMES = Object.freeze([
        "よろこびのまど",
        "ひなたのまど",
        "そよかぜのまど",
        "にじのまど",
        "ほほえみのまど",
        "きらめきのまど",
        "あさつゆのまど",
        "うたごえのまど",
        "ゆめみるまど",
        "こもれびのまど",
        "おひさまのまど",
        "しずくのまど",
        "わくわくのまど",
        "そらいろのまど",
        "はなうたのまど",
        "ときめきのまど",
        "やさしさのまど",
        "おもいでのまど",
        "ひらめきのまど",
        "あこがれのまど",
        "おどるひかりのまど",
        "ひみつのまど",
        "あしたのまど",
        "しあわせのまど",
        "ほしのしずくのまど",
        "かぜのうたのまど",
        "こころのまど",
        "まほうのまど",
        "はじまりのまど",
        "えがおのまど"
    ]);
    const COLORS = [
        { value: "#20b9cc", name: "あお" },
        { value: "#ed5d70", name: "あか" },
        { value: "#f4b827", name: "きいろ" },
        { value: "#55bd68", name: "みどり" },
        { value: "#9662d4", name: "むらさき" },
        { value: "#ed7fb0", name: "ももいろ" },
        { value: "#ef7938", name: "だいだい" },
        { value: "#4d79df", name: "るりいろ" }
    ];

    const PRACTICE_PUZZLES = [
        {
            id: "practice-1",
            tier: 1,
            target: [[0, 1], [1, 1], [2, 0], [2, 1], [3, 1]],
            solution: [
                { shape: "I2", rotation: 0, flipped: false, x: 0, y: 1 },
                { shape: "L3", rotation: 0, flipped: false, x: 2, y: 0 }
            ],
            distractors: [],
            guideTitle: "ひかりを はこぶのさ",
            guide: "ブロックを ながおししながら はこんで、 くらいまどへ ぴたっと はめておくれ。",
            line: "まずは そのまま はこんでみるのさ",
            initial: [
                { rotation: 0, flipped: false },
                { rotation: 0, flipped: false }
            ]
        },
        {
            id: "practice-2",
            tier: 1,
            target: [[0, 0], [1, 0], [2, 0], [1, 1], [2, 1], [3, 1], [2, 2]],
            solution: [
                { shape: "I3", rotation: 0, flipped: false, x: 0, y: 0 },
                { shape: "T4", rotation: 0, flipped: false, x: 1, y: 1 }
            ],
            distractors: [],
            guideTitle: "クリックで まわすのさ",
            guide: "ひかりブロックを クリックすると、 くるっと むきが かわるのさ。",
            line: "むきが ちがうときは ブロックを クリックするのさ",
            initial: [
                { rotation: 1, flipped: false },
                { rotation: 1, flipped: false }
            ]
        },
        {
            id: "practice-3",
            tier: 2,
            target: [[1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [3, 1], [3, 2], [4, 2]],
            solution: [
                { shape: "S4", rotation: 0, flipped: false, x: 0, y: 0 },
                { shape: "L4", rotation: 0, flipped: false, x: 3, y: 0 }
            ],
            distractors: [],
            guideTitle: "ダブルクリックで うらがえすのさ",
            guide: "ひかりブロックを ダブルクリックすると、 はんたいむきになるのさ。",
            line: "さいごは ダブルクリックで うらがえしてみせておくれ",
            initial: [
                { rotation: 0, flipped: true },
                { rotation: 0, flipped: false }
            ]
        }
    ];

    const state = {
        mode: "title",
        sessionPuzzles: [],
        stageIndex: 0,
        practiceIndex: 0,
        replayRecord: null,
        template: null,
        puzzle: null,
        puzzleTransform: { rotation: 0, flipped: false },
        activeWindowName: "ひかりのまど",
        pieces: [],
        placements: [],
        selectedId: null,
        targetSet: new Set(),
        hintCells: new Set(),
        dragging: null,
        pendingBlockClick: null,
        transformPulseId: null,
        cellSize: 42,
        startTime: 0,
        stageStartedAt: 0,
        timerId: null,
        inputLocked: false,
        demonstrating: false,
        runToken: 0,
        quoteDeck: [],
        windowNameDeck: [],
        audioContext: null
    };

    const elements = {};

    function cacheElements() {
        [
            "screen-title", "screen-game", "title-best", "practice-button", "start-button",
            "screen-collection", "collection-button", "title-collection-count",
            "collection-back-button", "collection-count", "collection-grid", "collection-empty",
            "title-button", "stage-label", "difficulty-label", "timer-label", "window-panel",
            "artist-line", "window-frame", "window-message", "board", "piece-tray", "rotate-button", "flip-button",
            "return-button", "hint-button", "reset-button", "sample-button", "drag-proxy",
            "overlay", "overlay-title", "overlay-message", "overlay-button"
        ].forEach((id) => {
            elements[toCamel(id)] = document.getElementById(id);
        });
    }

    function toCamel(value) {
        return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    function ensureAudio() {
        if (!state.audioContext) {
            const AudioCtor = window.AudioContext || window.webkitAudioContext;
            if (AudioCtor) state.audioContext = new AudioCtor();
        }
        if (state.audioContext?.state === "suspended") state.audioContext.resume();
    }

    function tone(frequency, duration = 0.09, type = "sine", volume = 0.035, delay = 0) {
        if (!state.audioContext) return;
        const context = state.audioContext;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + delay;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + duration);
    }

    const sound = {
        select() {
            tone(540, 0.07, "sine", 0.025);
        },
        turn() {
            tone(690, 0.08, "triangle", 0.03);
        },
        place() {
            tone(820, 0.08, "sine", 0.03);
            tone(1100, 0.09, "sine", 0.02, 0.05);
        },
        wrong() {
            tone(220, 0.14, "square", 0.02);
        },
        win() {
            [523, 659, 784, 1047].forEach((frequency, index) => {
                tone(frequency, 0.28, "sine", 0.035, index * 0.09);
            });
        }
    };

    function shuffle(items) {
        const result = [...items];
        for (let index = result.length - 1; index > 0; index -= 1) {
            const other = Math.floor(Math.random() * (index + 1));
            [result[index], result[other]] = [result[other], result[index]];
        }
        return result;
    }

    function formatTime(milliseconds) {
        const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    function readBest() {
        try {
            const value = Number(localStorage.getItem(BEST_KEY));
            return Number.isFinite(value) && value > 0 ? value : null;
        } catch {
            return null;
        }
    }

    function updateBestLabel() {
        const best = readBest();
        elements.titleBest.textContent = best ? formatTime(best) : "まだないよ";
        updateCollectionCount();
    }

    function saveBest(time) {
        const best = readBest();
        if (!best || time < best) {
            try {
                localStorage.setItem(BEST_KEY, String(time));
            } catch {
                // Local storage can be unavailable in restricted school browsers.
            }
            updateBestLabel();
            return true;
        }
        return false;
    }

    function readCollection() {
        try {
            const value = JSON.parse(localStorage.getItem(COLLECTION_KEY) || "[]");
            if (!Array.isArray(value)) return [];
            return value.filter((record) =>
                record &&
                typeof record.key === "string" &&
                typeof record.puzzleId === "string" &&
                Array.isArray(record.cells)
            );
        } catch {
            return [];
        }
    }

    function writeCollection(records) {
        try {
            localStorage.setItem(COLLECTION_KEY, JSON.stringify(records));
            return true;
        } catch {
            return false;
        }
    }

    function collectionRecordKey(puzzleId, rotation, flipped) {
        return `${puzzleId}:${rotation}:${flipped ? 1 : 0}`;
    }

    function updateCollectionCount() {
        if (!elements.titleCollectionCount) return;
        elements.titleCollectionCount.textContent = String(readCollection().length);
    }

    function currentColoredCells() {
        const cells = [];
        state.placements.forEach((placement) => {
            const piece = pieceById(placement.id);
            pieceCoords(piece).forEach(([x, y]) => {
                cells.push([
                    placement.x + x - PADDING,
                    placement.y + y - PADDING,
                    piece.color
                ]);
            });
        });
        return cells.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    }

    function saveCurrentWindow(elapsed) {
        if (state.mode !== "main" && state.mode !== "replay") return null;
        const key = collectionRecordKey(
            state.template.id,
            state.puzzleTransform.rotation,
            state.puzzleTransform.flipped
        );
        const records = readCollection();
        const index = records.findIndex((record) => record.key === key);
        const previous = index >= 0 ? records[index] : null;
        const record = {
            key,
            puzzleId: state.template.id,
            rotation: state.puzzleTransform.rotation,
            flipped: state.puzzleTransform.flipped,
            name: previous?.name || currentWindowName(),
            cells: currentColoredCells(),
            width: state.boardCols - PADDING * 2,
            height: state.boardRows - PADDING * 2,
            bestTime: previous?.bestTime ? Math.min(previous.bestTime, elapsed) : elapsed,
            completions: (previous?.completions || 0) + 1,
            updatedAt: Date.now()
        };

        if (index >= 0) records[index] = record;
        else records.push(record);
        writeCollection(records);
        updateCollectionCount();
        return record;
    }

    function showTitle() {
        state.runToken += 1;
        cancelPendingBlockClick();
        state.mode = "title";
        state.inputLocked = false;
        state.demonstrating = false;
        state.dragging = null;
        clearTimer();
        hideOverlay();
        elements.screenGame.classList.add("hidden");
        elements.screenCollection.classList.add("hidden");
        elements.screenTitle.classList.remove("hidden");
        updateBestLabel();
    }

    function showCollection() {
        state.runToken += 1;
        cancelPendingBlockClick();
        state.mode = "collection";
        state.inputLocked = false;
        state.demonstrating = false;
        state.dragging = null;
        clearTimer();
        hideOverlay();
        elements.screenTitle.classList.add("hidden");
        elements.screenGame.classList.add("hidden");
        elements.screenCollection.classList.remove("hidden");
        renderCollection();
    }

    function renderCollection() {
        const records = readCollection()
            .filter((record) => PUZZLE_BANK.some((puzzle) => puzzle.id === record.puzzleId))
            .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        elements.collectionGrid.innerHTML = "";
        elements.collectionCount.textContent = `${records.length}まいの さくひん`;
        elements.collectionEmpty.classList.toggle("hidden", records.length > 0);

        const fragment = document.createDocumentFragment();
        records.forEach((record) => {
            const card = document.createElement("button");
            card.className = "collection-card";
            card.type = "button";
            card.setAttribute("aria-label", `${record.name}に もういちど ちょうせん`);

            const windowFrame = document.createElement("div");
            windowFrame.className = "collection-window";
            const canvas = document.createElement("canvas");
            canvas.width = 260;
            canvas.height = 150;
            windowFrame.appendChild(canvas);

            const title = document.createElement("h2");
            title.textContent = record.name;
            const details = document.createElement("p");
            details.textContent = `さいこう ${formatTime(record.bestTime)}　かんせい ${record.completions}かい`;
            const retry = document.createElement("span");
            retry.className = "collection-retry";
            retry.textContent = "もういちど つくる";

            card.append(windowFrame, title, details, retry);
            card.addEventListener("click", () => startReplay(record));
            fragment.appendChild(card);
            drawCollectionWindow(canvas, record);
        });
        elements.collectionGrid.appendChild(fragment);
    }

    function drawCollectionWindow(canvas, record) {
        const context = canvas.getContext("2d");
        const width = Math.max(1, Number(record.width) || 1);
        const height = Math.max(1, Number(record.height) || 1);
        const padding = 12;
        const cell = Math.min(
            (canvas.width - padding * 2) / width,
            (canvas.height - padding * 2) / height
        );
        const originX = (canvas.width - cell * width) / 2;
        const originY = (canvas.height - cell * height) / 2;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#173f55";
        context.fillRect(0, 0, canvas.width, canvas.height);

        record.cells.forEach(([x, y, color]) => {
            const drawX = originX + x * cell;
            const drawY = originY + y * cell;
            const gradient = context.createLinearGradient(drawX, drawY, drawX + cell, drawY + cell);
            gradient.addColorStop(0, "#ffffff");
            gradient.addColorStop(0.18, color);
            gradient.addColorStop(1, color);
            context.fillStyle = gradient;
            context.fillRect(drawX + 1, drawY + 1, Math.max(1, cell - 2), Math.max(1, cell - 2));
            context.strokeStyle = "rgba(255, 239, 182, 0.9)";
            context.lineWidth = Math.max(1, cell * 0.07);
            context.strokeRect(drawX + 1, drawY + 1, Math.max(1, cell - 2), Math.max(1, cell - 2));
        });
    }

    function startReplay(record) {
        const template = PUZZLE_BANK.find((puzzle) => puzzle.id === record.puzzleId);
        if (!template) return;
        ensureAudio();
        state.mode = "replay";
        state.replayRecord = record;
        state.stageIndex = 0;
        state.quoteDeck = shuffle(ARTIST_QUOTES);
        state.windowNameDeck = [record.name];
        state.activeWindowName = record.name;
        state.startTime = Date.now();
        state.runToken += 1;
        clearTimer();
        state.timerId = window.setInterval(updateTimer, 250);
        openGameScreen();
        loadCurrentStage();
    }

    function chooseSessionPuzzles() {
        const selected = [];
        for (let tier = 1; tier <= 5; tier += 1) {
            const tierPuzzles = shuffle(PUZZLE_BANK.filter((puzzle) => puzzle.tier === tier));
            selected.push(...tierPuzzles.slice(0, 2));
        }
        return selected;
    }

    function startPractice() {
        ensureAudio();
        state.mode = "practice";
        state.practiceIndex = 0;
        state.stageIndex = 0;
        state.runToken += 1;
        clearTimer();
        openGameScreen();
        loadCurrentStage();
    }

    function startMainGame() {
        ensureAudio();
        state.mode = "main";
        state.stageIndex = 0;
        state.sessionPuzzles = chooseSessionPuzzles();
        state.quoteDeck = shuffle(ARTIST_QUOTES);
        state.windowNameDeck = shuffle(WINDOW_NAMES);
        state.runToken += 1;
        state.startTime = Date.now();
        clearTimer();
        state.timerId = window.setInterval(updateTimer, 250);
        openGameScreen();
        loadCurrentStage();
    }

    function openGameScreen() {
        elements.screenTitle.classList.add("hidden");
        elements.screenCollection.classList.add("hidden");
        elements.screenGame.classList.remove("hidden");
        hideOverlay();
    }

    function clearTimer() {
        if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
    }

    function updateTimer() {
        if (state.mode === "main" || state.mode === "replay") {
            elements.timerLabel.textContent = formatTime(Date.now() - state.startTime);
        }
    }

    function applyRawTransform([initialX, initialY], rotation, flipped) {
        let x = flipped ? -initialX : initialX;
        let y = initialY;
        for (let index = 0; index < rotation; index += 1) {
            [x, y] = [y, -x];
        }
        return [x, y];
    }

    function transformTemplate(template, rotation, flipped) {
        const transformedTargetRaw = template.target.map((cell) =>
            applyRawTransform(cell, rotation, flipped)
        );
        const minX = Math.min(...transformedTargetRaw.map(([x]) => x));
        const minY = Math.min(...transformedTargetRaw.map(([, y]) => y));
        const target = transformedTargetRaw
            .map(([x, y]) => [x - minX, y - minY])
            .sort((a, b) => a[1] - b[1] || a[0] - b[0]);

        const solution = template.solution.map((piece) => {
            const absolute = transform(SHAPES[piece.shape], piece.rotation, piece.flipped)
                .map(([x, y]) => [x + piece.x, y + piece.y])
                .map((cell) => applyRawTransform(cell, rotation, flipped))
                .map(([x, y]) => [x - minX, y - minY]);
            const pieceMinX = Math.min(...absolute.map(([x]) => x));
            const pieceMinY = Math.min(...absolute.map(([, y]) => y));
            const normalizedKey = cellKey(absolute);
            const matching = orientations(SHAPES[piece.shape])
                .find((orientation) => cellKey(orientation.cells) === normalizedKey);
            if (!matching) throw new Error(`Could not transform ${piece.shape}`);
            return {
                shape: piece.shape,
                rotation: matching.rotation,
                flipped: matching.flipped,
                x: pieceMinX,
                y: pieceMinY
            };
        });

        return {
            ...template,
            target,
            solution
        };
    }

    function currentTemplate() {
        if (state.mode === "practice") return PRACTICE_PUZZLES[state.practiceIndex];
        if (state.mode === "replay") {
            return PUZZLE_BANK.find((puzzle) => puzzle.id === state.replayRecord?.puzzleId);
        }
        return state.sessionPuzzles[state.stageIndex];
    }

    function loadCurrentStage({ reuseTransform = false } = {}) {
        state.runToken += 1;
        cancelPendingBlockClick();
        state.inputLocked = false;
        state.demonstrating = false;
        state.placements = [];
        state.selectedId = null;
        state.hintCells = new Set();
        state.dragging = null;

        const template = currentTemplate();
        state.template = template;
        const globalRotation = reuseTransform
            ? state.puzzleTransform.rotation
            : state.mode === "practice"
            ? 0
            : state.mode === "replay"
                ? state.replayRecord.rotation
                : Math.floor(Math.random() * 4);
        const globalFlip = reuseTransform
            ? state.puzzleTransform.flipped
            : state.mode === "practice"
            ? false
            : state.mode === "replay"
                ? state.replayRecord.flipped
                : Math.random() > 0.5;
        state.puzzleTransform = { rotation: globalRotation, flipped: globalFlip };
        state.puzzle = transformTemplate(template, globalRotation, globalFlip);
        if (state.mode === "replay") {
            state.activeWindowName = state.replayRecord.name;
        } else if (state.mode === "main") {
            const existing = readCollection().find((record) =>
                record.key === collectionRecordKey(template.id, globalRotation, globalFlip)
            );
            state.activeWindowName = existing?.name || state.windowNameDeck[state.stageIndex];
        }
        buildPieceInstances();
        buildTargetData();
        updateHud();
        elements.windowMessage.textContent = "ブロックを えらんで まどへ はこぼう";
        updateCellSize();
        render();
        // The mobile workbench gets its final height only after all tray pieces exist.
        // Refit once against that settled layout so the board never flashes outside its panel.
        updateCellSize();
        render();
        state.stageStartedAt = Date.now();

        if (state.mode === "practice") {
            showPracticeGuide();
        }
    }

    function buildPieceInstances() {
        const palette = shuffle(COLORS);
        const solutionPieces = state.puzzle.solution.map((piece, index) => {
            let initialRotation;
            let initialFlipped;

            if (state.mode === "practice" && state.template.initial?.[index]) {
                initialRotation = state.template.initial[index].rotation;
                initialFlipped = state.template.initial[index].flipped;
            } else if (state.mode === "main" && state.stageIndex === 0) {
                initialRotation = piece.rotation;
                initialFlipped = piece.flipped;
            } else {
                initialRotation = Math.floor(Math.random() * 4);
                initialFlipped = Math.random() > 0.5;
            }

            return {
                id: `solution-${index}`,
                shape: piece.shape,
                color: palette[index].value,
                colorName: palette[index].name,
                rotation: initialRotation,
                flipped: initialFlipped,
                solution: {
                    x: piece.x + PADDING,
                    y: piece.y + PADDING,
                    rotation: piece.rotation,
                    flipped: piece.flipped
                }
            };
        });

        const distractorPieces = state.puzzle.distractors.map((shape, index) => {
            const paletteIndex = solutionPieces.length + index;
            return {
                id: `distractor-${index}`,
                shape,
                color: palette[paletteIndex].value,
                colorName: palette[paletteIndex].name,
                rotation: Math.floor(Math.random() * 4),
                flipped: Math.random() > 0.5,
                solution: null
            };
        });

        const allPieces = [...solutionPieces, ...distractorPieces];
        state.pieces = state.mode === "practice" ? allPieces : shuffle(allPieces);
    }

    function buildTargetData() {
        const target = state.puzzle.target.map(([x, y]) => [x + PADDING, y + PADDING]);
        const targetBounds = bounds(state.puzzle.target);
        state.boardCols = targetBounds.width + PADDING * 2;
        state.boardRows = targetBounds.height + PADDING * 2;
        state.targetSet = new Set(target.map(([x, y]) => `${x},${y}`));
    }

    function updateHud() {
        if (state.mode === "practice") {
            elements.stageLabel.textContent = `れんしゅう ${state.practiceIndex + 1}／${PRACTICE_PUZZLES.length}`;
            elements.difficultyLabel.textContent = state.template.guideTitle;
            elements.timerLabel.textContent = "れんしゅう";
            elements.artistLine.textContent = state.template.line;
        } else if (state.mode === "replay") {
            elements.stageLabel.textContent = currentWindowName();
            elements.difficultyLabel.textContent = "コレクションから さいちょうせん";
            elements.artistLine.textContent = state.quoteDeck[0];
            updateTimer();
        } else {
            const tier = TIER_SEQUENCE[state.stageIndex];
            elements.stageLabel.textContent = currentWindowName();
            elements.difficultyLabel.textContent = `${state.stageIndex + 1}／10　${TIER_LABELS[tier]}`;
            elements.artistLine.textContent = state.quoteDeck[state.stageIndex];
            updateTimer();
        }
    }

    function currentWindowName() {
        return state.activeWindowName || state.windowNameDeck[state.stageIndex] || "ひかりのまど";
    }

    function showPracticeGuide() {
        state.inputLocked = true;
        showOverlay(
            state.template.guideTitle,
            state.template.guide,
            "やってみる",
            () => {
                hideOverlay();
                state.inputLocked = false;
            }
        );
    }

    function updateCellSize() {
        if (!state.boardCols || !state.boardRows || !elements.windowPanel) return;
        const panelStyle = getComputedStyle(elements.windowPanel);
        const frameStyle = getComputedStyle(elements.windowFrame);
        const panelWidth = elements.windowPanel.clientWidth -
            cssPixels(panelStyle, "paddingLeft") - cssPixels(panelStyle, "paddingRight");
        const panelHeight = elements.windowPanel.clientHeight -
            cssPixels(panelStyle, "paddingTop") - cssPixels(panelStyle, "paddingBottom");
        const frameChromeWidth = cssPixels(frameStyle, "paddingLeft") +
            cssPixels(frameStyle, "paddingRight") + cssPixels(frameStyle, "borderLeftWidth") +
            cssPixels(frameStyle, "borderRightWidth");
        const frameChromeHeight = cssPixels(frameStyle, "paddingTop") +
            cssPixels(frameStyle, "paddingBottom") + cssPixels(frameStyle, "borderTopWidth") +
            cssPixels(frameStyle, "borderBottomWidth");
        const maxWidth = Math.max(1, panelWidth - frameChromeWidth);
        const maxHeight = Math.max(
            1,
            panelHeight - outerHeight(elements.artistLine) - outerHeight(elements.windowMessage) - frameChromeHeight
        );
        const size = Math.floor(Math.min(
            58,
            maxWidth / state.boardCols,
            maxHeight / state.boardRows
        ));
        state.cellSize = Math.max(8, size);
        document.documentElement.style.setProperty("--cell-size", `${state.cellSize}px`);
        document.documentElement.style.setProperty("--tray-cell", `${Math.max(10, Math.min(20, state.cellSize * 0.42))}px`);
    }

    function cssPixels(style, property) {
        return Number.parseFloat(style[property]) || 0;
    }

    function outerHeight(element) {
        const style = getComputedStyle(element);
        const borderHeight = cssPixels(style, "borderTopWidth") + cssPixels(style, "borderBottomWidth");
        const renderedHeight = Math.max(
            element.getBoundingClientRect().height,
            element.scrollHeight + borderHeight
        );
        return renderedHeight + cssPixels(style, "marginTop") + cssPixels(style, "marginBottom");
    }

    function render() {
        renderBoard();
        renderTray();
        updateToolButtons();
    }

    function renderBoard() {
        const board = elements.board;
        board.style.width = `${state.boardCols * state.cellSize}px`;
        board.style.height = `${state.boardRows * state.cellSize}px`;
        board.innerHTML = "";

        const cellFragment = document.createDocumentFragment();
        for (let y = 0; y < state.boardRows; y += 1) {
            for (let x = 0; x < state.boardCols; x += 1) {
                const cell = document.createElement("div");
                const key = `${x},${y}`;
                cell.className = "board-cell";
                if (state.targetSet.has(key)) cell.classList.add("target");
                if (state.hintCells.has(key)) cell.classList.add("hint");
                cell.style.left = `${x * state.cellSize}px`;
                cell.style.top = `${y * state.cellSize}px`;
                cellFragment.appendChild(cell);
            }
        }
        board.appendChild(cellFragment);

        state.placements.forEach((placement) => {
            const piece = pieceById(placement.id);
            const pieceElement = makePieceElement(piece, state.cellSize, "placed");
            pieceElement.className = "placed-piece";
            if (state.selectedId === piece.id) pieceElement.classList.add("selected");
            if (state.transformPulseId === piece.id) pieceElement.classList.add("turn-feedback");
            pieceElement.style.left = `${placement.x * state.cellSize}px`;
            pieceElement.style.top = `${placement.y * state.cellSize}px`;
            pieceElement.dataset.pieceId = piece.id;
            pieceElement.setAttribute("role", "button");
            pieceElement.setAttribute(
                "aria-label",
                `${piece.colorName}の ひかりブロック。 クリックで回転、 ダブルクリックで裏返し、 長押しでドラッグ`
            );
            pieceElement.addEventListener("pointerdown", (event) => beginDrag(event, piece.id, "board"));
            board.appendChild(pieceElement);
        });
    }

    function renderTray() {
        elements.pieceTray.innerHTML = "";
        state.pieces.forEach((piece) => {
            const placed = placementById(piece.id);
            const item = document.createElement("div");
            item.className = "tray-piece";
            if (state.selectedId === piece.id) item.classList.add("selected");
            if (placed) item.classList.add("used");
            if (piece.hinted) item.classList.add("hinted");
            if (state.transformPulseId === piece.id) item.classList.add("turn-feedback");
            item.dataset.pieceId = piece.id;
            item.setAttribute("role", "button");
            item.setAttribute("tabindex", "0");
            item.setAttribute(
                "aria-label",
                `${piece.colorName}の ひかりブロック。 クリックで回転、 ダブルクリックで裏返し、 長押しでドラッグ`
            );
            item.addEventListener("pointerdown", (event) => beginDrag(event, piece.id, "tray"));
            item.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectPiece(piece.id);
                }
            });
            elements.pieceTray.appendChild(item);
            item.appendChild(makePieceElement(piece, getTrayCellSize(piece, item), "preview"));
        });
    }

    function getTrayCellSize(piece, item) {
        const preferred = Math.max(10, Math.min(20, state.cellSize * 0.42));
        if (!piece || !item) return preferred;
        const style = getComputedStyle(item);
        const availableWidth = item.clientWidth - cssPixels(style, "paddingLeft") -
            cssPixels(style, "paddingRight") - 2;
        const availableHeight = item.clientHeight - cssPixels(style, "paddingTop") -
            cssPixels(style, "paddingBottom") - 2;
        if (availableWidth <= 0 || availableHeight <= 0) return preferred;
        const pieceBounds = bounds(pieceCoords(piece));
        return Math.max(7, Math.min(
            preferred,
            availableWidth / pieceBounds.width,
            availableHeight / pieceBounds.height
        ));
    }

    function makePieceElement(piece, cellSize, kind) {
        const coords = pieceCoords(piece);
        const pieceBounds = bounds(coords);
        const container = document.createElement("div");
        container.className = kind === "preview" ? "piece-preview" : "";
        container.style.width = `${pieceBounds.width * cellSize}px`;
        container.style.height = `${pieceBounds.height * cellSize}px`;
        container.style.setProperty("--piece-color", piece.color);
        if (kind === "preview") {
            container.style.setProperty("--preview-cell-size", `${cellSize}px`);
        }

        coords.forEach(([x, y]) => {
            const cell = document.createElement("div");
            cell.className = kind === "preview" ? "preview-cell" : "piece-cell";
            cell.style.left = `${x * cellSize}px`;
            cell.style.top = `${y * cellSize}px`;
            cell.style.setProperty("--piece-color", piece.color);
            container.appendChild(cell);
        });
        return container;
    }

    function pieceCoords(piece) {
        return transform(SHAPES[piece.shape], piece.rotation, piece.flipped);
    }

    function pieceById(id) {
        return state.pieces.find((piece) => piece.id === id);
    }

    function placementById(id) {
        return state.placements.find((placement) => placement.id === id);
    }

    function selectPiece(id) {
        if (state.inputLocked) return;
        state.selectedId = id;
        const piece = pieceById(id);
        elements.windowMessage.textContent = `${piece.colorName}の ブロックを えらんだよ`;
        sound.select();
        render();
    }

    function updateToolButtons() {
        const selected = state.selectedId ? pieceById(state.selectedId) : null;
        elements.rotateButton.disabled = !selected || state.inputLocked;
        elements.flipButton.disabled = !selected || state.inputLocked;
        elements.returnButton.disabled = !selected || !placementById(state.selectedId) || state.inputLocked;
        elements.hintButton.disabled = state.inputLocked;
        elements.resetButton.disabled = state.inputLocked;
        elements.sampleButton.disabled = state.inputLocked;
    }

    function transformPiece(pieceId, kind, checkAfterTransform = true) {
        if (state.inputLocked || !pieceId) {
            elements.windowMessage.textContent = "さきに ブロックを えらぶのさ";
            return;
        }

        const piece = pieceById(pieceId);
        if (!piece) return;
        state.selectedId = pieceId;
        const previous = { rotation: piece.rotation, flipped: piece.flipped };
        if (kind === "rotate") piece.rotation = (piece.rotation + 1) % 4;
        if (kind === "flip") piece.flipped = !piece.flipped;

        const placement = placementById(piece.id);
        if (placement && !canPlace(piece, placement.x, placement.y, piece.id)) {
            piece.rotation = previous.rotation;
            piece.flipped = previous.flipped;
            elements.windowMessage.textContent = kind === "rotate"
                ? "そこでは まわせないようだね"
                : "そこでは うらがえせないようだね";
            sound.wrong();
        } else {
            elements.windowMessage.textContent = kind === "rotate"
                ? "くるっと むきが かわったよ"
                : "うらがえしたよ";
            sound.turn();
        }
        state.transformPulseId = pieceId;
        render();
        window.setTimeout(() => {
            if (state.transformPulseId === pieceId) state.transformPulseId = null;
        }, 150);
        if (checkAfterTransform) checkComplete();
    }

    function transformSelected(kind) {
        commitPendingBlockClick();
        if (state.inputLocked) return;
        transformPiece(state.selectedId, kind);
    }

    function cancelPendingBlockClick() {
        if (!state.pendingBlockClick) return;
        window.clearTimeout(state.pendingBlockClick.timerId);
        state.pendingBlockClick = null;
    }

    function commitPendingBlockClick() {
        const pending = state.pendingBlockClick;
        if (!pending) return;
        cancelPendingBlockClick();
        if (pending.runToken === state.runToken) {
            checkComplete();
        }
    }

    function handleBlockClick(pieceId) {
        const pending = state.pendingBlockClick;
        if (
            pending &&
            pending.pieceId === pieceId &&
            Date.now() - pending.clickedAt <= BLOCK_DOUBLE_CLICK_DELAY
        ) {
            const piece = pieceById(pieceId);
            cancelPendingBlockClick();
            if (!piece) return;
            piece.rotation = pending.previous.rotation;
            piece.flipped = pending.previous.flipped;
            transformPiece(pieceId, "flip");
            return;
        }

        if (pending) commitPendingBlockClick();
        if (state.inputLocked) return;

        const piece = pieceById(pieceId);
        if (!piece) return;
        const click = {
            pieceId,
            clickedAt: Date.now(),
            runToken: state.runToken,
            previous: { rotation: piece.rotation, flipped: piece.flipped },
            timerId: null
        };
        transformPiece(pieceId, "rotate", false);
        click.timerId = window.setTimeout(() => {
            if (state.pendingBlockClick !== click) return;
            state.pendingBlockClick = null;
            if (click.runToken === state.runToken) {
                checkComplete();
            }
        }, BLOCK_DOUBLE_CLICK_DELAY);
        state.pendingBlockClick = click;
    }

    function returnSelected() {
        if (state.inputLocked || !state.selectedId) return;
        const index = state.placements.findIndex((placement) => placement.id === state.selectedId);
        if (index < 0) return;
        state.placements.splice(index, 1);
        elements.windowMessage.textContent = "ブロックを だいにもどしたよ";
        sound.select();
        render();
    }

    function canPlace(piece, x, y, ignoreId = null) {
        const occupied = new Set();
        state.placements.forEach((placement) => {
            if (placement.id === ignoreId) return;
            const other = pieceById(placement.id);
            pieceCoords(other).forEach(([cx, cy]) => {
                occupied.add(`${placement.x + cx},${placement.y + cy}`);
            });
        });

        return pieceCoords(piece).every(([cx, cy]) => {
            const key = `${x + cx},${y + cy}`;
            return state.targetSet.has(key) && !occupied.has(key);
        });
    }

    function beginDrag(event, pieceId, source) {
        if (state.inputLocked || (event.pointerType === "mouse" && event.button !== 0)) return;
        const isScrollableTrayTouch = source === "tray" && event.pointerType === "touch";
        if (!isScrollableTrayTouch) event.preventDefault();
        ensureAudio();
        if (state.pendingBlockClick?.pieceId !== pieceId) {
            commitPendingBlockClick();
            if (state.inputLocked) return;
        }
        state.selectedId = pieceId;
        const originalPlacement = placementById(pieceId)
            ? { ...placementById(pieceId) }
            : null;

        const dragging = {
            pieceId,
            source,
            originalPlacement,
            pointerId: event.pointerId,
            pointerType: event.pointerType,
            startX: event.clientX,
            startY: event.clientY,
            lastX: event.clientX,
            lastY: event.clientY,
            moved: false,
            active: false,
            holdTimerId: null
        };
        dragging.holdTimerId = window.setTimeout(() => {
            if (state.dragging === dragging) {
                activateDrag(dragging.lastX, dragging.lastY);
            }
        }, BLOCK_LONG_PRESS_DELAY);
        state.dragging = dragging;
        sound.select();
    }

    function activateDrag(clientX, clientY) {
        const dragging = state.dragging;
        if (!dragging || dragging.active) return;
        dragging.active = true;
        window.clearTimeout(dragging.holdTimerId);
        dragging.holdTimerId = null;

        if (state.pendingBlockClick?.pieceId === dragging.pieceId) {
            commitPendingBlockClick();
            if (state.inputLocked) {
                state.dragging = null;
                return;
            }
        }
        if (dragging.source === "board") {
            state.placements = state.placements.filter(
                (placement) => placement.id !== dragging.pieceId
            );
        }

        const piece = pieceById(dragging.pieceId);
        elements.dragProxy.innerHTML = "";
        elements.dragProxy.appendChild(makePieceElement(piece, state.cellSize, "drag"));
        elements.dragProxy.classList.remove("hidden");
        updateDragProxy(clientX, clientY);
        render();
    }

    function updateDragProxy(clientX, clientY) {
        if (!state.dragging?.active) return;
        elements.dragProxy.style.left = `${clientX - state.cellSize / 2}px`;
        elements.dragProxy.style.top = `${clientY - state.cellSize / 2}px`;
    }

    function handlePointerMove(event) {
        if (!state.dragging || event.pointerId !== state.dragging.pointerId) return;
        const deltaX = event.clientX - state.dragging.startX;
        const deltaY = event.clientY - state.dragging.startY;
        const distance = Math.hypot(
            deltaX,
            deltaY
        );
        state.dragging.lastX = event.clientX;
        state.dragging.lastY = event.clientY;
        if (state.dragging.source === "tray" && state.dragging.pointerType === "touch" && !state.dragging.active) {
            if (distance < BLOCK_DRAG_THRESHOLD) return;
            const touchAction = getComputedStyle(elements.pieceTray).touchAction;
            const horizontal = Math.abs(deltaX) >= Math.abs(deltaY);
            const isTrayScroll = (horizontal && touchAction.includes("pan-x")) ||
                (!horizontal && touchAction.includes("pan-y"));
            if (isTrayScroll) {
                window.clearTimeout(state.dragging.holdTimerId);
                state.dragging = null;
                return;
            }
        }
        event.preventDefault();
        if (!state.dragging.moved && distance >= BLOCK_DRAG_THRESHOLD) {
            state.dragging.moved = true;
            activateDrag(event.clientX, event.clientY);
        }
        updateDragProxy(event.clientX, event.clientY);
    }

    function handlePointerUp(event) {
        if (!state.dragging || event.pointerId !== state.dragging.pointerId) return;
        event.preventDefault();
        const dragging = state.dragging;
        const piece = pieceById(dragging.pieceId);
        window.clearTimeout(dragging.holdTimerId);
        if (event.type === "pointercancel") {
            if (dragging.active && dragging.originalPlacement) {
                state.placements.push(dragging.originalPlacement);
            }
            state.dragging = null;
            elements.dragProxy.innerHTML = "";
            elements.dragProxy.classList.add("hidden");
            render();
            return;
        }
        const distance = Math.hypot(
            event.clientX - dragging.startX,
            event.clientY - dragging.startY
        );

        if (!dragging.active && !dragging.moved && distance < BLOCK_DRAG_THRESHOLD) {
            state.dragging = null;
            state.selectedId = piece.id;
            render();
            handleBlockClick(piece.id);
            return;
        }

        if (!dragging.active) activateDrag(event.clientX, event.clientY);

        if (!dragging.moved) {
            if (dragging.originalPlacement) state.placements.push(dragging.originalPlacement);
            elements.windowMessage.textContent = dragging.originalPlacement
                ? "ブロックは そのままにしたよ"
                : "ブロックを だいにもどしたよ";
            state.dragging = null;
            elements.dragProxy.innerHTML = "";
            elements.dragProxy.classList.add("hidden");
            render();
            return;
        }

        const rect = elements.board.getBoundingClientRect();
        const x = Math.round((event.clientX - rect.left - state.cellSize / 2) / state.cellSize);
        const y = Math.round((event.clientY - rect.top - state.cellSize / 2) / state.cellSize);
        const insideBoard = event.clientX >= rect.left && event.clientX <= rect.right &&
            event.clientY >= rect.top && event.clientY <= rect.bottom;

        if (insideBoard && canPlace(piece, x, y)) {
            state.placements.push({ id: piece.id, x, y });
            elements.windowMessage.textContent = "ぴたっと はまった！";
            sound.place();
        } else {
            if (dragging.originalPlacement) state.placements.push(dragging.originalPlacement);
            elements.windowMessage.textContent = insideBoard
                ? "そこには はめられないようだね"
                : "ブロックを だいにもどしたよ";
            if (insideBoard) sound.wrong();
        }

        state.dragging = null;
        elements.dragProxy.innerHTML = "";
        elements.dragProxy.classList.add("hidden");
        render();
        checkComplete();
    }

    function coveredCells() {
        const covered = new Set();
        state.placements.forEach((placement) => {
            const piece = pieceById(placement.id);
            pieceCoords(piece).forEach(([x, y]) => {
                covered.add(`${placement.x + x},${placement.y + y}`);
            });
        });
        return covered;
    }

    function checkComplete() {
        if (state.inputLocked || state.demonstrating) return;
        const covered = coveredCells();
        if (covered.size !== state.targetSet.size) return;
        if (![...state.targetSet].every((cell) => covered.has(cell))) return;

        state.inputLocked = true;
        sound.win();
        const token = state.runToken;
        window.setTimeout(() => {
            if (token === state.runToken) handleStageComplete();
        }, 450);
    }

    function handleStageComplete() {
        if (state.mode === "practice") {
            if (state.practiceIndex < PRACTICE_PUZZLES.length - 1) {
                showOverlay(
                    "うつくしい！",
                    "ぴたっと はまったね。 つぎの まどへ すすむのさ。",
                    "つぎの れんしゅう",
                    () => {
                        hideOverlay();
                        state.practiceIndex += 1;
                        loadCurrentStage();
                    }
                );
            } else {
                showOverlay(
                    "れんしゅう かんせい！",
                    "やったね。 きみには ひかりの さいのうが ある。 ほんばんも たのしんでおくれ！",
                    "タイトルへ",
                    showTitle
                );
            }
            return;
        }

        const windowTime = Date.now() - state.stageStartedAt;
        const collectionRecord = saveCurrentWindow(windowTime);

        if (state.mode === "replay") {
            clearTimer();
            showOverlay(
                `${currentWindowName()} ふたたび かんせい！`,
                `${formatTime(windowTime)}で かんせい。 これまでの さいこうは ${formatTime(collectionRecord.bestTime)}だよ。`,
                "コレクションへ",
                showCollection
            );
            return;
        }

        if (state.stageIndex < 9) {
            const windowName = currentWindowName();
            showOverlay(
                `${windowName} かんせい！`,
                `${windowName}が ひかりかがやいたね。 つぎの さくひんも たのしみだ。`,
                "つぎの まど",
                () => {
                    hideOverlay();
                    state.stageIndex += 1;
                    loadCurrentStage();
                }
            );
            return;
        }

        clearTimer();
        const finalTime = Date.now() - state.startTime;
        const isNew = saveBest(finalTime);
        const finalWindowName = currentWindowName();
        showOverlay(
            isNew ? "さいこうの げいじゅつ！" : "10まど かんせい！",
            `${finalWindowName}も かんせい！ ${isNew ? "しんきろく！ " : ""}${formatTime(finalTime)}で すべての まどが ひかりかがやいたよ。`,
            "タイトルへ",
            showTitle,
            isNew
        );
    }

    function resetStage() {
        if (state.inputLocked) return;
        state.placements = [];
        state.selectedId = null;
        state.hintCells = new Set();
        state.pieces.forEach((piece) => {
            piece.hinted = false;
        });
        elements.windowMessage.textContent = "まどを まっさらに もどしたよ";
        sound.select();
        render();
    }

    function placementMatchesSolution(piece) {
        if (!piece.solution) return false;
        const placement = placementById(piece.id);
        if (!placement) return false;
        const actual = pieceCoords(piece)
            .map(([x, y]) => [x + placement.x, y + placement.y]);
        const expected = transform(SHAPES[piece.shape], piece.solution.rotation, piece.solution.flipped)
            .map(([x, y]) => [x + piece.solution.x, y + piece.solution.y]);
        return absoluteCellKey(actual) === absoluteCellKey(expected);
    }

    function absoluteCellKey(cells) {
        return cells
            .map(([x, y]) => `${x},${y}`)
            .sort()
            .join(";");
    }

    function showHint() {
        if (state.inputLocked) return;
        state.pieces.forEach((piece) => {
            piece.hinted = false;
        });
        const piece = state.pieces.find((candidate) =>
            candidate.solution && !placementMatchesSolution(candidate)
        );
        if (!piece) {
            elements.windowMessage.textContent = "もうすこしで かんせいだよ";
            return;
        }

        piece.hinted = true;
        state.selectedId = piece.id;
        const coords = transform(SHAPES[piece.shape], piece.solution.rotation, piece.solution.flipped);
        state.hintCells = new Set(coords.map(([x, y]) =>
            `${x + piece.solution.x},${y + piece.solution.y}`
        ));
        elements.windowMessage.textContent = `${piece.colorName}の ひかりは ここが にあいそうだね`;
        sound.turn();
        render();

        const token = state.runToken;
        window.setTimeout(() => {
            if (token !== state.runToken) return;
            piece.hinted = false;
            state.hintCells = new Set();
            render();
        }, 2200);
    }

    async function showSample() {
        if (state.inputLocked) return;
        state.inputLocked = true;
        state.demonstrating = true;
        state.placements = [];
        state.selectedId = null;
        render();
        elements.windowMessage.textContent = "クジャーロの おてほんを みてみよう";

        const token = ++state.runToken;
        const solutionPieces = state.pieces.filter((piece) => piece.solution);
        for (const piece of solutionPieces) {
            await wait(420);
            if (token !== state.runToken) return;
            piece.rotation = piece.solution.rotation;
            piece.flipped = piece.solution.flipped;
            state.placements.push({
                id: piece.id,
                x: piece.solution.x,
                y: piece.solution.y
            });
            sound.place();
            render();
        }

        await wait(500);
        if (token !== state.runToken) return;
        showOverlay(
            "これが おてほんさ",
            "これは ひとつの かんせいれい。 ほかの はめかたでも ぴったりなら せいかいだよ。",
            "もういちど",
            () => {
                hideOverlay();
                loadCurrentStage({ reuseTransform: true });
            }
        );
    }

    function wait(milliseconds) {
        return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
    }

    function showOverlay(title, message, buttonText, action, isNewRecord = false) {
        elements.overlayTitle.textContent = title;
        elements.overlayTitle.classList.toggle("new-record", isNewRecord);
        elements.overlayMessage.textContent = message;
        elements.overlayButton.textContent = buttonText;
        elements.overlayButton.onclick = action;
        elements.overlay.classList.remove("hidden");
    }

    function hideOverlay() {
        elements.overlay.classList.add("hidden");
        elements.overlayButton.onclick = null;
        elements.overlayTitle.classList.remove("new-record");
    }

    let resizeFrameId = null;
    let layoutObserver = null;

    function scheduleResize() {
        if (resizeFrameId !== null) window.cancelAnimationFrame(resizeFrameId);
        resizeFrameId = window.requestAnimationFrame(() => {
            resizeFrameId = null;
            handleResize();
        });
    }

    function handleResize() {
        if (elements.screenGame.classList.contains("hidden")) return;
        updateCellSize();
        render();
    }

    function validateRuntimeData() {
        if (!Core || !Object.keys(SHAPES).length) {
            throw new Error("Puzzle shapes did not load.");
        }
        if (PUZZLE_BANK.length !== 50) {
            throw new Error(`Expected 50 verified puzzles, received ${PUZZLE_BANK.length}.`);
        }
        for (let tier = 1; tier <= 5; tier += 1) {
            if (PUZZLE_BANK.filter((puzzle) => puzzle.tier === tier).length !== 10) {
                throw new Error(`Puzzle tier ${tier} is incomplete.`);
            }
        }
    }

    function init() {
        cacheElements();
        validateRuntimeData();
        updateBestLabel();

        elements.practiceButton.addEventListener("click", startPractice);
        elements.startButton.addEventListener("click", startMainGame);
        elements.collectionButton.addEventListener("click", showCollection);
        elements.collectionBackButton.addEventListener("click", showTitle);
        elements.titleButton.addEventListener("click", showTitle);
        elements.rotateButton.addEventListener("click", () => transformSelected("rotate"));
        elements.flipButton.addEventListener("click", () => transformSelected("flip"));
        elements.returnButton.addEventListener("click", returnSelected);
        elements.hintButton.addEventListener("click", showHint);
        elements.resetButton.addEventListener("click", resetStage);
        elements.sampleButton.addEventListener("click", showSample);
        window.addEventListener("pointermove", handlePointerMove, { passive: false });
        window.addEventListener("pointerup", handlePointerUp, { passive: false });
        window.addEventListener("pointercancel", handlePointerUp, { passive: false });
        window.addEventListener("resize", scheduleResize);
        window.visualViewport?.addEventListener("resize", scheduleResize);
        if (typeof ResizeObserver === "function") {
            layoutObserver = new ResizeObserver(scheduleResize);
            layoutObserver.observe(elements.windowPanel);
            layoutObserver.observe(elements.artistLine);
            layoutObserver.observe(elements.windowMessage);
        }
        document.fonts?.ready.then(scheduleResize);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
}());
