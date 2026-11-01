// One player owns both recorded audio and the single-character speech fallback.
export function createVoicePlayer(env, recordedIds = [], audioRoot = './assets/audio') {
 const available = new Set(recordedIds);
 let current = null, generation = 0;
 function stop() {
  generation++;
  if(current){current.pause();current.removeAttribute('src');current.load();current=null;}
  env.speechSynthesis?.cancel();
 }
 async function play({id, text, onError = () => {}}) {
  stop();
  const request = generation;
  if(available.has(id)) {
   try {
    const audio = new env.Audio(`${audioRoot}/${id}.mp3`);
    current = audio;
    const failed = () => {if(request===generation){stop();onError();}};
    audio.onerror = failed;
    audio.onended = () => {if(current===audio)current=null;};
    await audio.play();
   } catch {if(request===generation){stop();onError();}}
   return;
  }
  if(!env.speechSynthesis || !env.SpeechSynthesisUtterance){onError();return;}
  const utterance = new env.SpeechSynthesisUtterance(text);
  utterance.lang='ja-JP';utterance.rate=.95;
  const voice=env.speechSynthesis.getVoices().find(v=>v.lang.startsWith('ja'));
  if(voice)utterance.voice=voice;
  utterance.onerror=()=>{if(request===generation)onError();};
  env.speechSynthesis.speak(utterance);
 }
 return {play,stop};
}
