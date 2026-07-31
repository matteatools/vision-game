(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = api;
    } else {
        root.LightWindowShapes = api;
    }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const SHAPES = Object.freeze({
        M1: Object.freeze([[0, 0]]),
        I2: Object.freeze([[0, 0], [1, 0]]),
        I3: Object.freeze([[0, 0], [1, 0], [2, 0]]),
        L3: Object.freeze([[0, 0], [0, 1], [1, 1]]),
        I4: Object.freeze([[0, 0], [1, 0], [2, 0], [3, 0]]),
        O4: Object.freeze([[0, 0], [1, 0], [0, 1], [1, 1]]),
        L4: Object.freeze([[0, 0], [0, 1], [0, 2], [1, 2]]),
        T4: Object.freeze([[0, 0], [1, 0], [2, 0], [1, 1]]),
        S4: Object.freeze([[1, 0], [2, 0], [0, 1], [1, 1]]),
        I5: Object.freeze([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]),
        L5: Object.freeze([[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]]),
        P5: Object.freeze([[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]]),
        T5: Object.freeze([[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]]),
        U5: Object.freeze([[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]]),
        V5: Object.freeze([[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]]),
        W5: Object.freeze([[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]]),
        X5: Object.freeze([[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]]),
        Y5: Object.freeze([[0, 0], [0, 1], [0, 2], [0, 3], [1, 1]]),
        Z5: Object.freeze([[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]])
    });

    function normalize(cells) {
        const minX = Math.min(...cells.map(([x]) => x));
        const minY = Math.min(...cells.map(([, y]) => y));
        return cells
            .map(([x, y]) => [x - minX, y - minY])
            .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    }

    function transform(shape, rotation = 0, flipped = false) {
        let cells = shape.map(([x, y]) => [x, y]);
        if (flipped) {
            cells = cells.map(([x, y]) => [-x, y]);
        }
        for (let i = 0; i < ((rotation % 4) + 4) % 4; i += 1) {
            cells = cells.map(([x, y]) => [y, -x]);
        }
        return normalize(cells);
    }

    function cellKey(cells) {
        return normalize(cells).map(([x, y]) => `${x},${y}`).join(";");
    }

    function orientations(shape) {
        const seen = new Set();
        const result = [];
        [false, true].forEach((flipped) => {
            for (let rotation = 0; rotation < 4; rotation += 1) {
                const cells = transform(shape, rotation, flipped);
                const key = cellKey(cells);
                if (!seen.has(key)) {
                    seen.add(key);
                    result.push({ rotation, flipped, cells });
                }
            }
        });
        return result;
    }

    function bounds(cells) {
        const normalized = normalize(cells);
        return {
            width: Math.max(...normalized.map(([x]) => x)) + 1,
            height: Math.max(...normalized.map(([, y]) => y)) + 1
        };
    }

    return Object.freeze({
        SHAPES,
        normalize,
        transform,
        orientations,
        bounds,
        cellKey
    });
}));
