const KEY='peko-bento.preferences.v1';
export function readPrefs(){try{const p=JSON.parse(localStorage.getItem(KEY));return {bgm:p?.bgm!==false,sfx:p?.sfx!==false,entered:p?.entered===true,explained:p?.explained===true,trained:p?.trained===true};}catch{return {bgm:true,sfx:true,entered:false,explained:false,trained:false};}}
export function savePrefs(p){try{localStorage.setItem(KEY,JSON.stringify(p));}catch{/* Play remains available when storage is blocked. */}}
