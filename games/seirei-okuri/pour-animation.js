// Presentation only: commit the existing reducer action once the pour ends.
async function animatePour(source, target, count, departing, settled) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        LanternAudio.effect('land');
        if(departing.length)LanternAudio.effect('send');
        return;
    }
    const layer = document.createElement('div');
    layer.className = 'pour-layer';
    document.body.append(layer);
    const a = source.getBoundingClientRect(), b = target.getBoundingClientRect();
    const bottle = source.cloneNode(true);
    bottle.classList.remove('selected');
    bottle.classList.add('pour-bottle');
    Object.assign(bottle.style, {position:'absolute',left:`${a.left}px`,top:`${a.top}px`,width:`${a.width}px`,height:`${a.height}px`,margin:0,transformOrigin:'50% 0'});
    layer.append(bottle);
    source.style.visibility = 'hidden';
    const souls = [...bottle.querySelectorAll('.ball')];
    // Tip toward the screen's center and shrink the lifted bottle so it stays visible.
    const direction = b.left + b.width/2 > innerWidth/2 ? -1 : 1;
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const mouthY = Math.max(18 + a.height*.55*.38, b.top - 24);
    const dy = mouthY - a.top;
    const tilted = `translate(${dx}px,${dy}px) rotate(${-direction*112}deg) scale(.55)`;
    const play = (el, frames, duration) => el.animate(frames,{duration,easing:'ease-in-out',fill:'forwards'}).finished;
    const hidden = [source];
    try {
        await play(bottle,[{transform:'none'},{transform:`translate(0,-18px) rotate(${-direction*8}deg)`,offset:.25},{transform:tilted}],320);
        for(let i=0;i<count;i++) {
            const original = souls[souls.length-1-i];
            const spirit = original.cloneNode(true);
            spirit.classList.remove('ball-selected');
            spirit.classList.add('pour-spirit');
            const cell = target.querySelector('.ball,.empty-slot').getBoundingClientRect();
            const size = cell.height;
            const occupied = target.querySelectorAll('.ball').length;
            original.style.visibility = 'hidden';
            Object.assign(spirit.style,{position:'absolute',left:`${b.left+(b.width-cell.width)/2}px`,top:`${mouthY}px`,width:`${cell.width}px`,height:`${size}px`,margin:0});
            layer.append(spirit);
            const end = target.querySelector('.ball-stack').getBoundingClientRect().bottom-(occupied+i+1)*size;
            await play(spirit,[{transform:'translateY(0) scale(.55)',opacity:0},{transform:'translateY(4px) scale(.8)',opacity:1,offset:.15},{transform:`translateY(${end-mouthY}px) scale(1)`,opacity:1}],150);
            LanternAudio.effect('land');
        }
        await play(bottle,[{transform:tilted},{transform:'none'}],220);
        const colorOf = node => [...node.classList].find(name=>/^ball-(red|blue|yellow|white|black|purple)$/.test(name)).slice(5);
        const existing = [...target.querySelectorAll('.ball')].map(colorOf);
        const incoming = souls.slice(-count).reverse().map(colorOf);
        const rawTarget = [...existing, ...incoming];
        const reorders = rawTarget.some((color,i)=>color!==settled.target[i]);
        // Land first, then float/sink. Both copies carry the true post-move contents.
        if (departing.length || reorders) {
            const copies = [source, target].map((node, index) => {
                const rect = node.getBoundingClientRect();
                const copy = node.cloneNode(true);
                copy.classList.remove('selected');
                copy.classList.add('pour-bottle');
                const stack = copy.querySelector('.ball-stack');
                const capacity = stack.children.length;
                stack.replaceChildren();
                const colors = index === 0 ? settled.source : rawTarget;
                for (let i=0;i<capacity;i++) {
                    const cell = document.createElement('div');
                    cell.className = i < colors.length ? `ball ball-${colors[i]}` : 'empty-slot';
                    stack.append(cell);
                }
                Object.assign(copy.style, {position:'absolute',left:`${rect.left}px`,top:`${rect.top}px`,
                    width:`${rect.width}px`,height:`${rect.height}px`,visibility:'visible',margin:0});
                layer.append(copy);
                node.style.visibility = 'hidden';
                hidden.push(node);
                return {node, copy};
            });
            bottle.remove();
            layer.querySelectorAll('.pour-spirit').forEach(node=>node.remove());
            if (reorders) {
                const stack = copies[1].copy.querySelector('.ball-stack');
                const cells = [...stack.querySelectorAll('.ball')];
                const positions = new Map(cells.map(cell=>[cell,cell.getBoundingClientRect().top]));
                const ordered = cells.slice(0,existing.length);
                for(const cell of cells.slice(existing.length)) {
                    const color = colorOf(cell);
                    if(color === 'black') ordered.unshift(cell);
                    else if(color === 'white') ordered.push(cell);
                    else {
                        const firstWhite = ordered.findIndex(node=>colorOf(node)==='white');
                        ordered.splice(firstWhite < 0 ? ordered.length : firstWhite,0,cell);
                    }
                }
                const empty = [...stack.querySelectorAll('.empty-slot')];
                stack.replaceChildren(...ordered,...empty);
                let floated=false,sank=false;
                await Promise.all(ordered.map(async cell=>{
                    const delta = positions.get(cell)-cell.getBoundingClientRect().top;
                    if(Math.abs(delta)<1) return;
                    const color = colorOf(cell);
                    const sinking = color === 'black' && delta < 0;
                    if(color==='white' && !floated){floated=true;LanternAudio.effect('float',{delay:.1});}
                    if(sinking && !sank){sank=true;LanternAudio.effect('sink',{delay:.434});}
                    cell.classList.add(color === 'white' ? 'soul-floating' : sinking ? 'soul-sinking' : 'soul-settling');
                    cell.style.transformOrigin='50% 90%';
                    const frames = sinking ? [
                        {transform:`translateY(${delta}px)`,offset:0,easing:'ease-in'},
                        {transform:'translateY(0) scale(1.08,.9)',offset:.76},
                        {transform:'translateY(-2px) scale(.98,1.02)',offset:.9},
                        {transform:'none',offset:1}
                    ] : [
                        {transform:`translateY(${delta}px)`},
                        {transform:'none'}
                    ];
                    // A short landed beat makes the special rule readable.
                    await cell.animate(frames,{duration:color==='white'?540:440,delay:100,
                        easing:color==='white'?'cubic-bezier(.22,.6,.35,1)':'ease-in-out',fill:'both'}).finished;
                    cell.classList.remove('soul-floating','soul-sinking','soul-settling');
                }));
            }
            if(departing.length)LanternAudio.effect('send');
            await Promise.all(copies.filter(({node})=>departing.includes(node)).map(async ({copy})=>{
                copy.classList.add('sending-away');
                await play(copy,[
                    {transform:'translateY(0)',opacity:1},
                    {transform:'translateY(-6px)',opacity:1,offset:.3},
                    {transform:'translateY(-64px)',opacity:0}
                ],760);
            }));
        }
    } finally {
        hidden.forEach(node=>node.style.visibility = '');
        layer.remove();
    }
}
