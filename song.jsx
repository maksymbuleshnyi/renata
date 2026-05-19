/* global React */
// ── Happy Birthday — synthesized for Renata ─────────────────────────────────
const { useState: useStateSong, useEffect: useEffectSong, useRef: useRefSong, useCallback: useCallbackSong } = React;

// Standard Happy Birthday in C major. [note, units] — 1 unit = eighth note.
const HB_NOTES = [
  // line 1: happy birthday to you
  ["G4", 1], ["G4", 1],
  ["A4", 2], ["G4", 2], ["C5", 2], ["B4", 4],
  // line 2: happy birthday to you
  ["G4", 1], ["G4", 1],
  ["A4", 2], ["G4", 2], ["D5", 2], ["C5", 4],
  // line 3: happy birthday dear NAME
  ["G4", 1], ["G4", 1],
  ["G5", 2], ["E5", 2], ["C5", 2], ["B4", 2], ["A4", 4],
  // line 4: happy birthday to you
  ["F5", 1], ["F5", 1],
  ["E5", 2], ["C5", 2], ["D5", 2], ["C5", 4],
];
const HB_LINE_COUNTS = [6, 6, 7, 6];

const HB_FREQ = {
  G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
};

function HappyBirthdaySong({ name, playKey }) {
  const ctxRef = useRefSong(null);
  const timersRef = useRefSong([]);
  const stopFnRef = useRefSong(null);
  const [playing, setPlaying] = useStateSong(false);
  const [lineIdx, setLineIdx] = useStateSong(-1);

  const stop = useCallbackSong(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (stopFnRef.current) { try { stopFnRef.current(); } catch (e) {} stopFnRef.current = null; }
    if (ctxRef.current) {
      try { ctxRef.current.close(); } catch (e) {}
      ctxRef.current = null;
    }
    setPlaying(false);
    setLineIdx(-1);
  }, []);

  const play = useCallbackSong(async () => {
    stop();
    let ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    } catch (e) { return; }
    ctxRef.current = ctx;
    try { await ctx.resume(); } catch (e) {}

    const tempo = 108;
    const unit = 60 / tempo / 2; // eighth-note seconds

    // Audio graph: master gain → low-pass → soft compressor → destination.
    const master = ctx.createGain();
    master.gain.value = 0.18;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3600;
    lp.Q.value = 0.5;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 2.5;
    comp.attack.value = 0.005;
    comp.release.value = 0.2;
    master.connect(lp);
    lp.connect(comp);
    comp.connect(ctx.destination);

    // Feedback delay tap for warmth/space
    const dly = ctx.createDelay();
    dly.delayTime.value = 0.24;
    const dlyGain = ctx.createGain();
    dlyGain.gain.value = 0.16;
    const dlyFB = ctx.createGain();
    dlyFB.gain.value = 0.24;
    const dlyTone = ctx.createBiquadFilter();
    dlyTone.type = "lowpass";
    dlyTone.frequency.value = 2400;
    dly.connect(dlyTone);
    dlyTone.connect(dlyGain);
    dlyGain.connect(lp);
    dlyGain.connect(dlyFB);
    dlyFB.connect(dly);

    const allNodes = [];
    let t = ctx.currentTime + 0.18;
    HB_NOTES.forEach(([nm, units], idx) => {
      const freq = HB_FREQ[nm];
      const dur = units * unit;
      const isLong = units >= 4;

      // Per-note envelope — long enough attack/release to avoid clicks
      const env = ctx.createGain();
      const atk = 0.045;
      const decTo = isLong ? 0.62 : 0.7;
      const rel = Math.min(0.18, Math.max(0.05, dur * 0.18));
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(1.0, t + atk);
      env.gain.exponentialRampToValueAtTime(decTo, t + atk + Math.min(0.35, dur * 0.4));
      env.gain.setValueAtTime(decTo, Math.max(t + atk + 0.05, t + dur - rel));
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      // Voices: triangle lead + sine octave-up harmonic + sine octave-down sub
      const oLead = ctx.createOscillator();
      oLead.type = "triangle";
      oLead.frequency.setValueAtTime(freq, t);

      const oHarm = ctx.createOscillator();
      oHarm.type = "sine";
      oHarm.frequency.setValueAtTime(freq * 2, t);
      const gHarm = ctx.createGain();
      gHarm.gain.value = 0.22;

      const oSub = ctx.createOscillator();
      oSub.type = "sine";
      oSub.frequency.setValueAtTime(freq * 0.5, t);
      const gSub = ctx.createGain();
      gSub.gain.value = 0.16;

      // 5th harmonic for a touch of brightness on shorter notes
      const oFifth = ctx.createOscillator();
      oFifth.type = "sine";
      oFifth.frequency.setValueAtTime(freq * 3, t);
      const gFifth = ctx.createGain();
      gFifth.gain.value = 0.06;

      // Subtle vibrato — fades in only on longer notes, after the attack
      let lfo, lfoGain;
      if (isLong) {
        lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 5.2;
        lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0, t);
        lfoGain.gain.setValueAtTime(0, t + atk + 0.15);
        lfoGain.gain.linearRampToValueAtTime(freq * 0.006, t + atk + 0.45);
        lfo.connect(lfoGain);
        lfoGain.connect(oLead.frequency);
        lfoGain.connect(oHarm.frequency);
      }

      oLead.connect(env);
      oHarm.connect(gHarm); gHarm.connect(env);
      oSub.connect(gSub); gSub.connect(env);
      oFifth.connect(gFifth); gFifth.connect(env);

      env.connect(master);
      // Send a portion to the delay bus
      const sendGain = ctx.createGain();
      sendGain.gain.value = 0.42;
      env.connect(sendGain);
      sendGain.connect(dly);

      const stopT = t + dur + 0.06;
      oLead.start(t); oLead.stop(stopT);
      oHarm.start(t); oHarm.stop(stopT);
      oSub.start(t);  oSub.stop(stopT);
      oFifth.start(t); oFifth.stop(stopT);
      if (lfo) { lfo.start(t); lfo.stop(stopT); }

      allNodes.push(oLead, oHarm, oSub, oFifth);
      if (lfo) allNodes.push(lfo);

      t += dur;
    });

    stopFnRef.current = () => {
      allNodes.forEach((o) => { try { o.stop(0); } catch (e) {} });
    };

    setPlaying(true);
    setLineIdx(-1);

    // Sync lyric lines (matches the 0.18s schedule offset above)
    let accumMs = 180;
    HB_LINE_COUNTS.forEach((cnt, li) => {
      const startMs = accumMs;
      timersRef.current.push(setTimeout(() => setLineIdx(li), startMs));
      const noteOffset = HB_LINE_COUNTS.slice(0, li).reduce((a, b) => a + b, 0);
      const lineDur = HB_NOTES.slice(noteOffset, noteOffset + cnt)
        .reduce((s, n) => s + n[1] * unit, 0);
      accumMs += lineDur * 1000;
    });
    timersRef.current.push(setTimeout(() => { stop(); }, accumMs + 600));
  }, [stop]);

  // Auto-play when playKey changes from 0
  useEffectSong(() => {
    if (playKey && playKey > 0) {
      const t = setTimeout(() => { play(); }, 50);
      return () => clearTimeout(t);
    }
  }, [playKey, play]);

  // Cleanup
  useEffectSong(() => () => stop(), [stop]);

  const lyrics = [
    "happy birthday to you",
    "happy birthday to you",
    `happy birthday dear ${name || "you"}`,
    "happy birthday to you",
  ];

  return (
    <>
      <button
        type="button"
        className={"song-btn" + (playing ? " is-playing" : "")}
        onClick={playing ? stop : play}
        aria-label={playing ? "Stop the song" : `Play the song for ${name}`}
      >
        <span className="song-glyph" aria-hidden="true">
          {playing
            ? <span className="bars"><span /><span /><span /></span>
            : <span className="play-tri" />}
        </span>
        <span className="song-label">
          {playing ? "playing…" : `play ${name}'s song`}
        </span>
      </button>

      <div className={"song-stage" + (playing ? " is-on" : "")} aria-hidden="true">
        {playing && lineIdx >= 0 && (
          <div key={lineIdx} className="song-line-now">
            <span className="song-note">♪</span>
            <span>{lyrics[lineIdx]}</span>
            <span className="song-note">♪</span>
          </div>
        )}
      </div>
    </>
  );
}

