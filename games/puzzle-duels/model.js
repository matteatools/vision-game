export const COLORS=['red','blue','yellow','green','purple'];
export const DURATIONS={post:120000,gems:60000};
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function makeQuestions(game,level,ids=[]) {
  const questions={};
  let rows=[];
  for(let index=0;index<256;index++) {
    if(game==='gems') {
      const n=Number(level),pool=shuffle([...ids]),answer=pool[0];
      questions[index]={board:JSON.stringify({left:shuffle(pool.slice(0,n)),right:shuffle([answer,...pool.slice(n,n*2-1)])}),answer};
    } else {
      // The same stream of letters is used by both players. Five-letter colours
      // leave at the next delivery, whether or not a player collected them.
      const counts={};rows.flat().forEach(c=>{if(c)counts[c]=(counts[c]||0)+1;});
      rows=rows.map(row=>row.map(c=>counts[c]===5?null:c)).slice(0,4);
      const color=COLORS[Math.floor(Math.random()*COLORS.length)];
      const remaining=rows.flat().filter(c=>c===color).length;
      const amount=remaining<5 && Math.random()<.55?5-remaining:1+Math.floor(Math.random()*5);
      rows.unshift(Array.from({length:amount},()=>color));
      const totals={};rows.flat().forEach(c=>{if(c)totals[c]=(totals[c]||0)+1;});
      questions[index]={board:JSON.stringify(rows),answer:Object.values(totals).includes(5)?'yes':'none'};
    }
  }
  return questions;
}
export function initialState(){return {round:0,score0:0,score1:0,last0:0,last1:0,since:0,by:0,answer:'',action:'start'};}
// Pure transition shared by transactions and local verification. A transaction
// always refers to the displayed question, never the next one after a race.
export function transition(old,expected,seat,answer,at,question,tick=false) {
  if(!old || old.round!==expected)return;
  const next={...old,by:seat,answer,action:tick?'tick':answer===question.answer?'claim':'wrong'};
  if(tick){next.round++;next.since=at;}
  else {
    next['last'+seat]=at;
    if(next.action==='claim'){next['score'+seat]++;next.round++;next.since=at;}
    else next['score'+seat]=Math.max(0,next['score'+seat]-1);
  }
  return next;
}
