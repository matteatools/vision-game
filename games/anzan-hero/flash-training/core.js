// Adapted from the user's 2026-11-21 flash-anzan app; hero art replaces animals.
(function(root){
  'use strict';
  const heroes=Object.freeze([
    {id:'red',name:'レッド',image:'../assets/command/ranger-red-action.webp'},
    {id:'blue',name:'ブルー',image:'../assets/command/ranger-blue-scout.webp'},
    {id:'yellow',name:'イエロー',image:'../assets/command/ranger-yellow-boost.webp'},
    {id:'green',name:'グリーン',image:'../assets/command/ranger-green-guard.webp'},
    {id:'pink',name:'ピンク',image:'../assets/command/ranger-pink-star.webp'}
  ].map(Object.freeze));
  const defaults=Object.freeze({mode:'numbers',digits:1,seconds:3,count:5,heroCount:3,fullscreen:true});
  function sanitize(value){
    const v=value&&typeof value==='object'?value:{};
    return {
      mode:v.mode==='heroes'?'heroes':'numbers',
      digits:[1,2,3,4].includes(v.digits)?v.digits:defaults.digits,
      seconds:Number.isFinite(v.seconds)&&v.seconds>=0.1&&v.seconds<=10?Math.round(v.seconds*10)/10:defaults.seconds,
      count:[5,10,15,20].includes(v.count)?v.count:defaults.count,
      heroCount:[3,4,5,6,8].includes(v.heroCount)?v.heroCount:defaults.heroCount,
      fullscreen:typeof v.fullscreen==='boolean'?v.fullscreen:defaults.fullscreen
    };
  }
  function countFor(settings){const s=sanitize(settings);return s.mode==='heroes'?s.heroCount:s.count;}
  function generateHeroes(settings,random=Math.random){
    const count=sanitize(settings).heroCount,sequence=[];
    for(let i=0;i<count;i++){
      const choices=heroes.filter(h=>h.id!==sequence[i-1]);
      sequence.push(choices[Math.min(choices.length-1,Math.floor(random()*choices.length))].id);
    }
    return sequence;
  }
  function checkOrder(expected,answer){
    const matches=expected.map((id,i)=>id===answer[i]);
    return {correct:expected.length===answer.length&&matches.every(Boolean),matched:matches.filter(Boolean).length,matches};
  }
  function generate(settings,random=Math.random){
    const s=sanitize(settings),min=10**(s.digits-1),max=10**s.digits-1,numbers=[];
    for(let i=0;i<s.count;i++){
      // Uniformly choose from the range with the preceding number excluded.
      const choices=max-min+1-(i>0?1:0);
      let next=min+Math.min(choices-1,Math.floor(random()*choices));
      if(i>0&&next>=numbers[i-1])next++;
      numbers.push(next);
    }
    return numbers;
  }
  function frameAt(elapsed,settings){
    const s=sanitize(settings),ms=Math.round(s.seconds*1000);
    if(elapsed<3000)return {phase:'countdown',value:3-Math.floor(Math.max(0,elapsed)/1000),progress:0};
    const active=elapsed-3000,index=Math.floor(active/ms);
    const count=countFor(s);
    if(index>=count)return {phase:'answer',progress:1};
    const gap=Math.min(70,ms*.12);
    return {phase:'numbers',index,visible:active%ms<ms-gap,progress:active/(count*ms)};
  }
  function parseAnswer(raw){
    const normalized=String(raw).replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xfee0)).replace(/[\s,，]/g,'');
    return /^\d+$/.test(normalized)&&Number.isSafeInteger(Number(normalized))?Number(normalized):null;
  }
  root.FlashMath={defaults,heroes,sanitize,countFor,generate,generateHeroes,checkOrder,frameAt,parseAnswer};
})(globalThis);
