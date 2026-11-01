import { words, dictionaryCharacters } from './data.js';
export const storageKey = 'katakana-atelier-v1';
export const emptyProgress = () => ({ version:1, completed:[], practiced:[], bestScores:{}, sound:true, voice:true });
export function loadProgress(storage, options={}) {
  const vocabulary=options.words??words, characters=options.characters??dictionaryCharacters, key=options.key??storageKey;
  try {
    const data=JSON.parse(storage.getItem(key));
    if (!data || data.version!==1) return emptyProgress();
    const ids = new Set(vocabulary.map(w=>w.id));
    const completed=[...new Set(Array.isArray(data.completed) ? data.completed.filter(id=>ids.has(id)) : [])];
    const bestScores=Object.fromEntries(Object.entries(data.bestScores||{}).filter(([c,n])=>characters.includes(c)&&Number.isInteger(n)&&n>=0&&n<=100));
    return {...emptyProgress(), bestScores, completed, practiced:Array.isArray(data.practiced) ? data.practiced.filter(c=>characters.includes(c)) : [], sound:data.sound!==false,voice:data.voice!==false};
  } catch { return emptyProgress(); }
}
export const allWordsCompleted = (progress, vocabulary=words) => vocabulary.every(w=>progress.completed.includes(w.id));
