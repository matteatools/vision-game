(function (root) {
  'use strict';
  let ctx, muted = Save.muted(); const voices = new Set();
  let musicBuffer, musicSource, musicWanted = false;
  // A gently lopsided waltz: wooden melody, plucked bass, and soft offbeat chords.
  // Render once at 22 kHz so playback needs only one looping audio source.
  function makeMusic() {
    const sampleRate = 22050, beat = 60 / 88, bars = 16;
    const buffer = ctx.createBuffer(1, Math.ceil(bars * 3 * beat * sampleRate), sampleRate);
    const samples = buffer.getChannelData(0);
    const melody = [
      [64, 67, 69, 67, 64, 0], [62, 0, 60, 0, 0, 0],
      [65, 69, 72, 0, 69, 65], [64, 0, 62, 64, 0, 0],
      [64, 67, 72, 71, 69, 0], [67, 0, 64, 0, 62, 0],
      [65, 64, 62, 0, 59, 62], [60, 0, 0, 0, 0, 0],
      [67, 0, 64, 67, 69, 0], [72, 71, 69, 0, 67, 0],
      [69, 0, 65, 69, 72, 0], [71, 0, 67, 0, 62, 0],
      [64, 67, 69, 0, 67, 64], [65, 0, 64, 0, 62, 0],
      [62, 65, 67, 0, 59, 0], [60, 0, 0, 0, 0, 0]
    ];
    const chords = [[48, 60, 64, 67], [45, 60, 64, 69], [41, 60, 65, 69], [43, 59, 62, 67]];
    const harmony = [0, 1, 2, 3, 0, 1, 3, 0, 0, 1, 2, 3, 0, 2, 3, 0];
    function pluck(midi, start, duration, volume, wooden) {
      const frequency = 440 * Math.pow(2, (midi - 69) / 12);
      const offset = Math.round(start * sampleRate);
      const length = Math.floor(duration * sampleRate);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate, phase = 2 * Math.PI * frequency * t;
        const envelope = Math.min(1, t / .012) * Math.exp(-t * (wooden ? 9 : 6)) * Math.min(1, (duration - t) / .03);
        const tone = Math.sin(phase) + (wooden ? .22 : .1) * Math.sin(phase * 2) * Math.exp(-t * 16);
        samples[(offset + i) % samples.length] += tone * envelope * volume;
      }
    }
    melody.forEach((notes, bar) => {
      const start = bar * 3 * beat, chord = chords[harmony[bar]];
      pluck(chord[0], start, .42, .035, false);
      for (const pulse of [1, 2]) {
        chord.slice(1).forEach(note => pluck(note, start + pulse * beat + .025, .22, .009, false));
      }
      notes.forEach((note, step) => {
        if (note) pluck(note, start + step * beat / 2 + (step % 2 ? .035 : 0), .36, .027, true);
      });
    });
    return buffer;
  }
  async function startMusic() {
    musicWanted = true;
    await unlock();
    if (!musicWanted || muted || !ctx || ctx.state !== 'running' || musicSource) return;
    if (!musicBuffer) musicBuffer = makeMusic();
    musicSource = ctx.createBufferSource();
    musicSource.buffer = musicBuffer;
    musicSource.loop = true;
    musicSource.connect(ctx.destination);
    musicSource.start();
  }
  async function unlock() { if (muted) return; try { const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return; if (!ctx) ctx = new Audio(); if (ctx.state !== 'running') await ctx.resume(); } catch { ctx = null; } }
  function stop() {
    musicWanted = false;
    if (musicSource) { musicSource.stop(); musicSource.disconnect(); musicSource = null; }
    for (const v of voices) { try { v.stop(); } catch {} }
    voices.clear();
  }
  function note(freq, duration = .12, delay = 0, volume = .045, type = 'sine', endFreq) {
    if (!ctx || muted || ctx.state !== 'running' || voices.size > 12) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain(), t = ctx.currentTime + delay;
    osc.type = type; osc.frequency.setValueAtTime(freq, t); if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(volume, t + .008); gain.gain.exponentialRampToValueAtTime(.001, t + duration);
    osc.connect(gain); gain.connect(ctx.destination); voices.add(osc); osc.onended = () => { voices.delete(osc); osc.disconnect(); gain.disconnect(); }; osc.start(t); osc.stop(t + duration + .01);
  }
  function play(name) {
    if (name === 'select') note(430, .07, 0, .025, 'triangle');
    else if (name === 'match') [523, 659, 784].forEach((f, i) => note(f, .16, i * .055));
    else if (name === 'miss') note(260, .13, 0, .025, 'sine', 220);
    else if (name === 'cat') note(900, .48, 0, .04, 'triangle', 450);
    else if (name === 'baby') { note(480, .18, 0, .04, 'sine', 600); note(510, .22, .2, .035, 'sine', 360); }
    else if (name === 'ghost') note(460,.6,0,.025,'sine',310);
    else if (name === 'hole') note(150,.65,0,.025,'sine',65);
    else if (name === 'wizard') [660,830,990].forEach((f,i)=>note(f,.16,i*.06,.025));
    else if (name === 'devil') note(130,.45,0,.025,'triangle',90);
    else if (name === 'fairy') [880,1175,988].forEach((f,i)=>note(f,.18,i*.09,.02));
    else if (name === 'dragon') note(160,.35,0,.025,'triangle',230);
    else if (name === 'sneeze') { note(230,.10,0,.03,'triangle',350); note(180,.25,.09,.04,'sawtooth',60); }
    else if (name === 'win') [523, 659, 784, 1047].forEach((f, i) => note(f, .3, i * .1, .045, 'triangle'));
  }
  root.Sound = { unlock, play, stop, startMusic, get muted() { return muted; }, toggle() {
    const resumeMusic = musicWanted;
    muted = !muted;
    Save.setMuted(muted);
    if (muted) { stop(); musicWanted = resumeMusic; }
    else if (resumeMusic) startMusic();
    else unlock();
    return muted;
  } };
})(globalThis);
