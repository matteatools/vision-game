import { createVoicePlayer } from './voice.js';
import { recordedWordIds as katakanaAudio } from './audio-manifest.js';
import { recordedWordIds as hiraganaAudio } from './hiragana-audio-manifest.js';
import * as katakanaData from './data.js';
import * as hiraganaData from './hiragana-data.js';
const {illustration}=katakanaData;
import { master as katakanaMaster } from './master.js';
import { master as hiraganaMaster } from './hiragana-master.js';
import { recognize as recognizeBase, suggestCharacters as suggestBase, evaluateWord, gradeHandwriting as gradeBase } from './recognizer.js';
import { loadProgress as loadProgressBase, storageKey as katakanaStorageKey, allWordsCompleted as allWordsCompletedBase } from './progress.js';

const app=document.querySelector('#app');
const kanaFont='600 106px "KanaReference","Noto Sans JP"';
const kanaFontReady=document.fonts?.load?.('600 106px "KanaReference"').catch(()=>[])??Promise.resolve([]);
let language='katakana',scriptName='カタカナ',classroomName='かたかなきょうしつ';
let {stages,words,dictionaryCharacters}=katakanaData;
let master=katakanaMaster,recordedWordIds=katakanaAudio,storageKey=katakanaStorageKey;
let voicePlayer=createVoicePlayer(window,recordedWordIds);
const loadProgress=storage=>loadProgressBase(storage,{words,characters:dictionaryCharacters,key:storageKey});
const allWordsCompleted=progress=>allWordsCompletedBase(progress,words);
const recognize=strokes=>recognizeBase(strokes,master);
const suggestCharacters=strokes=>suggestBase(strokes,master);
const gradeHandwriting=(strokes,c)=>gradeBase(strokes,c,master);
let storageFailed=false;
let storage;
try { storage=window.localStorage; } catch { storageFailed=true; }
let progress=loadProgress(storage);
let screen='title', stageId=4, mode='word', word=words.find(w=>w.text==='ロケット');
let target='ア', model=null, slots=[], active=0, strokes=[], current=null, pointer=null;
let pending=null, practiceScore=null;
let modelPreview=false,previewPointer=null,previewKey=null;
let lesson=null, lessonOrder=['い','ご','ち'], lessonSelected=null;
let modelFailures=0,lastFailedAttempt=null;
let lessonFailures=0,lastLessonFailure=null;
function resetModelHelp(){lessonFailures=0;lastLessonFailure=null;modelFailures=0;lastFailedAttempt=null;showGuide=false;}
function failedAttempt(message){
 if(lesson!==null&&strokes.length&&(mode==='word'||practiceScore<70)){const signature=JSON.stringify(strokes);if(signature!==lastLessonFailure){lessonFailures++;lastLessonFailure=signature;}}
 if(mode!=='word')return message;
 if(!model || !strokes.length)return message;
 const signature=JSON.stringify(strokes);
 if(signature===lastFailedAttempt)return message;
 lastFailedAttempt=signature;modelFailures++;
 if(modelFailures===2 && !showGuide){showGuide=true;return '「かきなおす」を おして、うすい もじを なぞってみよう。';}
 return message;
}
let feedback='', feedbackKind='', showGuide=false, selectedSlot=null, animationId=0, celebration=false;
function save() { if(lesson!==null)return; try { storage.setItem(storageKey,JSON.stringify(progress)); } catch { storageFailed=true; } }
const completed=id=>progress.completed.includes(id);
const practiceCharacters=()=>dictionaryCharacters;
const currentStage=()=>stages.find(s=>s.id===stageId);
const supported=w=>[...w.text].every(c=>master[c]);
const checkmark='<span aria-hidden="true">✓</span>';
const HANAMARU_SCORE=90;
const DOUBLE_HANAMARU_SCORE=95;
function announce(text) { document.querySelector('#announcer').textContent=text; }
function go(next) { if(lesson!==null&&!['play','lesson'].includes(next)){lesson=null;progress=loadProgress(storage);} pointer=null;current=null;practiceScore=null; voicePlayer.stop();resetModelHelp();pending=null; animationId++; screen=next; feedback=''; celebration=false; render(); window.scrollTo(0,0); }
function switchClassroom(next){
 if(!['hiragana','katakana'].includes(next))return;
 voicePlayer.stop();language=next;
 ({stages,words,dictionaryCharacters}=next==='hiragana'?hiraganaData:katakanaData);
 master=next==='hiragana'?hiraganaMaster:katakanaMaster;
 scriptName=next==='hiragana'?'ひらがな':'カタカナ';classroomName=next==='hiragana'?'ひらがなきょうしつ':'かたかなきょうしつ';
 storageKey=next==='hiragana'?'hiragana-atelier-v1':katakanaStorageKey;
 recordedWordIds=next==='hiragana'?hiraganaAudio:katakanaAudio;
 voicePlayer=createVoicePlayer(window,recordedWordIds,next==='hiragana'?'./assets/hiragana-audio':'./assets/audio');
 progress=loadProgress(storage);stageId=1;word=words[0];target=dictionaryCharacters[0];strokes=[];slots=[];model=null;go('home');
}
const usesVectorReference=entry=>entry.type==='long'||entry.reference==='paths';
function vectorReference(entry){if(entry.type==='long')return entry.outlinePaths.map(d=>`<path d="${d}" fill="currentColor"/>`).join('');return entry.displayPaths.map((d,i)=>`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${entry.referenceStrokeWidths[i]}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');}
function glyph(c){const entry=master[c];if(!entry)return c;return usesVectorReference(entry)?`<svg class="kana-glyph kana-vector" viewBox="0 0 100 100" aria-hidden="true">${vectorReference(entry)}</svg>`:`<span class="kana-glyph" aria-hidden="true">${c}</span>`;}
function header(){return `<header class="school-header"><button class="text-button" data-action="title">← タイトル</button><button class="school-name" data-action="home">${classroomName}</button><button class="icon-button" data-action="settings" aria-label="せってい">⚙</button></header>`;}
function footer(){return '';}
function titleScreen(){return `<main class="title-screen"><picture class="title-backdrop"><source media="(max-aspect-ratio: 1/1)" srcset="./assets/title/tsuru-sennin-classroom.webp"><img src="./assets/title/tsuru-sennin-classroom-landscape.webp" alt="筆を持って迎える鶴の仙人と書道教室"></picture><div class="title-menu"><h1><img src="./assets/title/tsuru-sennin-logo.webp" alt="つるせんにんのしょどうきょうしつ"></h1><div class="classroom-buttons"><button class="lesson-entry" data-action="lesson-start"><span>筆</span>せんにんと れんしゅう <b>→</b></button><button data-language="hiragana"><span>あ</span>ひらがなきょうしつ <b>→</b></button><button data-language="katakana"><span>ア</span>かたかなきょうしつ <b>→</b></button></div><a class="park-link" href="https://matteatools.github.io/vision-game/">← ゲームパークへもどる</a></div></main>`;}
function home(){return `<main class="choice-page"><p class="eyebrow">すきな れんしゅうを えらぼう</p><h1>きょうは なにを きわめる？</h1><div class="mode-choices"><button class="mode-card" data-action="practice-menu"><span class="mode-symbol">${glyph(dictionaryCharacters[0])}</span><h2>ひともじをきわめる</h2><p>おてほんと くらべて、はなまるを めざそう</p><span class="mode-count">${Object.values(progress.bestScores).filter(n=>n>=HANAMARU_SCORE).length} / ${dictionaryCharacters.length} もじ</span></button><button class="mode-card" data-action="words"><span class="mode-art">${stages[0].icon}</span><h2>ことばをきわめる</h2><p>えを みて かいて、なかまを あつめよう</p><span class="mode-count">${progress.completed.length} / 48 ことば</span></button></div></main>`;}
function practiceMenu(){return `<main class="choice-page"><button class="text-button" data-action="home">← モードをえらぶ</button><h1>ひともじをきわめる</h1><div class="mode-choices"><button class="mode-card" data-action="characters"><span class="mode-symbol">${glyph(dictionaryCharacters[0])}</span><h2>もじをえらぶ</h2><p>すきな もじから はじめよう</p></button><button class="mode-card" data-action="mastered"><span class="mode-symbol flower-symbol">❀</span><h2>きわめたもじ</h2><p>${HANAMARU_SCORE}てん いじょうの はなまるを みよう</p><span class="mode-count">${Object.values(progress.bestScores).filter(n=>n>=HANAMARU_SCORE).length} もじ</span></button></div></main>`;}
function characterPage(onlyMastered=false){const list=practiceCharacters().filter(c=>!onlyMastered||(progress.bestScores[c]??0)>=HANAMARU_SCORE);return `<main class="character-page"><button class="text-button back" data-action="practice-menu">← ひともじをきわめる</button><h1>${onlyMastered?'きわめたもじ':'もじをえらぶ'}</h1><p>${onlyMastered?'はなまるの もじを もういちど かいても いいよ。':`${HANAMARU_SCORE}てんで はなまる、${DOUBLE_HANAMARU_SCORE}てんで ふたつ！`}</p>${list.length?`<div class="mastery-grid">${list.map(c=>`<button data-practice="${c}" aria-label="${c}${(progress.bestScores[c]??0)>=HANAMARU_SCORE?` はなまる ${flowerCount(progress.bestScores[c])}つ`:''}"><span>${glyph(c)}</span>${flower(c)}<small>${progress.bestScores[c]===undefined?'―':progress.bestScores[c]+'点'}</small></button>`).join('')}</div>`:'<div class="empty-mastery"><p>はなまるを あつめよう！</p><button class="primary" data-action="characters">もじをえらぶ →</button></div>'}</main>`;}
function wordStages(){return `<main class="word-stages"><button class="text-button back" data-action="home">← モードをえらぶ</button><div class="section-heading"><h1>ことばをきわめる</h1><span class="pill">${progress.completed.length} / 48</span></div><div class="stage-grid">${stages.map(s=>`<button class="stage-card" data-stage="${s.id}"><div class="stage-art" style="--tile:${s.color}"><span class="stage-number">${s.id}</span><span class="stage-emoji">${s.icon}</span></div><div class="stage-copy"><h3>${s.name}</h3><div class="stage-bottom">${s.words.filter(w=>completed(w.id)).length} / 6 ことば</div></div></button>`).join('')}</div><button class="collection-entry" data-action="collection"><span>${illustration('books')}</span><strong>コレクション</strong><span>${allWordsCompleted(progress)?'コンプリート！':progress.completed.length+' / 48'} →</span></button></main>`;}
function stageView() {
 const s=stages.find(s=>s.id===stageId);
 return `<main class="word-selection"><button class="text-button back" data-action="words">← ステージを えらぶ</button><div class="page-title"><span class="title-emoji" style="background:${s.color}">${s.icon}</span><div><div class="eyebrow">ステージ ${s.id}</div><h1>${s.name}</h1><p>${s.subtitle}</p></div></div><div class="word-grid">${s.words.map(w=>`<button class="word-card" data-word="${w.id}"><span class="word-emoji">${w.icon}</span><h2>これは なあに？</h2><span class="${supported(w)?'available':'muted'}">${completed(w.id)?'✓ コレクションに とうろくずみ':supported(w)?'かいてみよう →':'じゅんびちゅう'}</span></button>`).join('')}</div><div id="stage-message" role="status"></div></main>`;
}
function startPractice(c=dictionaryCharacters[0]) { if(!master[c])return; mode='practice';target=c;model=c;showGuide=false;slots=[null];active=0;strokes=[];current=null;selectedSlot=null;go('play'); }
function startWord(w) { stageId=Number(w.id.split('-')[0]);mode='word';word=w;model=null;showGuide=false;slots=Array.from(w.text,()=>null);active=0;strokes=[];current=null;selectedSlot=null;go('play'); }
function miniature(entry, lines) {
 return `<svg viewBox="0 0 100 100" aria-hidden="true">${lines.map(s=>`<polyline points="${s.map(p=>p.join(',')).join(' ')}" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;
}
function play() {
 if(celebration)return lesson!==null?lessonWordReward():rewardPanel();
 const entry=master[model];
 return `<main class="play-main ${lesson!==null?'lesson-play':''}"><div class="play-top"><button class="text-button" data-action="${lesson!==null?'lesson-exit':mode==='word'?'stage-back':'characters'}">← もどる</button><span class="pill">${mode==='practice'?'ひともじをきわめる':currentStage().name}</span><button class="text-button" data-action="dictionary">おてほん ▦</button><button class="text-button" data-action="collection">コレクション</button><button class="text-button" data-action="settings" aria-label="せってい">⚙</button></div>
 <p class="orientation-tip">たてむきに すると、ひろく かけるよ。</p>${lesson!==null?lessonCoach():''}
 ${mode==='practice'?(lesson!==null?'<div class="practice-picker"></div>':`<div class="practice-picker"><label for="practice-select">れんしゅうする もじ</label><select id="practice-select">${practiceCharacters().map(c=>`<option value="${c}" ${target===c?'selected':''}>${c}${'❀'.repeat(flowerCount(progress.bestScores[c]))}</option>`).join('')}</select><button class="text-button" data-action="mastery-list">もじを えらぶ</button><span class="mastery-letter">${glyph(target)}${flower(target)}</span></div>`):''}
 <div class="exercise-layout"><aside class="prompt-panel"><span class="eyebrow">${mode==='practice'?'この もじを かこう':'これは なあに？'}</span><div class="prompt-illustration ${celebration?'celebrate':''}">${mode==='practice'?glyph(target):word.icon}</div><button class="secondary voice-button" data-action="speak">♫ よみを きく</button><p>${mode==='practice'?'おてほんを みながら<br>ゆっくり かこう。':'うえから したへ<br>ひともじずつ かこう。'}</p>${mode==='word'?`<div class="word-slots" aria-label="ことばの マス">${slots.map((s,i)=>`<button class="word-slot ${s?'passed':''} ${active===i?'current':''} ${selectedSlot===i?'swap-selected':''}" data-slot="${i}" ${s?'draggable="true"':''} aria-label="${i+1}もじめ${s?' '+s.character:''}"><span class="slot-index">${i+1}</span>${s?miniature(master[s.character],s.strokes):'<span class="empty-slot">·</span>'}${s?'<span class="slot-check">✓</span>':''}</button>`).join('')}</div><p class="slot-help">みどりの マスを ふたつ おすと<br>じゅんばんを かえられるよ。</p>`:''}</aside>
 <section class="writing-panel"><div class="panel-heading"><h2>${practiceScore!==null?`${practiceScore}点！`:mode==='practice'?'おてほんに ちかづけよう':`${active+1}もじめを かこう`}</h2><span>${strokes.length} かく</span></div><div class="canvas-wrap" data-tracing="${showGuide}"><canvas id="writing" width="600" height="600" aria-label="もじを かく マス。ペンや タッチで かけます。"></canvas><span class="canvas-label">${practiceScore!==null?'みずいろ：おてほん　あか：かいた もじ':'ここに かいてね'}</span>${flower(target,practiceScore)}</div><div class="feedback ${feedbackKind}" role="status">${feedback || ''}</div>${confirmationPanel()}<div class="writing-actions"><button class="secondary" data-action="clear">↺ けす</button><button class="primary" data-action="judge" ${celebration||pending||practiceScore!==null?'disabled':''}>できた！ ${checkmark}</button></div><div class="writing-tools"><button class="text-button" data-action="undo">↶ ひとつ もどす</button>${mode==='practice'&&practiceScore!==null&&(lesson===null||practiceScore>=70)?`<button class="text-button" data-action="${lesson!==null?'lesson-next':'next-character'}">${lesson===1?'ことばへ': 'つぎの もじ'} →</button>`:''}${(entry||mode==='practice')?`<button class="text-button model-peek" data-action="peek-model" aria-label="みほんを かくにん（押している間だけ表示）" ${practiceScore!==null?'disabled':''}>みほんを かくにん</button>`:''}</div>${mode==='word'&&slots[active]?'<button class="text-button" data-action="replace">この マスを かきなおす</button>':''}${celebration?`<button class="primary next-button" data-action="${mode==='practice'?'next-character':'stage-back'}">${mode==='practice'?'つぎの もじへ':'ことばを えらぶ'} →</button>`:''}</section>
 ${modelPanel(entry)}</div>${rewardPanel()}</main>`;
}

function rewardPanel() {
 if(!celebration)return '';
 const isWord=mode==='word',isFinal=isWord&&allWordsCompleted(progress);
 const stage=currentStage(),stageDone=isWord&&stage.words.every(w=>completed(w.id));
 const title=isFinal?'コンプリート！':stageDone?'ステージ コンプリート！':'できた！';
 const label=isWord?word.text:target;
 const description=isFinal?'48この ことばを ぜんぶ きわめたよ！':isWord?'コレクションに なかまいり！':'じょうずに かけたね！';
 const count=isWord?stage.words.filter(w=>completed(w.id)).length:progress.practiced.length;
 const action=isFinal?'collection':isWord?'next-word':'next-character';
 const actionText=isFinal?'コレクションを みる':isWord?(stageDone?'つぎの ステージへ':'つぎの ことばへ'):'つぎの もじへ';
 return `<main class="completion-page ${stageDone?'completion-stage':''} ${isFinal?'completion-final':''}" aria-labelledby="completion-title"><section class="completion-card" style="--reward-color:${isWord?stage.color:'#e4eedc'}"><div class="confetti" aria-hidden="true">${Array.from({length:26},(_,i)=>`<i style="--i:${i};--x:${(i*37)%100}%;--delay:${(i%7)*.09}s;--hue:${[40,150,200,15,280][i%5]}"></i>`).join('')}</div><div class="completion-kicker">${isFinal?'ことばをきわめる':isWord?stage.name:'ひともじをきわめる'}</div><h1 id="completion-title" tabindex="-1">${title}</h1><div class="completion-art ${isWord?'':'completion-letter'}"><span class="art-halo" aria-hidden="true"></span><span class="completion-spark spark-left" aria-hidden="true">✦</span><span class="completion-object" role="img" aria-label="${isFinal?'全48語完成のトロフィー':label}">${isFinal?illustration('trophy'):isWord?word.icon:target}</span><span class="completion-spark spark-right" aria-hidden="true">✦</span><span class="completion-medal" aria-hidden="true">✓</span></div><div class="completed-word" aria-label="かけた ことば">${[...label].map((c,i)=>`<span style="--n:${i}">${c}</span>`).join('')}</div><p class="completion-message">${description}</p>${stageDone?`<div class="completion-parade" aria-label="ステージの6つのなかま">${stage.words.map((w,i)=>`<span style="--n:${i}" role="img" aria-label="${w.text}">${w.icon}</span>`).join('')}</div><p class="completion-progress">${isFinal?'8ステージ・48この ことばが そろったよ！':'6この ことばが そろったよ！'}</p>`:isWord?`<div class="completion-stamps" aria-label="このステージで${count}語完成">${stage.words.map(w=>`<span class="${completed(w.id)?'earned':''}">${completed(w.id)?'★':'☆'}</span>`).join('')}</div><p class="completion-progress">この ステージは ${count} / 6 ことば</p>`:''}<div class="completion-actions"><button class="primary" data-action="${action}">${actionText} →</button><button class="secondary" data-action="repeat-exercise">もういちど かく</button></div><button class="text-button" data-action="${isWord?'collection':'home'}">${isWord?'コレクションを みる':'ホームへ もどる'}</button></section></main>`;
}
function nextWord() {
 const stage=currentStage();
 const remaining=stage.words.find(w=>!completed(w.id));
 if(remaining){startWord(remaining);return;}
 stageId=stageId%stages.length+1;go('stage');
}
function modelPanel(entry) {
 if(!entry)return '';
 const reference=usesVectorReference(entry)?`<g class="glyph-outline" color="#344a45">${vectorReference(entry)}</g>`:`<text class="glyph-outline reference-glyph" x="50" y="48" text-anchor="middle" dominant-baseline="central" font-size="106" fill="#344a45" color="#344a45">${entry.character}</text>`;
 return `<aside class="model-panel"><div class="panel-heading"><h2>えらんだ おてほん</h2><button class="text-button" data-action="hide-model">とじる ×</button></div><div class="model-canvas"><svg id="model-svg" viewBox="-12 -12 124 124" preserveAspectRatio="xMidYMid meet" aria-label="${model}の おてほん"><path d="M50 -12V112 M-12 50H112" stroke="#d3dcd5" stroke-width=".5" stroke-dasharray="2 2"/>${reference}${entry.displayPaths.map((d,i)=>`<path class="model-stroke" d="${d}" fill="none" stroke="#377d69" stroke-width="${entry.type==='small'?1.7:3.8}" stroke-linejoin="round" stroke-linecap="round" opacity="0"/><g class="stroke-number" opacity="0"><circle cx="${entry.strokes[i][0][0]-5}" cy="${entry.strokes[i][0][1]-5}" r="4.2" fill="#eeae59"/><text x="${entry.strokes[i][0][0]-5}" y="${entry.strokes[i][0][1]-3}" text-anchor="middle" font-size="6" fill="#493c2b">${i+1}</text></g>`).join('')}<circle id="pen-tip" r="2" fill="#d78c38" opacity="0"/></svg></div><button class="secondary" data-action="animate">▷ かきじゅんを みる</button><p>${entry.type==='small'?'みぎうえに、ちいさく。':entry.type==='long'?'たてがきの「ー」は うえから したへ。':entry.type==='voiced'?'さいごに てんや まるを かこう。':'おてほんは じぶんで えらべるよ。'}</p><button class="text-button" data-action="dictionary">ほかの もじを みる →</button></aside>`;
}

function collection() {
 return `<main class="word-selection"><button class="text-button back" data-action="words">← ステージをえらぶ</button><div class="page-title"><span class="title-emoji">${illustration('books')}</span><div><div class="eyebrow">かけた！を あつめよう</div><h1>${scriptName}コレクション</h1><p>${progress.completed.length} / 48 ことば</p></div></div>${stages.map(s=>`<section class="collection-section"><h2>${s.icon} ${s.name} <small>${s.words.filter(w=>completed(w.id)).length} / 6</small></h2><div class="collection-grid">${s.words.map(w=>`<button data-word="${w.id}" class="collection-item ${completed(w.id)?'collected':''}"><span>${completed(w.id)?w.icon:'?'}</span><strong>${completed(w.id)?w.text:"？？？"}</strong><small>${completed(w.id)?'✓ かけた！':'まだ みつけていないよ'}</small></button>`).join('')}</div></section>`).join('')}${allWordsCompleted(progress)?`<section class="word-complete-banner"><span aria-hidden="true">${illustration('trophy')}</span><div><h2>コンプリート！</h2><p>48この ことばを ぜんぶ きわめたよ！</p></div></section>`:''}<div id="stage-message" role="status"></div></main>`;
}
function settings() {
 return `<main class="settings"><div class="eyebrow">おうちの ひとと いっしょに</div><h1>せってい</h1><section class="settings-card"><label><span><strong>よみあげ</strong><small>ことばの よみを きく</small></span><input id="voice-setting" type="checkbox" ${progress.voice?'checked':''}></label><label><span><strong>こうかおん</strong><small>かけた ときの おと</small></span><input id="sound-setting" type="checkbox" ${progress.sound?'checked':''}></label><p>${recordedWordIds.length?'ことばの音声：VOICEVOX Nemo。あらかじめ作成した音声を再生します。ひともじ練習は端末の日本語音声を使います。':'読み上げにはブラウザーの音声機能を使います。日本語音声の有無や発音は端末により異なります。'}</p></section><section class="settings-card"><h2>保護者・先生の方へ</h2><p>ひらがな・カタカナそれぞれ全48語に対応しています。表示するお手本には、Chromebook・スマートフォン・PCで同じ字形になる Klee One SemiBold を使用し、見本として読みやすいよう輪郭を少し太くしています。書き順の案内と判定用中心線は、お手本の各画に沿うよう独自に調整しています。教科書体・筆順の監修や児童の入力による認識精度検証はまだ行っていません。</p><p>練習履歴はこのブラウザーに保存します。手書きの軌跡をサーバーへ送信する機能はありません。</p><p>文字・旧版参考データのライセンス：<a href="./THIRD_PARTY_NOTICES.md" target="_blank" rel="noopener">出典・変更点</a></p><button class="danger-button" data-action="reset">この きょうしつの きろくを けす</button></section></main>`;
}
function render() {
 modelPreview=false;previewPointer=null;previewKey=null;
 animationId++;
 app.innerHTML=(screen==='play'||screen==='title'||screen==='lesson'?'':header())+(screen==='lesson'?lessonScreen():screen==='title'?titleScreen():screen==='home'?home():screen==='practice-menu'?practiceMenu():screen==='characters'?characterPage():screen==='mastered'?characterPage(true):screen==='words'?wordStages():screen==='stage'?stageView():screen==='play'?play():screen==='collection'?collection():settings())+(storageFailed?'<p class="notice">きろくを ほぞんできません。この画面を閉じると進捗が失われる可能性があります。</p>':'')+(screen==='play'?'':footer());
 if(screen==='play' && !celebration)setupCanvas();
 if(screen==='play' && !celebration)kanaFontReady.then(()=>{if(screen==='play'&&!celebration)draw();});
 if(screen==='play' && celebration){window.scrollTo(0,0);document.querySelector('#completion-title')?.focus?.({preventScroll:true});}
}
function draw() {
 const canvas=document.querySelector('#writing'); if(!canvas)return;
 const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,600,600);ctx.save();ctx.scale(6,6);
 const entry=master[model];
 if((showGuide||modelPreview) && entry?.type==='small'){ctx.fillStyle='#f4eddc';ctx.fillRect(50,0,50,50);}
 ctx.strokeStyle='#cdd8d2';ctx.lineWidth=.5;ctx.setLineDash([2,2]);ctx.beginPath();ctx.moveTo(50,0);ctx.lineTo(50,100);ctx.moveTo(0,50);ctx.lineTo(100,50);ctx.stroke();ctx.setLineDash([]);
 const line=(s,color,width)=>{ctx.beginPath();s.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();};
 const reference=(referenceEntry,color)=>{ctx.fillStyle=color;if(referenceEntry.type==='long'){referenceEntry.outlinePaths.forEach(d=>ctx.fill(new Path2D(d)));return;}if(referenceEntry.reference==='paths'){ctx.strokeStyle=color;ctx.lineCap='round';ctx.lineJoin='round';referenceEntry.displayPaths.forEach((d,i)=>{ctx.lineWidth=referenceEntry.referenceStrokeWidths[i];ctx.stroke(new Path2D(d));});return;}ctx.font=kanaFont;ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeStyle=color;ctx.lineWidth=1.9;ctx.lineJoin='round';ctx.strokeText(referenceEntry.character,50,48);ctx.fillText(referenceEntry.character,50,48);};
 if(practiceScore!==null)reference(master[target],'#a4d7e9');
 const previewEntry=modelPreview?master[mode==='practice'?target:model]:entry;
 if((showGuide||modelPreview) && previewEntry && practiceScore===null)reference(previewEntry,'#dbe5dd');
 strokes.forEach(s=>line(s,practiceScore!==null?'#cf605b':slots[active]?'#377d69':'#334b49',3.2));
 if(current)line(current,'#334b49',3.2);
 ctx.restore();
}
function setupCanvas() {
 const canvas=document.querySelector('#writing');
 const point=e=>{const rect=canvas.getBoundingClientRect();return [Math.max(0,Math.min(100,(e.clientX-rect.left)/rect.width*100)),Math.max(0,Math.min(100,(e.clientY-rect.top)/rect.height*100))];};
 canvas.addEventListener('pointerdown',e=>{
   if(modelPreview || pointer!==null || !e.isPrimary || (e.pointerType==='mouse'&&e.button!==0) || slots[active] || celebration || pending || practiceScore!==null)return;
   e.preventDefault(); pointer=e.pointerId;canvas.setPointerCapture(pointer);current=[point(e)];draw();
 });
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer||!current)return;e.preventDefault();for(const event of e.getCoalescedEvents?.()||[e])current.push(point(event));draw();});
 canvas.addEventListener('pointerup',e=>{if(e.pointerId!==pointer||!current)return;current.push(point(e));strokes.push(current);current=null;pointer=null;draw();document.querySelector('.writing-panel .panel-heading span').textContent=`${strokes.length} かく`;});
 const cancel=()=>{current=null;pointer=null;draw();};
 canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',()=>{if(current)cancel();});draw();
}
function sound(kind='stroke') {
 if(!progress.sound)return;
 try{const Audio=window.AudioContext||window.webkitAudioContext;const context=new Audio();const gain=context.createGain();gain.connect(context.destination);gain.gain.setValueAtTime(.06,context.currentTime);const duration=kind==='complete'?1.1:.5;gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+duration);(kind==='complete'?[523,659,784,1047]:[523,659,784]).forEach((f,i)=>{const o=context.createOscillator();o.frequency.value=f;o.connect(gain);o.start(context.currentTime+i*(kind==='complete'?.15:.09));o.stop(context.currentTime+duration);});setTimeout(()=>context.close(),(duration+.2)*1000);}catch{}
}
function speak() {
 if(!progress.voice){feedback='よみあげは せっていで オンに できるよ。';render();return;}
 void voicePlayer.play({id:mode==='word'?word.id:undefined,text:mode==='practice'?target:word.text,onError:()=>{
  feedback='よみあげが できなかったよ。もういちど おしてね。';if(screen==='play')render();
 }});
}

function completeWord() {
 const result=evaluateWord(slots,word.text);
 celebration=false;
 if(result==='complete'){
   if(!completed(word.id))progress.completed.push(word.id);save();celebration=true;feedbackKind='success';feedback='できた！ コレクションに なかまいり！';sound('complete');
 }else if(result==='reorder'){feedbackKind='hint';feedback='もじは あっているけど…？ じゅんばんを かえてみよう！';}
 else if(result==='replace'){feedbackKind='hint';feedback='ちがう もじが あるよ。マスを えらんで かきなおそう。';}
 return result;
}
function confirmationPanel() {
 if(!pending)return '';
 return `<section class="character-confirmation" aria-label="かいた もじの かくにん"><h2>「${pending.character}」？</h2><p>これで あってる？</p><button class="primary" data-action="confirm-character">うん、これ！</button><button class="secondary" data-action="clear">ちがう、かきなおす</button></section>`;
}
function confirmCharacter() {
 if(!pending?.character || mode!=='word' || slots[active])return;
 const character=pending.character;
 const assessment=recognize(strokes);
 slots[active]={character,strokes:structuredClone(strokes),confirmed:true,handwritingPassed:assessment.ok&&assessment.character===character};
 pending=null;selectedSlot=null;resetModelHelp();
 const result=completeWord();
 if(result==='incomplete'){
  feedback='もじを おいたよ。つぎの マスへ。';feedbackKind='';
  active=slots.findIndex(s=>!s);strokes=[];
 }
 render();announce(feedback);
}
function judge() {
 if(current || slots[active] || celebration || pending)return;
 if(mode==='word'){
  if(!strokes.length){feedback='マスに もじを かいてみよう';feedbackKind='';render();return;}
  const candidates=suggestCharacters(strokes);
  if(!candidates.length){feedback=failedAttempt('わからなかったよ。もういちど かいてみよう。');feedbackKind='';render();return;}
  pending={character:candidates[0].character};
  feedback='';feedbackKind='';render();document.querySelector('.character-confirmation')?.scrollIntoView?.({block:'center',behavior:'smooth'});announce(pending.character?'「'+pending.character+'」？':'なんの もじを かいた？');return;
 }
 if(!strokes.length){feedback='マスに もじを かいてみよう';render();return;}
 practiceScore=gradeHandwriting(strokes,target);
 progress.bestScores[target]=Math.max(progress.bestScores[target]??0,practiceScore);
 if(practiceScore>=HANAMARU_SCORE){
  resetModelHelp();if(!progress.practiced.includes(target))progress.practiced.push(target);
  sound('complete');feedback=practiceScore>=DOUBLE_HANAMARU_SCORE?'はなまる ふたつ！ おてほんに そっくり！':'はなまる！ おてほんに そっくり！';feedbackKind='success';
 }else{feedback=failedAttempt(`かさねて みくらべよう。${HANAMARU_SCORE}てんで はなまる！`);feedbackKind='hint';}
 if(lesson!==null&&practiceScore>=70){lessonFailures=0;lastLessonFailure=null;}
 if(lesson!==null&&practiceScore<HANAMARU_SCORE){feedback=practiceScore>=70?`よく できたのう！ つぎへ すすめるぞ。${HANAMARU_SCORE}点 いじょうで はなまるじゃ。`:'おてほんと かさねて みよう。「けす」で もういちど！ 70点 いじょうで つぎへ すすめるぞ。';feedbackKind=practiceScore>=70?'success':'hint';}
 save();render();announce(practiceScore+'点！ '+feedback);
}

function selectSlot(i) {
 if(i!==active)resetModelHelp();
 pending=null;
 if(!slots[i]){active=i;selectedSlot=null;strokes=[];}
 else if(selectedSlot!==null&&selectedSlot!==i){[slots[selectedSlot],slots[i]]=[slots[i],slots[selectedSlot]];selectedSlot=null;active=i;strokes=structuredClone(slots[i].strokes);completeWord();}
 else{selectedSlot=selectedSlot===i?null:i;active=i;strokes=structuredClone(slots[i].strokes);}
 render();
}
function dictionary() {
 if(lesson!==null&&mode==='practice'){lessonHelp();return;}
 if(mode==='practice'&&screen==='play'){masteryList();return;}
 const dialog=document.createElement('dialog');dialog.className='dictionary-dialog';
 dialog.innerHTML=`<div class="dialog-heading"><div><span class="eyebrow">${scriptName} じてん</span><h2>おてほんを えらぼう</h2></div><button class="icon-button" data-close aria-label="とじる">×</button></div><p>もじを えらぶと、よこに おてほんが でるよ。</p><div class="dictionary-grid">${dictionaryCharacters.map(c=>`<button data-model="${c}" ${!master[c]?'disabled':''} aria-label="${c+(!master[c]?' じゅんびちゅう':'')}" class="${c===model?'selected':''}">${glyph(c)}</button>`).join('')}</div>`;
 document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());
 dialog.addEventListener('click',e=>{const b=e.target.closest('[data-model]');if(b && master[b.dataset.model]){if(model!==b.dataset.model)resetModelHelp();model=b.dataset.model;dialog.close();render();}});dialog.showModal();
}
async function animate() {
 const id=++animationId;
 const paths=[...document.querySelectorAll('.model-stroke')];
 const outlines=[...document.querySelectorAll('.glyph-outline')];
 const numbers=[...document.querySelectorAll('.stroke-number')];
 const pen=document.querySelector('#pen-tip');
 for(const p of outlines)p.setAttribute('opacity','.12');
 for(const p of paths){const length=p.getTotalLength();p.style.strokeDasharray=length;p.style.strokeDashoffset=length;p.setAttribute('opacity','1');}
 for(const p of numbers)p.setAttribute('opacity','0');
 for(let i=0;i<paths.length;i++){
  if(id!==animationId)return;
  const path=paths[i],length=path.getTotalLength();numbers[i].setAttribute('opacity','1');
  pen.setAttribute('opacity','1');
  await new Promise(resolve=>{
   let start;
   const tick=now=>{if(id!==animationId){resolve();return;}start??=now;const t=Math.min(1,(now-start)/1000);path.style.strokeDashoffset=length*(1-t);const p=path.getPointAtLength(length*t);pen.setAttribute('cx',p.x);pen.setAttribute('cy',p.y);if(t<1)requestAnimationFrame(tick);else resolve();};
   requestAnimationFrame(tick);
  });
 }
 if(id===animationId){pen.setAttribute('opacity','0');for(const p of outlines)p.setAttribute('opacity','1');for(const p of paths)p.setAttribute('opacity','0');}
}
app.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b || b.disabled)return;
 if(b.dataset.lessonSlot!==undefined){lessonSwap(Number(b.dataset.lessonSlot));return;}
 if(b.dataset.language){switchClassroom(b.dataset.language);return;}
 if(b.dataset.stage){stageId=Number(b.dataset.stage);go('stage');return;}
 if(b.dataset.word){const w=words.find(w=>w.id===b.dataset.word);if(supported(w)){stageId=Number(w.id.split('-')[0]);startWord(w);}else{const note=document.querySelector('#stage-message');if(note){note.className='notice';note.textContent='この ことばは じゅんびちゅうだよ。「のりもの」に あそべる えが あるよ。';note.scrollIntoView({block:'nearest',behavior:'smooth'});}}return;}
 if(b.dataset.practice){startPractice(b.dataset.practice);return;}
 if(b.dataset.slot!==undefined){selectSlot(Number(b.dataset.slot));return;}
 switch(b.dataset.action){
  case 'lesson-start':switchClassroom('hiragana');lesson=0;lessonOrder=['い','ご','ち'];lessonSelected=null;go('lesson');break;
  case 'lesson-exit':go('title');break;
  case 'lesson-begin':if(lesson<2)startPractice(['し','い'][lesson]);else startWord(words.find(w=>w.text==='いちご'));break;
  case 'lesson-next':if(lesson<2&&(practiceScore===null||practiceScore<70))return;if(lesson===2&&!celebration)return;lesson++;go('lesson');break;
  case 'lesson-help':lessonHelp();break;
  case 'lesson-model':if(lesson===null)return;if(mode==='practice'){model=target;resetModelHelp();render();}else dictionary();break;
  case 'title':go('title');break;case 'words':go('words');break;case 'practice-menu':go('practice-menu');break;case 'characters':go('characters');break;case 'mastered':go('mastered');break;case 'home':go('home');break;case 'collection':go('collection');break;case 'settings':go('settings');break;
  case 'next-word':nextWord();break;
  case 'repeat-exercise':if(mode==='word')startWord(word);else startPractice(target);break;
  case 'stage-back':go('stage');break;case 'rocket':stageId=4;startWord(words.find(w=>w.text==='ロケット'));break;
  case 'mastery-list':masteryList();break;case 'practice':startPractice();break;case 'next-character':startPractice(practiceCharacters()[(practiceCharacters().indexOf(target)+1)%practiceCharacters().length]);break;
  case 'hide-model':model=null;resetModelHelp();render();break;
  case 'confirm-character':confirmCharacter();break;
  case 'judge':judge();break;case 'speak':speak();break;case 'dictionary':dictionary();break;case 'animate':animate();break;
  case 'replace':case 'clear':{
   practiceScore=null;
   if(pending)failedAttempt('');
   if(slots[active])resetModelHelp();
   pending=null;slots[active]=null;strokes=[];current=null;pointer=null;celebration=false;lastFailedAttempt=null;lastLessonFailure=null;
   feedback=showGuide?'うすい もじを なぞってみよう。':'もういちど かいてみよう。';feedbackKind='';selectedSlot=null;render();break;
  }
  case 'undo':if(!slots[active]&&!celebration){practiceScore=null;feedback='';feedbackKind='';pending=null;strokes.pop();render();}break;
  case 'reset':{const d=document.createElement('dialog');d.innerHTML='<h2>きろくを けしますか？</h2><p>この きょうしつの コレクションと れんしゅうの きろくが きえます。もとには もどせません。</p><div class="dialog-actions"><button class="secondary" data-cancel>やめる</button><button class="danger-button" data-confirm>すべて けす</button></div>';document.body.append(d);d.querySelector('[data-cancel]').onclick=()=>d.close();d.querySelector('[data-confirm]').onclick=()=>{try{storage.removeItem(storageKey);progress=loadProgress(storage);storageFailed=false;}catch{storageFailed=true;}d.close();render();};d.addEventListener('close',()=>d.remove());d.showModal();break;}
 }
});
// A momentary preview: pointer/keyboard release, leaving the button or losing
// focus always hides it. Other fingers cannot write while the model is visible.
function endModelPreview(){if(!modelPreview)return;modelPreview=false;previewPointer=null;previewKey=null;draw();}
function beginModelPreview(){if(screen!=='play'||celebration||practiceScore!==null||pointer!==null||!master[mode==='practice'?target:model])return false;modelPreview=true;draw();return true;}
app.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-action="peek-model"]');if(!b||b.disabled||e.button!==0||modelPreview)return;e.preventDefault();if(beginModelPreview()){previewPointer=e.pointerId;b.setPointerCapture?.(e.pointerId);}});
app.addEventListener('pointermove',e=>{if(!modelPreview||e.pointerId!==previewPointer)return;const b=e.target.closest('[data-action="peek-model"]');if(!b){endModelPreview();return;}const r=b.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)endModelPreview();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])app.addEventListener(event,e=>{if(e.pointerId===previewPointer)endModelPreview();});
app.addEventListener('keydown',e=>{const b=e.target.closest('[data-action="peek-model"]');if(!b||b.disabled||![' ','Enter'].includes(e.key))return;e.preventDefault();if(!e.repeat&&!modelPreview&&beginModelPreview())previewKey=e.key;});
app.addEventListener('keyup',e=>{if(e.key===previewKey){e.preventDefault();endModelPreview();}});
app.addEventListener('focusout',endModelPreview);
window.addEventListener?.('blur',endModelPreview);
window.addEventListener?.('pointerup',e=>{if(e.pointerId===previewPointer)endModelPreview();});
window.addEventListener?.('keyup',e=>{if(e.key===previewKey)endModelPreview();});
document.addEventListener?.('visibilitychange',()=>{if(document.hidden)endModelPreview();});
app.addEventListener('change',e=>{if(e.target.id==='practice-select'){startPractice(e.target.value);return;}if(e.target.id==='voice-setting'){progress.voice=e.target.checked;if(!progress.voice)voicePlayer.stop();save();}if(e.target.id==='sound-setting'){progress.sound=e.target.checked;save();}});
let dragged=null;
app.addEventListener('dragstart',e=>{const b=e.target.closest('[data-slot]');if(!b)return;dragged=Number(b.dataset.slot);e.dataTransfer.setData('text/plain',String(dragged));});
app.addEventListener('dragover',e=>{if(e.target.closest('[data-slot]'))e.preventDefault();});
app.addEventListener('drop',e=>{const b=e.target.closest('[data-slot]');if(!b||dragged===null)return;e.preventDefault();const to=Number(b.dataset.slot);pending=null;if(to!==dragged){resetModelHelp();[slots[to],slots[dragged]]=[slots[dragged],slots[to]];active=to;strokes=slots[to]?structuredClone(slots[to].strokes):[];selectedSlot=null;completeWord();render();}dragged=null;});
app.addEventListener('dragend',()=>{dragged=null;});
render();


function flowerCount(score){
 return score>=DOUBLE_HANAMARU_SCORE?2:score>=HANAMARU_SCORE?1:0;
}
function flower(character,score=progress.bestScores[character]){
 const count=flowerCount(score);
 if(!count)return '';
 const stamp=`<path d="M30 8C36-2 43 5 43 12C55 7 59 17 52 23C65 29 57 39 50 39C55 52 43 56 37 49C31 62 21 55 21 48C9 54 3 43 11 37C-1 31 5 21 12 21C7 10 18 4 24 12Q26 7 30 8M20 20C35 8 50 25 40 39C30 52 12 36 22 25C30 15 43 29 33 35Q24 40 25 31" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
 return `<svg class="hanamaru ${count===2?"double-flower":""}" viewBox="0 0 ${count*60} 60" role="img" aria-label="はなまる ${count}つ">${stamp}${count===2?`<g transform="translate(60)">${stamp}</g>`:""}</svg>`;
}
function masteryList(){
 const dialog=document.createElement('dialog');dialog.className='mastery-dialog';
 dialog.innerHTML=`<div class="dialog-heading"><h2>ひともじをきわめる</h2><button class="icon-button" data-close aria-label="とじる">×</button></div><p>${HANAMARU_SCORE}てんで はなまる、${DOUBLE_HANAMARU_SCORE}てんで ふたつ！</p><div class="mastery-grid">${practiceCharacters().map(c=>`<button data-character="${c}" aria-label="${c} ${progress.bestScores[c]??'未採点'}${(progress.bestScores[c]??0)>=HANAMARU_SCORE?` はなまる ${flowerCount(progress.bestScores[c])}つ`:''}"><span>${glyph(c)}</span>${flower(c)}<small>${progress.bestScores[c]===undefined?'―':progress.bestScores[c]+'点'}</small></button>`).join('')}</div>`;
 document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());
 dialog.addEventListener('click',e=>{const b=e.target.closest('[data-character]');if(b){dialog.close();startPractice(b.dataset.character);}});dialog.showModal();
}

const lessonTexts=[
 ['「し」を かいてみよう', 'わしは つるせんにんじゃ。まずは「ひともじをきわめる」じゃよ。おてほんを みて「し」を かき、「できた！」を おしてみよう。', `かいた あとは、おてほんと かさねて 点数が でるぞ。れんしゅうは 70点 いじょうで つぎへ すすめるぞ。${HANAMARU_SCORE}点で はなまる、${DOUBLE_HANAMARU_SCORE}点で ふたつじゃ！`],
 ['つぎは「い」じゃ', '「い」は ふたつの 線で かくぞ。「かきじゅんを みる」で 筆の うごきを たしかめてみよう。', '「けす」で もういちど ためせるぞ。ひともじでは、失敗しても 自動で なぞり線は でないよ。おてほんと かさねて くらべよう。'],
 ['「いちご」を かいてみよう', 'こんどは「ことばをきわめる」じゃ。えを みて、ひともじずつ かこう。「これで あってる？」と きかれたら、自分の かいた もじか たしかめるのじゃ。', 'むずかしい ときは「おてほん」から もじを えらぼう。同じ おてほんを みても 2回 うまくいかなかったら、3回目は うすい もじを なぞれるぞ。「けす」を おして ためそう。'],
 ['じゅんばんも かえられるぞ', 'これは ならべかえの おためしじゃ。「い・ご・ち」を「い・ち・ご」に なおそう。', '「ご」の マスと「ち」の マスを 順に おしてみよう。ことばの れんしゅうでも、かいた マスを ふたつ おすか、ドラッグすると いれかえられるぞ。'],
 ['れんしゅう コンプリート！', 'よく がんばったのう！「し」「い」と「いちご」、ならべかえも できたね。', 'つぎは すきな きょうしつへ いってみよう。わからない ときは、また わしと れんしゅうするのじゃ。']
];
function sagePortrait(){return '<span class="sage-portrait" role="img" aria-label="つるせんにん"></span>';}
function lessonCoach(){
 const struggling=lessonFailures>=2&&!showGuide;
 const advice=showGuide?'うすい もじを なぞってみよう！':struggling?(model?'おてほんを よく みて、ゆっくり かこう。「かきじゅん」も みてみよう。':'むずかしい ときは「おてほん」を みて かいてみよう。'):lesson<2?`「${['し','い'][lesson]}」を かいて「できた！」じゃ。`:'ひともじずつ かいて、たしかめるのじゃ。';
 return `<aside class="lesson-coach">${sagePortrait()}<p aria-live="polite"><strong>つるせんにん · ${lesson+1}/4</strong>${advice}</p><button class="text-button" data-action="${struggling?(model?'animate':'lesson-model'):'lesson-help'}">${struggling?(model?'かきじゅん':'おてほんを みる'):'おしえて'}</button></aside>`;
}
function lessonScreen(){const [title,intro,tip]=lessonTexts[lesson];return `<main class="lesson-page"><button class="text-button" data-action="lesson-exit">← タイトル</button><section class="sage-lesson">${sagePortrait()}<div class="sage-speech"><span class="eyebrow">つるせんにんの れんしゅう · ${Math.min(lesson+1,4)}/4</span><h1>${title}</h1><p>${intro}</p><p class="lesson-tip">${tip}</p>${lesson===3?`<div class="lesson-swap" aria-label="ならべかえの おためし">${lessonOrder.map((c,i)=>`<button data-lesson-slot="${i}" class="${lessonSelected===i?'selected':''}" aria-label="${i+1}ばんめ ${c}">${c}</button>`).join('')}</div>`:lesson===4?'<button class="primary" data-action="lesson-exit">タイトルへ →</button>':'<button class="primary" data-action="lesson-begin">やってみよう →</button>'}</div></section></main>`;}
function lessonHelp(){const d=document.createElement('dialog');d.className='lesson-help';d.innerHTML=`${sagePortrait()}<h2>つるせんにんから</h2><p>${lessonTexts[lesson][1]}</p><p>${lessonTexts[lesson][2]}</p>${lesson===2?'<p>じゅんばんを まちがえても だいじょうぶ。かいた マスを ふたつ おすと いれかえられるぞ。</p>':''}<button class="primary" data-close>わかった！</button>`;document.body.append(d);d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('close',()=>d.remove());d.showModal();}
function lessonWordReward(){return `<main class="lesson-page"><section class="sage-lesson">${sagePortrait()}<div class="sage-speech"><h1>「いちご」が かけたね！</h1><div class="lesson-fruit">${word.icon}</div><p>よく できたのう。さいごに、もじの ならべかえも やってみよう。</p><button class="primary" data-action="lesson-next">ならべかえへ →</button><button class="text-button" data-action="lesson-exit">タイトルへ</button></div></section></main>`;}
function lessonSwap(i){if(lesson!==3||!Number.isInteger(i)||i<0||i>2)return;if(lessonSelected===null){lessonSelected=i;}else{[lessonOrder[lessonSelected],lessonOrder[i]]=[lessonOrder[i],lessonOrder[lessonSelected]];lessonSelected=null;if(lessonOrder.join('')==='いちご'){lesson=4;sound('complete');}}render();}
