/**
 * PianoWidget - Interactive Flat Upright Virtual Piano Component
 * Design matched to Figma (Nodes 515:2527, 515:2519, 515:2523)
 * Audio Engine: Soft, Intimate Dreamy Piano (Lower quiet volume, plush felt tone)
 * Typing Logic: Only progresses when the user types the correct character
 */

export function initPianoWidget(containerSelector = '#piano-component') {
  const container = typeof containerSelector === 'string' 
    ? document.querySelector(containerSelector) 
    : containerSelector;

  if (!container) return null;

  // MIDI Range: C3 (48) to C6 (84) - 3 Full Octaves, 37 keys
  const START = 48;
  const END = 84;
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Musical Sequence: Arpeggiated progression in G minor (128 notes)
  const SEQ = [
    81, 74, 70, 67,  79, 74, 70, 67,  78, 74, 70, 67,  79, 74, 70, 67,
    79, 72, 69, 65,  77, 72, 69, 65,  76, 72, 69, 65,  77, 72, 69, 65,
    77, 70, 67, 64,  76, 70, 67, 64,  75, 70, 67, 64,  76, 70, 67, 64,
    76, 69, 65, 62,  74, 69, 65, 62,  73, 69, 65, 62,  74, 69, 65, 62,
    81, 74, 70, 67,  79, 74, 70, 67,  78, 74, 70, 67,  79, 74, 70, 67,
    82, 75, 72, 69,  81, 75, 72, 69,  80, 75, 72, 69,  81, 75, 72, 69,
    84, 74, 70, 67,  82, 74, 70, 67,  81, 74, 70, 67,  82, 74, 70, 67,
    81, 70, 67, 64,  79, 70, 67, 64,  77, 70, 67, 64,  76, 70, 67, 64
  ];

  const TEXT = 'I play piano and violin, and I have played in orchestras and theater productions. I am now in the UCLA videogame music ensemble.';

  // DOM Elements
  const kb = container.querySelector('#piano-keyboard');
  const lyricsEl = container.querySelector('#piano-lyrics');
  const sheet = container.querySelector('#piano-sheet');
  const susBtn = container.querySelector('#piano-sus-btn');
  const resetBtn = container.querySelector('#piano-reset-btn');
  const volSlider = container.querySelector('#piano-vol-slider');
  const nextKeyHint = container.querySelector('#piano-next-key');

  // Populate Lyrics (Clean flat text matching Figma)
  lyricsEl.innerHTML = '';
  const charSpans = [...TEXT].map((char, index) => {
    const span = document.createElement('span');
    span.className = 'piano-char';
    span.textContent = char;
    span.dataset.idx = index;
    lyricsEl.appendChild(span);
    return span;
  });

  // Calculate total white keys W (22 white keys across 3 octaves)
  let W = 0;
  for (let m = START; m <= END; m++) {
    if (!NAMES[m % 12].includes('#')) W++;
  }

  // Generate Clean Flat Piano Keys
  kb.innerHTML = '';
  const keyEls = {};
  let wi = 0;

  for (let m = START; m <= END; m++) {
    const noteName = NAMES[m % 12];
    const isBlack = noteName.includes('#');
    const key = document.createElement('div');
    key.dataset.m = m;

    if (isBlack) {
      key.className = 'piano-key black-key';
      key.style.left = (wi / W * 100) + '%';
    } else {
      key.className = 'piano-key white-key';
      wi++;
    }

    kb.appendChild(key);
    keyEls[m] = key;
  }

  // =========================================================================
  // Soft, Quiet & Dreamy Audio Engine (Web Audio API)
  // =========================================================================
  let ctx = null;
  let masterGain = null;
  let reverbNode = null;
  const voices = {};
  const held = new Set();
  let latch = false;
  let sustain = false;

  function createDreamyReverb(audioCtx) {
    const sampleRate = audioCtx.sampleRate;
    const duration = 3.2;
    const decay = 2.0;
    const length = Math.floor(sampleRate * duration);
    const buffer = audioCtx.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      const envelope = Math.exp(-t * decay);
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }

    const convolver = audioCtx.createConvolver();
    convolver.buffer = buffer;
    return convolver;
  }

  function initAudio() {
    if (ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();

    // Gentle dynamics compressor
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-18, ctx.currentTime);
    comp.knee.setValueAtTime(30, ctx.currentTime);
    comp.ratio.setValueAtTime(3, ctx.currentTime);
    comp.attack.setValueAtTime(0.005, ctx.currentTime);
    comp.release.setValueAtTime(0.25, ctx.currentTime);

    masterGain = ctx.createGain();
    // Default quieter level: 0.50
    masterGain.gain.value = volSlider ? parseFloat(volSlider.value) : 0.50;

    // Dry & Dreamy Reverb Paths
    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.60;

    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.40;

    reverbNode = createDreamyReverb(ctx);

    masterGain.connect(dryGain);
    masterGain.connect(reverbNode);
    reverbNode.connect(wetGain);

    dryGain.connect(comp);
    wetGain.connect(comp);
    comp.connect(ctx.destination);
  }

  // Soft Mellow Harmonic Partials
  const DREAMY_PARTIALS = [
    [1.000, 0.85,  -1.8, 1.00, 'sine'],
    [1.000, 0.75,   1.8, 0.98, 'sine'],
    [1.000, 0.28,   0.0, 0.92, 'triangle'],
    [2.000, 0.28,   0.7, 0.75, 'sine'],
    [3.001, 0.10,  -0.8, 0.50, 'sine'],
    [4.002, 0.04,   1.2, 0.32, 'sine']
  ];

  function kill(m, releaseTime = 0.50) {
    const v = voices[m];
    if (!v) return;
    delete voices[m];
    if (!ctx) return;
    const now = ctx.currentTime;

    v.voiceGain.gain.cancelScheduledValues(now);
    v.voiceGain.gain.setValueAtTime(v.voiceGain.gain.value, now);
    v.voiceGain.gain.setTargetAtTime(0, now, releaseTime / 3);

    v.oscillators.forEach(osc => {
      try { osc.stop(now + releaseTime + 0.2); } catch (e) {}
    });
  }

  function play(m) {
    initAudio();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    kill(m, 0.08);
    held.delete(m);

    const now = ctx.currentTime;
    const f0 = 440 * (2 ** ((m - 69) / 12));
    const baseDecay = Math.max(2.0, 5.0 - (m - 48) * 0.08);

    const voiceGain = ctx.createGain();
    const lowpass = ctx.createBiquadFilter();

    // Warm, rounded lowpass filter
    lowpass.type = 'lowpass';
    const initialCutoff = Math.min(3200, f0 * 4.2);
    const sustainedCutoff = Math.max(600, f0 * 1.6);
    lowpass.frequency.setValueAtTime(initialCutoff, now);
    lowpass.frequency.setTargetAtTime(sustainedCutoff, now + 0.03, 0.45);
    lowpass.Q.setValueAtTime(0.6, now);

    // Quieter, gentle plush gain envelope
    voiceGain.gain.setValueAtTime(0, now);
    voiceGain.gain.linearRampToValueAtTime(0.15, now + 0.018); // 18ms soft attack
    voiceGain.gain.setTargetAtTime(0.09, now + 0.018, 0.12);
    voiceGain.gain.setTargetAtTime(0, now + 0.35, baseDecay);

    // Soft Felt Tap
    const hammerOsc = ctx.createOscillator();
    const hammerGain = ctx.createGain();
    hammerOsc.type = 'sine';
    hammerOsc.frequency.setValueAtTime(f0 * 1.4, now);
    hammerGain.gain.setValueAtTime(0.02, now);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    hammerOsc.connect(hammerGain);
    hammerGain.connect(voiceGain);
    hammerOsc.start(now);
    hammerOsc.stop(now + 0.04);

    // Harmonic Oscillators
    const oscillators = [hammerOsc];
    DREAMY_PARTIALS.forEach(([mul, amp, detuneCents, decayMul, wave]) => {
      const osc = ctx.createOscillator();
      const pGain = ctx.createGain();

      osc.type = wave;
      osc.frequency.setValueAtTime(f0 * mul, now);
      osc.detune.setValueAtTime(detuneCents, now);

      pGain.gain.setValueAtTime(amp, now);
      pGain.gain.setTargetAtTime(0.0001, now + 0.03, baseDecay * decayMul);

      osc.connect(pGain);
      pGain.connect(lowpass);

      osc.start(now);
      osc.stop(now + baseDecay * 1.5);
      oscillators.push(osc);
    });

    lowpass.connect(voiceGain);
    voiceGain.connect(masterGain);

    voices[m] = { voiceGain, oscillators };
  }

  function stop(m) {
    if (sustain) {
      held.add(m);
    } else {
      kill(m, 0.50);
    }
  }

  function setSustain(state) {
    sustain = state;
    if (susBtn) {
      susBtn.setAttribute('aria-pressed', sustain ? 'true' : 'false');
      susBtn.classList.toggle('active', sustain);
    }
    if (!sustain) {
      held.forEach(m => kill(m, 0.55));
      held.clear();
    }
  }

  // Active key state (Figma Variant2)
  function press(m) {
    play(m);
    if (keyEls[m]) keyEls[m].classList.add('active');
  }

  function lift(m) {
    if (keyEls[m]) keyEls[m].classList.remove('active');
    stop(m);
  }

  // Lyrics & Sequence Progression
  let step = 0;

  function updateNextHint() {
    if (!nextKeyHint) return;
    const nextChar = TEXT[step % TEXT.length];
    if (nextChar === ' ') {
      nextKeyHint.textContent = 'Space';
    } else {
      nextKeyHint.textContent = nextChar;
    }
  }

  function showText(n) {
    charSpans.forEach((sp, i) => {
      sp.classList.toggle('done', i < n);
      sp.classList.toggle('cur', i === n);
    });
    updateNextHint();
  }

  function advanceSequence() {
    const m = SEQ[step % SEQ.length];
    step++;
    press(m);
    setTimeout(() => lift(m), 260);

    const textIndex = (step - 1) % TEXT.length;
    showText(textIndex + 1);
  }

  function resetSequence() {
    step = 0;
    showText(0);
  }

  // Initial State: First letter 'I' active
  showText(0);

  // Mouse / Pointer Interaction on Keys (Free-play anytime)
  const ptr = new Map();
  const keyAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    return el ? el.closest('.piano-key') : null;
  };

  kb.addEventListener('pointerdown', e => {
    const k = e.target.closest('.piano-key');
    if (!k) return;
    e.preventDefault();
    initAudio();
    kb.setPointerCapture(e.pointerId);
    const m = +k.dataset.m;
    ptr.set(e.pointerId, m);
    press(m);
  });

  kb.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) return;
    const k = keyAt(e.clientX, e.clientY);
    if (!k) return;
    const m = +k.dataset.m;
    const old = ptr.get(e.pointerId);
    if (m !== old) {
      lift(old);
      ptr.set(e.pointerId, m);
      press(m);
    }
  });

  const endPointer = e => {
    if (ptr.has(e.pointerId)) {
      lift(ptr.get(e.pointerId));
      ptr.delete(e.pointerId);
    }
  };
  kb.addEventListener('pointerup', endPointer);
  kb.addEventListener('pointercancel', endPointer);

  // Clicking on Sheet Music advances the sequence
  if (sheet) {
    sheet.addEventListener('click', () => {
      initAudio();
      advanceSequence();
    });
  }

  // Keyboard Typing Interaction: STRICT CHARACTER MATCHING
  const down = new Set();
  const keyMap = {};

  const handleKeyDown = e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(e.key) || /^F\d+$/.test(e.key)) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    e.preventDefault();
    initAudio();

    if (down.has(e.code)) return;

    // Check if the pressed key matches the next required character
    const expectedChar = TEXT[step % TEXT.length];
    let isMatch = false;

    if (expectedChar === ' ') {
      isMatch = (e.code === 'Space' || e.key === ' ');
    } else if (/[a-zA-Z]/.test(expectedChar)) {
      isMatch = (e.key.toLowerCase() === expectedChar.toLowerCase());
    } else {
      // Punctuation like commas or periods
      isMatch = (e.key === expectedChar);
    }

    if (!isMatch) {
      // DO NOT PROGRESS IF WRONG KEY! Give soft shake animation on current letter
      const curEl = charSpans[step % TEXT.length];
      if (curEl) {
        curEl.classList.remove('shake');
        void curEl.offsetWidth; // retrigger CSS animation
        curEl.classList.add('shake');
      }
      return;
    }

    // Correct character pressed! Progress note and letter
    down.add(e.code);
    const m = SEQ[step % SEQ.length];
    step++;
    keyMap[e.code] = m;
    press(m);

    const textIndex = (step - 1) % TEXT.length;
    showText(textIndex + 1);
  };

  const handleKeyUp = e => {
    if (down.has(e.code)) {
      down.delete(e.code);
      if (keyMap[e.code] !== undefined) {
        lift(keyMap[e.code]);
        delete keyMap[e.code];
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  window.addEventListener('blur', () => {
    down.forEach(code => {
      if (keyMap[code] !== undefined) lift(keyMap[code]);
    });
    down.clear();
    setSustain(false);
  });

  // Toolbar Controls
  if (susBtn) {
    susBtn.addEventListener('click', () => {
      initAudio();
      latch = !latch;
      setSustain(latch);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetSequence();
    });
  }

  if (volSlider) {
    volSlider.value = 0.50; // default quieter volume
    volSlider.addEventListener('input', () => {
      if (masterGain) {
        masterGain.gain.value = parseFloat(volSlider.value);
      }
    });
  }

  return {
    destroy() {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (ctx) {
        try { ctx.close(); } catch (e) {}
      }
    },
    advance: advanceSequence,
    reset: resetSequence,
    playNote: press,
    stopNote: lift
  };
}

// Auto-initialize if running directly
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.querySelector('#piano-component');
    if (el) initPianoWidget(el);
  });
}
