export const LIMIT=6, MAX_ROUNDS=15, ANSWER_MS=10000, ATTACK_MS=2000;
// Room progress is shared, survives reconnects, and never reads solo unlocks.
export function roomStage(battles,count=20){
 const won=new Set(Object.values(battles||{}).filter(b=>b?.end?.result==='win'&&Number.isInteger(b.enemy)&&b.enemy>=0&&b.enemy<count).map(b=>b.enemy));
 let stage=0;while(stage<count&&won.has(stage))stage++;
 return stage;
}
export function maximumHP(n){return 8*Math.floor(12*n*1.2)+Math.floor(24*n*1.2)+Math.floor(36*n*1.2);}
export function power(combo){return combo===10?36:combo===5?24:12;}
export function reply(previous,prior,question,value,at,start,id){
 if(previous?.correct)return null;
 const correct=value===question.answer,wrong=!!previous?.wrong||!correct;
 const combo=correct&&!wrong?(prior?.correct&&!prior.wrong?prior.combo%10+1:1):0;
 return {answer:value,attempts:(previous?.attempts||0)+1,correct,wrong,combo,at,ms:at-start,id};
}
export function deltas(old,next){return {correct:next.correct?1:0,wrong:next.wrong&&!old?.wrong?1:0,damage:next.correct?power(next.combo):0};}
export function outcome(stats,n,hp,shields,round,at){
 const all=stats.correct===n&&stats.wrong===0,damage=all?Math.floor(stats.damage*1.2):stats.damage;
 hp=Math.max(0,hp-damage);shields=Math.max(0,shields-stats.wrong);
 return {hp,shields,damage,all,closed:at,nextAt:at+ATTACK_MS,result:hp===0?'win':shields===0?'loss':round>=MAX_ROUNDS?'limit':''};
}
export function ownStats(records){const rows=Object.values(records||{}).filter(Boolean),correct=rows.filter(r=>r.correct);return {answered:rows.length,correct:correct.length,attempts:rows.reduce((s,r)=>s+r.attempts,0),maxCombo:Math.max(0,...rows.map(r=>r.combo)),average:correct.length?correct.reduce((s,r)=>s+(r.base==null?r.ms:r.at-r.base),0)/correct.length/1000:null};}
