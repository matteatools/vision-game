let sockSvgId = 0;
        function sockSVG(hex, pat, shape = 0, dark = false) {
            if (dark) { const rgb = hex.slice(1).match(/../g).map(v => parseInt(v,16)); hex = "#" + rgb.map((v,i) => Math.round(v * .28 + [14,16,22][i]).toString(16).padStart(2,"0")).join(""); }
            const cloth = dark ? "#aca8a0" : "#fff7e6";
            const paths = ['M23 6 Q23 3 26 3 H47 Q50 3 50 6 V40 Q50 49 42 55 L24 67 Q17 72 10 67 L6 63 Q1 56 8 51 L23 40 Z', 'M15 7Q15 3 20 3H37Q42 3 42 8V25L49 20Q56 19 53 29L45 46V58Q45 70 30 70H22Q10 70 10 57V25Q10 18 15 19Z', 'M16 3H40V25L49 48 37 70 7 62 17 39Z', 'M27 3Q50 24 49 43Q47 68 28 70Q7 67 7 44Q7 23 27 3Z'];
            const path = paths[shape % paths.length];
            const key = 'sock-' + (++sockSvgId);
            let marks = '';
            if (pat === 'stripe') {
                for (let y = 19; y < 70; y += 10) marks += '<path d="M0 ' + y + ' H55" stroke="' + cloth + '" stroke-width="4"/>';
            } else if (pat === 'dot') {
                for (let y = 20; y < 70; y += 12) for (let x = 9; x < 52; x += 12) marks += '<circle cx="' + (x + (y % 24 === 8 ? 5 : 0)) + '" cy="' + y + '" r="2.6" fill="' + cloth + '"/>';
            }
            return '<svg viewBox="0 0 56 76" width="100%" height="100%" aria-hidden="true" style="pointer-events:none"><defs><clipPath id="' + key + '"><path d="' + path + '"/></clipPath></defs><path d="' + path + '" transform="translate(0 2)" fill="#233c3620"/><path d="' + path + '" class="sock-hit" fill="' + hex + '" stroke="' + (dark ? "#696761" : "#fffaf0") + '" stroke-width="2.5"/><g clip-path="url(#' + key + ')">' + marks + '<path d="M21 5 H51 V14 H21Z" fill="' + (dark ? "#8a867e" : "#fff0d3") + '"/><path d="M25 6v6m5-6v6m5-6v6m5-6v6m5-6v6" stroke="#233c3640" stroke-width="1"/><path d="M3 51 Q18 52 20 71 H0Z" fill="#233c36" opacity=".35"/><path d="M39 39h13v15q-13-2-13-15" fill="#233c36" opacity=".25"/></g></svg>';
        }

