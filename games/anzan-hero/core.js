(function(root){
'use strict';
const BATTLE_QUESTIONS=10,HIT_POWER=12,VISION_CHOICES=12;
const stageSeconds=Object.freeze([15,12,10,8,7,6,5,4,3,2]);
const multiplicationTables=Object.freeze([[1,2,5],[3,4],[1,2,3,4,5],[6,7],[8,9],[6,7,8,9],[1,2,3,4,5,6,7,8,9]].map(rows=>Object.freeze(rows)));
const multiplicationLabels=Object.freeze(['1・2・5の だん','3・4の だん','1〜5の だん','6・7の だん','8・9の だん','6〜9の だん','すべての だん']);
const stageRewardTiers=Object.freeze([0,0,0,1,1,1,2,2,3,3]);
const courses=[{id:'add-basic',name:'たしざん（くりあがりなし）',symbol:'＋'},{id:'add-carry',name:'たしざん（くりあがりあり）',symbol:'＋'},{id:'sub-basic',name:'ひきざん（くりさがりなし）',symbol:'−'},{id:'sub-borrow',name:'ひきざん（くりさがりあり）',symbol:'−'},{id:'multiply',name:'かけざん',symbol:'×'}];
function pool(course='sub-borrow'){const p=[];if(!courses.some(c=>c.id===course))course='sub-borrow';for(let a=1;a<=18;a++)for(let b=1;b<=9;b++){let answer,ok=false;if(course==='multiply'){answer=a*b;ok=a<=9;}else if(course.startsWith('add')){answer=a+b;ok=a<=9&&(course==='add-basic'?answer<=10:answer>10);}else{answer=a-b;ok=course==='sub-basic'?a>=2&&a<=10&&answer>=1:a>=11&&answer>=1&&answer<=9;}if(ok)p.push({a,b,answer,symbol:courses.find(c=>c.id===course).symbol});}return p;}
function answerValues(course){return [...new Set(pool(course).map(q=>q.answer))].sort((a,b)=>a-b);}
function stageRules(course,enemy=0,mode='normal'){
 const safeEnemy=Number.isInteger(enemy)&&enemy>=0&&enemy<20?enemy:0,index=safeEnemy%10;
 const multiply=course==='multiply',tableIndex=Math.min(index,6);
 const seconds=(multiply?(index<7?5:stageSeconds[index]):stageSeconds[index])+(mode==='vision'?1:0);
 return {number:index+1,awakened:safeEnemy>=10,seconds,tables:multiply?multiplicationTables[tableIndex]:null,tableLabel:multiply?multiplicationLabels[tableIndex]:'',rewardTier:stageRewardTiers[index]};
}
function visionChoices(course,answer,rng=Math.random){
 const others=answerValues(course).filter(value=>value!==answer);
 return shuffle([answer,...shuffle(others,rng).slice(0,VISION_CHOICES-1)],rng);
}
function stagePool(course,enemy=0){const rules=stageRules(course,enemy);return pool(course).filter(q=>!rules.tables||rules.tables.includes(q.a));}
function shuffle(p,rng=Math.random){p=p.slice();for(let i=p.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[p[i],p[j]]=[p[j],p[i]];}return p;}
function damage(){return HIT_POWER;}
function stage(hp,max=120){return hp<=0?4:Math.min(3,Math.floor((1-hp/max)*4));}
function practicePool(course){const pairs={
 'add-basic':[[1,1],[2,3],[4,5]],'add-carry':[[8,3],[6,7],[9,9]],
 'sub-basic':[[5,2],[8,4],[9,2]],'sub-borrow':[[11,9],[12,5],[15,6]],multiply:[[2,3],[3,4],[4,5]]};
 const questions=pool(course);return (pairs[course]||pairs['sub-borrow']).map(([a,b])=>questions.find(q=>q.a===a&&q.b===b));}
const api={BATTLE_QUESTIONS,HIT_POWER,VISION_CHOICES,courses,pool,stageRules,stagePool,practicePool,answerValues,visionChoices,shuffle,damage,stage}; if(typeof module!=='undefined')module.exports=api;root.MathBattle=api;
})(typeof window==='undefined'?globalThis:window);
