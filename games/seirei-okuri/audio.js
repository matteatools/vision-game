// Recorded assets only. SFX data is embedded for file:// and mobile Web Audio unlock.
(function(root){
    const KEY='tamashii-okuri.audio.v1';
    const defaults={muted:false,bgm:20,effects:60};
    let settings={...defaults};
    try {
        const saved=JSON.parse(root.localStorage.getItem(KEY));
        if(saved && saved.version===1) {
            settings.muted=typeof saved.muted==='boolean'?saved.muted:false;
            for(const key of ['bgm','effects']) if(Number.isFinite(saved[key]))settings[key]=Math.max(0,Math.min(100,saved[key]));
        }
    } catch(_) {}
    const definitions={
        menu:{file:'select',gain:.30},select:{file:'select',gain:.40},cancel:{file:'select',gain:.24,rate:.85},
        land:{file:'land',gain:.33},float:{file:'float',gain:.38},sink:{file:'land',gain:.35,rate:.78},
        undo:{file:'undo',gain:.35},error:{file:'land',gain:.16,rate:.75},
        send:{file:'send',gain:.28},clear:{file:'clear',gain:.48}
    };
    const music=new Audio('assets/audio/bgm-stars.mp3');
    music.loop=true;music.preload='auto';
    let context,master,started=false,bgmPending=false;
    const buffers={},loading={},voices=new Set();
    function stopEffects(){for(const source of voices){try{source.stop();}catch(_) {}}voices.clear();}
    function updateMusic(){
        music.volume=settings.bgm/100*.6;
        if(!started || settings.muted || !settings.bgm || document.hidden){music.pause();return;}
        if(music.paused && !bgmPending){
            bgmPending=true;
            try {Promise.resolve(music.play()).catch(()=>{}).finally(()=>{bgmPending=false;if(settings.muted || document.hidden || !settings.bgm)music.pause();});}
            catch(_){bgmPending=false;}
        }
    }
    function unlock(){
        started=true;
        if(!context){
            try {
                const AudioContext=root.AudioContext||root.webkitAudioContext;
                if(AudioContext){
                    context=new AudioContext();master=context.createGain();
                    const limiter=context.createDynamicsCompressor();
                    limiter.threshold.value=-10;limiter.knee.value=12;limiter.ratio.value=4;
                    limiter.attack.value=.003;limiter.release.value=.12;
                    master.gain.value=settings.effects/100;
                    master.connect(limiter);limiter.connect(context.destination);
                    for(const [name,data] of Object.entries(root.LANTERN_SFX_DATA||{})){
                        const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));
                        loading[name]=context.decodeAudioData(bytes.buffer).then(buffer=>{buffers[name]=buffer;}).catch(()=>{});
                    }
                }
            }catch(_){context=null;}
        }
        if(context && context.state==='suspended')context.resume().catch(()=>{});
        updateMusic();
    }
    function effect(name,options={}){
        const definition=definitions[name];
        if(!definition || !started || !context || settings.muted || !settings.effects || document.hidden)return;
        if(!buffers[definition.file]){
            const requested=performance.now();
            if(loading[definition.file])loading[definition.file].then(()=>{
                if(buffers[definition.file] && performance.now()-requested<180)effect(name,options);
            });
            return;
        }
        if(context.state!=='running')return;
        if(voices.size>=6){const oldest=voices.values().next().value;try{oldest.stop();}catch(_){}voices.delete(oldest);}
        const source=context.createBufferSource(),gain=context.createGain();
        source.buffer=buffers[definition.file];source.playbackRate.value=definition.rate||1;
        gain.gain.value=definition.gain;source.connect(gain);gain.connect(master);voices.add(source);
        source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect();};
        const at=context.currentTime+(options.delay||0);
        source.start(at);
    }
    function setSettings(patch){
        if(typeof patch.muted==='boolean')settings.muted=patch.muted;
        for(const key of ['bgm','effects'])if(Number.isFinite(patch[key]))settings[key]=Math.max(0,Math.min(100,patch[key]));
        if(master)master.gain.value=settings.effects/100;
        if(settings.muted || !settings.effects)stopEffects();
        try{root.localStorage.setItem(KEY,JSON.stringify({version:1,...settings}));}catch(_){}
        updateMusic();return {...settings};
    }
    document.addEventListener('pointerdown',unlock,{passive:true});
    document.addEventListener('click',event=>{
        const button=event.target.closest('button');
        if(!button || button.disabled || button.closest('.sound-controls'))return;
        unlock();
        if(!button.classList.contains('tube-button'))effect(button.dataset.sound||'menu');
    },true);
    document.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key))unlock();});
    document.addEventListener('visibilitychange',()=>{
        if(document.hidden){stopEffects();if(context && context.state==='running')context.suspend().catch(()=>{});}
        else if(started && context && context.state==='suspended')context.resume().catch(()=>{});
        updateMusic();
    });
    root.addEventListener('pagehide',()=>{music.pause();stopEffects();});
    root.addEventListener('pageshow',updateMusic);
    root.LanternAudio={unlock,effect,setSettings,getSettings:()=>({...settings})};
})(window);
