import {createGame,FOODS,score} from './core.js';
export const LESSONS=[null,
 {title:'はいってる おかず',intro:'この３つのうち、いくつ はいってるかな？ ばしょは まだ きにしなくていいよ。',hints:['おかずを ひとつだけ かえて、くらべてみよう。','はいってる かずが ふえたら、いれた おかずが あたりだね。']},
 {title:'ばしょも あってる',intro:'こんどは ばしょも みてみよう！ おなじ おかずでも、ばしょで かわるよ。',hints:['○と△を みてみよう。△は ばしょが ちがうんだね。','おかずを かえずに、ならびを かえてみよう。']},
 {title:'いれかえて たしかめる',intro:'この３つは はいってるよ。２つを いれかえたら どうなるかな？',hints:['○１ △２。ひとつは ばしょも あっているね。','いれかえて ○が へったら、あっていた ばしょを うごかしたんだね。']},
 {title:'これまでを くらべる',intro:'２つの おべんとうを くらべよう。かわったのは どこかな？',hints:['ひかっている ２つの きろくを くらべよう。','ひとつ かえて ○が ふえたね。どちらの おかずが はいっているかな？']}
];
export function createLesson(stage,extra=false){const g=createGame();Object.assign(g,{mode:'lesson',stage,extra,candidates:FOODS.slice(0,stage===1?4:stage===2?5:6).map(f=>f.id)});const ids=g.candidates;const map=extra?[ids[2],ids[0],ids[3],ids[1],ids[4],ids[5]]:ids;g.answer=[map[0],map[1],map[2]];g.guess=stage===1?[map[0],map[1],map[3]]:[map[1],map[0],map[2]];
 if(stage===3)g.history=[{guess:[...g.guess],...score(g.guess,g.answer),example:true}];
 if(stage===4){const rows=[[map[0],map[1],map[4]],[map[0],map[3],map[4]]];if(extra)rows.push([map[5],map[3],map[4]]);g.history=rows.map(guess=>({guess,...score(guess,g.answer),example:true}));g.guess=[...rows[0]];}
 return g;}
export function nextLesson(game){return game.hints>0&&!game.extra?{stage:game.stage,extra:true}:game.stage<4?{stage:game.stage+1,extra:false}:null;}