window.HappyBirthdaySong = HappyBirthdaySong;

// ── Hooray fanfare (cheerful bell arpeggio + chord swell + sparkle) ─────────
function playFireworks() {
  let ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  } catch (e) { return; }

  const master = ctx.createGain();
  master.gain.value = 0.22;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 80;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 12;
  comp.ratio.value = 2.4;
  comp.attack.value = 0.005;
  comp.release.value = 0.2;
  master.connect(hp);
  hp.connect(comp);
  comp.connect(ctx.destination);

  // Wet reverb-ish tail via feedback delay
  const dly = ctx.createDelay();
  dly.delayTime.value = 0.28;
  const dlyTone = ctx.createBiquadFilter();
  dlyTone.type = "lowpass";
  dlyTone.frequency.value = 3200;
  const dlyGain = ctx.createGain();
  dlyGain.gain.value = 0.32;
  const dlyFB = ctx.createGain();
  dlyFB.gain.value = 0.38;
  dly.connect(dlyTone);
  dlyTone.connect(dlyGain);
  dlyGain.connect(master);
  dlyGain.connect(dlyFB);
  dlyFB.connect(dly);

  const FREQ = {
    G4: 392.00, C5: 523.25, E5: 659.25, G5: 783.99,
    C6: 1046.50, E6: 1318.51, G6: 1567.98, C7: 2093.00, E7: 2637.02,
  };

  // Bell voice: sine fundamental + 2nd & 3rd inharmonic partials, exponential decay.
  function bell(t, freq, dur, gain) {
    const partials = [
      { ratio: 1.0,  weight: 1.0,  decay: dur          },
      { ratio: 2.0,  weight: 0.55, decay: dur * 0.65   },
      { ratio: 3.01, weight: 0.32, decay: dur * 0.45   },
      { ratio: 4.07, weight: 0.18, decay: dur * 0.32   },
    ];
    partials.forEach((p) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq * p.ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain * p.weight, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + p.decay);
      o.connect(g);
      g.connect(master);
      g.connect(dly);
      o.start(t);
      o.stop(t + p.decay + 0.1);
    });
  }

  // Soft sine "yay" swell — a major chord pad rising in volume.
  function swell(t, freqs, dur, peak) {
    freqs.forEach((freq, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? "triangle" : "sine";
      o.frequency.value = freq;
      // gentle detune for chorus
      o.detune.value = (i - (freqs.length - 1) / 2) * 4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.35);
      g.gain.exponentialRampToValueAtTime(peak * 0.7, t + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + dur + 0.1);
    });
  }

  const t0 = ctx.currentTime + 0.04;

  // Ascending bell arpeggio: G4 - C5 - E5 - G5 (a major triad triumph)
  bell(t0 + 0.00, FREQ.G4, 2.0, 0.55);
  bell(t0 + 0.13, FREQ.C5, 2.0, 0.60);
  bell(t0 + 0.26, FREQ.E5, 2.4, 0.62);
  bell(t0 + 0.42, FREQ.G5, 3.0, 0.70);

  // Higher echo arpeggio for sparkle (third repeat)
  bell(t0 + 0.95,  FREQ.C6, 2.0, 0.40);
  bell(t0 + 1.10, FREQ.E6, 2.0, 0.36);
  bell(t0 + 1.28, FREQ.G6, 2.4, 0.34);

  // A second wave of cheer — held major chord pad underneath
  swell(t0 + 0.30, [FREQ.C5, FREQ.E5, FREQ.G5], 3.0, 0.10);

  // Final sparkle chimes — random high taps
  [0.7, 1.45, 2.05, 2.6, 3.15].forEach((dt, i) => {
    const f = [FREQ.E6, FREQ.G6, FREQ.C7, FREQ.E7][i % 4];
    bell(t0 + dt, f, 1.4, 0.18 + Math.random() * 0.08);
  });

  // Final triumphant chord at the peak
  swell(t0 + 1.6, [FREQ.G4, FREQ.C5, FREQ.E5, FREQ.G5], 2.6, 0.12);

  setTimeout(() => { try { ctx.close(); } catch (e) {} }, 5500);
}
window.playFireworks = playFireworks;

