export const illustration = id => `<svg class="word-illustration" viewBox="0 0 128 128" aria-hidden="true" focusable="false"><use href="./assets/hiragana-illustrations.svg#${id}"></use></svg>`;
export const stages = [
 ['ごはん','#f5edd0',['たまごやき','みそしる','てんぷら','あげぱん','そば','ぎょうざ']],
 ['おやつ','#fae7da',['あめ','ぷりん','せんべい','だんご','びすけっと','じゃむ']],
 ['やさい・くだもの','#e5edd4',['いちご','じゃがいも','ぶどう','れんこん','かぼちゃ','きゅうり']],
 ['いきもの','#f5e4d6',['ねずみ','たぬき','へび','ぺんぎん','ぞう','にわとり']],
 ['からだ・みじたく','#e5e2f1',['はなぢ','ひざ','ゆび','ようふく','ぼうし','てぶくろ']],
 ['しぜん','#dceee9',['みかづき','かぜ','さくら','やま','はっぱ','どんぐり']],
 ['おうちのもの','#dfebf4',['ふとん','えんぴつ','ろうそく','なべ','ほうき','ぽすと']],
 ['のりもの・あそび','#f7e3e5',['ぴあの','こま','でんしゃ','じてんしゃ','きゅうきゅうしゃ','おもちゃ']],
].map(([name,color,list],i)=>({id:i+1,name,color,subtitle:'えを みて かいてみよう',icon:illustration(`${i+1}-1`),words:list.map((text,j)=>({id:`${i+1}-${j+1}`,text,icon:illustration(`${i+1}-${j+1}`)}))}));
export const words=stages.flatMap(s=>s.words);
export const dictionaryCharacters=[...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽっゃゅょ'];
