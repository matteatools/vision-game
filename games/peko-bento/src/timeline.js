// Pause every delayed transition with the menu or a hidden browser tab.
export class Timeline {
 constructor(clock={now:()=>performance.now(),set:(fn,ms)=>setTimeout(fn,ms),clear:id=>clearTimeout(id)}){this.clock=clock;this.jobs=new Set();this.paused=false;}
 after(fn,ms){const job={fn,remaining:ms,id:null,start:0};this.jobs.add(job);if(!this.paused)this.arm(job);}
 arm(job){job.start=this.clock.now();job.id=this.clock.set(()=>{this.jobs.delete(job);job.fn();},job.remaining);}
 pause(){if(this.paused)return;this.paused=true;for(const job of this.jobs){this.clock.clear(job.id);job.remaining=Math.max(0,job.remaining-(this.clock.now()-job.start));}}
 resume(){if(!this.paused)return;this.paused=false;for(const job of this.jobs)this.arm(job);}
 clear(){for(const job of this.jobs)this.clock.clear(job.id);this.jobs.clear();}
}