// ── Fireworks visual layer ──────────────────────────────────────────────────
const FIREWORK_BURSTS = [
  { x: 22, y: 24, delay:  100, color: "#f0a8c0" },
  { x: 78, y: 18, delay:  800, color: "#bca0d4" },
  { x: 50, y: 14, delay: 1600, color: "#a8c9de" },
  { x: 30, y: 30, delay: 2400, color: "#fde2ec" },
  { x: 72, y: 28, delay: 3100, color: "#d4c2e8" },
];
const FIREWORK_SHARDS = 14;

function FireworksLayer({ active }) {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (active) setTick((k) => k + 1);
  }, [active]);
  if (!active) return null;
  return (
    <div className="fireworks" key={tick} aria-hidden="true">
      {FIREWORK_BURSTS.map((b, i) => (
        <div key={i} className="fw-burst" style={{
          left: b.x + "%",
          top: b.y + "%",
          ["--c"]: b.color,
          animationDelay: b.delay + "ms",
        }}>
          <span className="fw-flash" style={{ animationDelay: b.delay + "ms" }} />
          {Array.from({ length: FIREWORK_SHARDS }).map((_, k) => {
            const ang = (k / FIREWORK_SHARDS) * Math.PI * 2;
            const dist = 90 + (k % 3) * 18;
            return (
              <span key={k} className="fw-shard" style={{
                ["--dx"]: (Math.cos(ang) * dist).toFixed(1) + "px",
                ["--dy"]: (Math.sin(ang) * dist).toFixed(1) + "px",
                animationDelay: (b.delay + 40) + "ms",
              }} />
            );
          })}
        </div>
      ))}
    </div>
  );
}
window.FireworksLayer = FireworksLayer;
