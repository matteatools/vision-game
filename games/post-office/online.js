import {createDuel} from '../puzzle-duels/duel.js';
const board=window.postOfficeOnline;
const duel=createDuel({game:'post',levels:[[4000,'みならい'],[2000,'しんじん'],[1000,'せんぱい'],[500,'ベテラン']],instruction:'同じ色が ちょうど5つ！ ふえは早い者勝ち！',...board});
document.getElementById('post-online').onclick=duel.open;
duel.resume();
