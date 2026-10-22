// Progress is independent of puzzles, practice and developer passes.
(function(root) {
    const KEY = 'tamashii-okuri.progress.v1';
    const valid = n => Number.isInteger(n) && n >= 0 && n <= 50;
    const validMoves = n => Number.isSafeInteger(n) && n > 0;
    function bests(data, cleared) {
        const result={};
        for(let i=0;i<cleared;i++)if(validMoves(data?.[i]))result[i]=data[i];
        return result;
    }
    function read(storage) {
        try {
            const data = JSON.parse((storage || root.localStorage).getItem(KEY));
            const cleared=data && data.version===1 && valid(data.cleared)?data.cleared:0;
            return {cleared,bestMoves:bests(data?.bestMoves,cleared),available:true};
        } catch (_) { return {cleared:0,bestMoves:{},available:false}; }
    }
    function save(cleared, storage) {
        const state=typeof cleared==='object' && cleared!==null?cleared:{cleared,bestMoves:read(storage).bestMoves};
        if (!valid(state.cleared)) return false;
        try {
            (storage || root.localStorage).setItem(KEY,JSON.stringify({version:1,cleared:state.cleared,bestMoves:bests(state.bestMoves,state.cleared)}));
            return true;
        } catch (_) { return false; }
    }
    function advance(cleared, levelIdx) {
        if (!valid(cleared)) cleared = 0;
        return levelIdx === cleared && cleared < 50 ? cleared + 1 : cleared;
    }
    function merge(a,b) {
        const cleared=Math.max(valid(a.cleared)?a.cleared:0,valid(b.cleared)?b.cleared:0);
        const bestMoves=bests(a.bestMoves,cleared);
        for(const [index,moves] of Object.entries(bests(b.bestMoves,cleared)))bestMoves[index]=Math.min(bestMoves[index]||Infinity,moves);
        return {cleared,bestMoves};
    }
    function record(state,levelIdx,moves) {
        if(!Number.isInteger(levelIdx) || levelIdx<0 || levelIdx>=50 || levelIdx>state.cleared || !validMoves(moves))return state;
        return {cleared:advance(state.cleared,levelIdx),bestMoves:{...state.bestMoves,[levelIdx]:Math.min(state.bestMoves?.[levelIdx]||Infinity,moves)}};
    }
    const api = {KEY,read,save,advance,merge,record};
    root.LanternProgress = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
