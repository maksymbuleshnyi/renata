/* global React, ReactDOM */
const { useState, useEffect, useMemo, useRef } = React;

// ── Tweak defaults ───────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "recipientName": "Renata",
  "envelopeName": "Renata",
  "envelopeNote": "press the seal",
  "sealLetter": "R",
  "frostingName": "Renata",
  "fromName": "happy birthday,",
  "signature": "— Maksym",
  "message": "Twenty-five candles. Twenty-five roses. And twenty-five small things I appreciate about you — one for every year I've been lucky enough to notice them.",
  "age": 25,
  "candleColors": "pink-lilac-blue",
  "showHints": true,
  "playSong": true,
  "wishes": [
    "the way you laugh — especially at bad jokes",
    "how you light up a room",
    "your taste in basically everything",
    "how brave you actually are",
    "how you remember every little thing",
    "your patience",
    "your stubbornness (admirable, really)",
    "your softness",
    "how you stand your ground",
    "how generous you are with your time",
    "the way you celebrate other people",
    "your eye for beauty",
    "how easy you are to talk to",
    "the way you take care of people",
    "your handwriting",
    "how curious you are about everything",
    "your honesty",
    "the way you keep your promises",
    "your unreasonable standards (we benefit)",
    "how you make boring things fun",
    "the playlists you make",
    "the books you recommend",
    "your soft spot for red roses",
    "year twenty-five looks gorgeous on you",
    "whatever twenty-six brings — bring it on"
  ]
}/*EDITMODE-END*/;

// ── Palettes ────────────────────────────────────────────────────────────────
const CANDLE_PALETTES = {
  "pink-lilac-blue": [["#e1839e","#fde6ee"], ["#a888c4","#ece1f5"], ["#8fb7d4","#e2eef7"], ["#f0a8c0","#fff0f6"], ["#bca0d4","#f4ecfa"]],
  "rose-gold":       [["#d96a8c","#fbe3ec"], ["#e8a59b","#fff0e9"], ["#c89a4a","#f4e3bd"], ["#a26a7a","#f6dde2"]],
  "pastel":          [["#9cc4d6","#e6f0f5"], ["#d8a3c4","#f6e3ee"], ["#cdb88a","#f4ebd6"], ["#a6c19a","#e5efde"]],
  "vivid":           [["#e94e5b","#ffd9dd"], ["#f0a64a","#ffe9c8"], ["#5da4c9","#cce4ee"], ["#7c5db0","#ddd0ef"]],
  "monochrome":      [["#3a2a1a","#e6dcc8"], ["#5b4a39","#f0e7d0"], ["#8b7456","#fbf3e1"], ["#3a2a1a","#fbf3e1"]],
};

// ── 25 candle positions ─────────────────────────────────────────────────────
const CANDLE_LAYOUT = (() => {
  const out = [];
  const frontN = 13;
  for (let i = 0; i < frontN; i++) {
    const t = i / (frontN - 1);
    const jx = ((i * 37) % 9) / 9 * 1.6 - 0.8;
    const jy = ((i * 53) % 7) / 7 * 2 - 1;
    out.push({ xPct: 4 + t * 92 + jx, bottomPx: 0 + jy, row: "front" });
  }
  const backN = 12;
  for (let i = 0; i < backN; i++) {
    const t = (i + 0.5) / backN;
    const arch = Math.sin(t * Math.PI) * 8;
    const jx = ((i * 41) % 9) / 9 * 1.4 - 0.7;
    const jy = ((i * 29) % 7) / 7 * 2 - 1;
    out.push({ xPct: 6 + t * 88 + jx, bottomPx: 14 + arch + jy, row: "back" });
  }
  return out;
})();

// ── Envelope ────────────────────────────────────────────────────────────────
function Envelope({ name, note, sealLetter, opened, onOpen }) {
  const [cracked, setCracked] = useState(false);
  const handleClick = () => {
    if (opened) return;
    setCracked(true);
    setTimeout(() => onOpen(), 650);
  };
  return (
    <div className={"envelope " + (opened ? "is-opened" : "") + (cracked ? " is-cracked" : "")}>
      <div className="env-paper">
        <div className="env-flap-shadow" />
        <div className="env-flap" />
        <div className="env-flap-edge" />
        <div className="env-front">
          <div className="env-eyebrow">— for —</div>
          <div className="env-name">{name}</div>
          <div className="env-note">{note}</div>
          <div className="env-postlines">
            <span /><span /><span />
          </div>
        </div>
        <button
          type="button"
          className="env-seal"
          aria-label="Open the postcard"
          onClick={handleClick}
        >
          <span className="seal-half seal-left" aria-hidden="true">
            <span className="seal-letter">{sealLetter}</span>
          </span>
          <span className="seal-half seal-right" aria-hidden="true" />
          <span className="seal-shine" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ── Candle ──────────────────────────────────────────────────────────────────
function Candle({ idx, x, bottom, lit, color, wish, onLight }) {
  const ref = useRef(null);
  const [c1, c2] = color;
  const wasLit = useRef(false);
  const [flying, setFlying] = useState(false);

  useEffect(() => {
    if (lit && !wasLit.current) {
      wasLit.current = true;
      setFlying(true);
      const t = setTimeout(() => setFlying(false), 2200);
      return () => clearTimeout(t);
    }
    if (!lit) wasLit.current = false;
  }, [lit]);

  const handle = (e) => {
    if (lit) return;
    onLight(idx);
    // sparks
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const parent = el.parentElement;
    const pRect = parent.getBoundingClientRect();
    const baseLeft = (rect.left - pRect.left) + rect.width / 2;
    const baseTop  = (rect.top  - pRect.top)  + 6;
    for (let i = 0; i < 7; i++) {
      const s = document.createElement("span");
      s.className = "spark";
      const a = (Math.PI * (Math.random() * 0.8 + 0.1)) * -1;
      const dist = 14 + Math.random() * 20;
      s.style.left = baseLeft + "px";
      s.style.top  = baseTop  + "px";
      s.style.setProperty("--dx", (Math.cos(a) * dist).toFixed(1) + "px");
      s.style.setProperty("--dy", (Math.sin(a) * dist).toFixed(1) + "px");
      s.style.animationDelay = (i * 25) + "ms";
      parent.appendChild(s);
      setTimeout(() => s.remove(), 800);
    }
  };

  return (
    <div
      ref={ref}
      className={"candle" + (lit ? " lit" : "")}
      style={{
        left: `calc(${x}% - 5px)`,
        bottom: `${bottom}px`,
        ["--c1"]: c1,
        ["--c2"]: c2,
      }}
      role="button"
      aria-label={`Candle ${idx + 1}${lit ? ", lit" : ""}: ${wish || ""}`}
      aria-pressed={lit}
      tabIndex={0}
      onClick={handle}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handle(e); } }}
    >
      <span className="stick" />
      <span className="wick" />
      <span className="flame-wrap">
        <span className="flame-outer" />
        <span className="flame-mid" />
        <span className="flame-core" />
      </span>
      {/* Hover tag (preview) */}
      {wish && (
        <span className="wish-tag" aria-hidden="true">
          <span className="wish-tag-num">{String(idx + 1).padStart(2, "0")}</span>
          <span className="wish-tag-text">{wish}</span>
        </span>
      )}
      {/* Fly-up wish on light */}
      {flying && wish && (
        <span className="wish-fly" aria-hidden="true">{wish}</span>
      )}
    </div>
  );
}

// ── Balloons ────────────────────────────────────────────────────────────────
const BALLOONS = [
  // Right cluster
  { x: 86, y: 22, color: 'pink',  size: 1.0,  rot: -3, delay: 0    },
  { x: 93, y: 40, color: 'lilac', size: 1.1,  rot: 4,  delay: 0.6  },
  { x: 78, y: 56, color: 'blue',  size: 0.85, rot: -2, delay: 1.2  },
  { x: 90, y: 73, color: 'pink',  size: 1.0,  rot: 5,  delay: 0.4  },
  { x: 96, y: 14, color: 'lilac', size: 0.9,  rot: 2,  delay: 0.8  },
  { x: 82, y: 90, color: 'blue',  size: 0.95, rot: -4, delay: 0.5  },
  { x: 71, y: 12, color: 'pink',  size: 0.8,  rot: 6,  delay: 1.4  },
  // Left cluster — bottom
  { x: 6,  y: 70, color: 'blue',  size: 0.9,  rot: 3,  delay: 0.3  },
  { x: 9,  y: 88, color: 'lilac', size: 0.85, rot: -5, delay: 1.0  },
  { x: 14, y: 60, color: 'pink',  size: 0.75, rot: 2,  delay: 1.5  },
  // Where the polaroid used to sit (top-left)
  { x: 8,  y: 22, color: 'pink',  size: 1.1,  rot: -4, delay: 0.2  },
  { x: 20, y: 30, color: 'lilac', size: 0.95, rot: 5,  delay: 1.3  },
  { x: 14, y: 44, color: 'blue',  size: 1.0,  rot: -3, delay: 0.7  },
  { x: 26, y: 18, color: 'pink',  size: 0.85, rot: 3,  delay: 1.8  },
  { x: 4,  y: 38, color: 'lilac', size: 0.8,  rot: -2, delay: 0.9  },
  // Top middle accents
  { x: 36, y: 8,  color: 'blue',  size: 0.75, rot: 2,  delay: 1.6  },
  { x: 62, y: 8,  color: 'pink',  size: 0.8,  rot: -3, delay: 2.0  },
];

function Balloons() {
  const [popped, setPopped] = useState(new Set());
  const pop = (i) => setPopped((s) => {
    if (s.has(i)) return s;
    const next = new Set(s);
    next.add(i);
    return next;
  });
  const resetAll = () => setPopped(new Set());

  // Expose reset on window for the replay flow
  useEffect(() => {
    window.__resetBalloons = resetAll;
    return () => { delete window.__resetBalloons; };
  }, []);

  return (
    <div className="balloons" aria-hidden="true">
      {BALLOONS.map((b, i) => {
        const isPopped = popped.has(i);
        return (
          <div
            key={i}
            className={"balloon-anchor"}
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              transform: `translate(-50%, -50%) rotate(${b.rot}deg)`,
            }}
          >
            <div
              className={"balloon-float b-" + b.color + (isPopped ? " is-popped" : "")}
              style={{ ["--size"]: b.size, ["--delay"]: `${b.delay}s` }}
            >
              <button
                type="button"
                className="balloon-tap"
                aria-label="Pop balloon"
                onClick={() => pop(i)}
                disabled={isPopped}
              >
                <span className="balloon-body" />
                <span className="balloon-shine" />
                <span className="balloon-tie" />
              </button>
              <span className="balloon-string" />
              {isPopped && <span className="balloon-burst" />}
              {isPopped && (
                <span className="balloon-frags" aria-hidden="true">
                  {[0,1,2,3,4,5].map((k) => (
                    <span key={k} className="frag" style={{
                      ["--fx"]: `${(Math.cos(k * 1.05) * 28).toFixed(1)}px`,
                      ["--fy"]: `${(Math.sin(k * 1.05) * 24).toFixed(1)}px`,
                      ["--fr"]: `${(k * 47) % 180}deg`,
                    }} />
                  ))}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Make A Wish modal ───────────────────────────────────────────────────────
function MakeAWish({ phase, name, onSubmit }) {
  const refRef = useRef(null);
  if (!refRef.current) {
    refRef.current = "BD" + (Math.floor(Math.random() * 900000) + 100000);
  }

  if (phase === "idle" || phase === "blown") return null;

  return (
    <div className={"wish-modal wish-phase-" + phase} role="dialog" aria-modal="true">
      <div className="wish-backdrop" />
      <div className="wish-card">
        {phase === "asking" && (
          <>
            <div className="wish-eyebrow">✦ 25 / 25 ✦</div>
            <div className="wish-title">Make a wish, {name}.</div>
            <p className="wish-sub">
              the candles are all lit. close your eyes and make one.
            </p>
            <div className="wish-actions wish-actions-solo">
              <button
                type="button"
                className="wish-submit wish-submit-big"
                onClick={() => onSubmit()}
                autoFocus
              >
                <span>I made my wish</span>
                <span className="wish-submit-arrow">↗</span>
              </button>
            </div>
            <div className="wish-disclaimer">cosmic delivery service · usually instant</div>
          </>
        )}
        {phase === "recording" && (
          <div className="wish-receipt">
            <div className="wish-receipt-stamp">RECEIVED</div>
            <div className="wish-receipt-title">Wish recorded.</div>
            <div className="wish-receipt-text">
              <p>filed under <em>{name}, twenty-five</em></p>
              <p>queued for execution by the universe</p>
              <p>expected delivery: <em>very soon</em></p>
            </div>
            <div className="wish-receipt-line" />
            <p className="wish-receipt-ref">
              REF · {refRef.current} · {new Date().toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Confetti ────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  const pieces = useMemo(() => {
    const colors = ["#e8a59b","#c89a4a","#d96a8c","#fbe3ec","#9cc4d6","#a26a7a","#e9c87a","#b81e1e"];
    return Array.from({ length: 80 }, (_, i) => {
      const left = Math.random() * 100;
      const dur = 3.5 + Math.random() * 2.5;
      const delay = Math.random() * 1.2;
      const x = (Math.random() - 0.5) * 220;
      const r = (Math.random() * 720 + 360) * (Math.random() < 0.5 ? -1 : 1);
      const color = colors[i % colors.length];
      const w = 6 + Math.random() * 6;
      const h = 10 + Math.random() * 8;
      const round = Math.random() < 0.25 ? "50%" : "1px";
      return { left, dur, delay, x, r, color, w, h, round, i };
    });
  }, []);
  if (!active) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <i key={p.i} style={{
          left: p.left + "%",
          width: p.w + "px",
          height: p.h + "px",
          background: p.color,
          borderRadius: p.round,
          ["--dur"]: p.dur + "s",
          ["--delay"]: p.delay + "s",
          ["--x"]: p.x + "px",
          ["--r"]: p.r + "deg",
        }} />
      ))}
    </div>
  );
}

// ── Postcard back (the message + 25 wishes list) ────────────────────────────
function PostcardBack({ tweaks, songKey, onReplay }) {
  const wishes = tweaks.wishes || [];
  return (
    <div className="pc-back">
      <div className="back-edge" aria-hidden="true" />
      <div className="back-divide" aria-hidden="true" />

      {window.HappyBirthdaySong && (
        <window.HappyBirthdaySong name={tweaks.recipientName} playKey={songKey} />
      )}

      <div className="back-letter">
        <div className="back-greeting">
          Happy Birthday, <em>{tweaks.recipientName}</em>
        </div>
        <p className="back-message">{tweaks.message}</p>

        {/* Polaroid tucked into the letter side */}
        <div className="back-polaroid" aria-label="Photo of the birthday person">
          <div className="polaroid-tape" />
          <div className="polaroid-photo">
            <image-slot
              id="renata-photo"
              shape="rect"
              fit="cover"
              placeholder="drop her photo →"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <div className="polaroid-caption">
            {tweaks.recipientName} · {new Date().getFullYear()}
          </div>
        </div>
      </div>

      <div className="back-wishes">
        <div className="back-wishes-title">
          <span>twenty-five</span>
          <span className="reasons">small things I appreciate about you</span>
        </div>
        <ol className="wish-list">
          {wishes.map((w, i) => (
            <li key={i} style={{ animationDelay: `${250 + i * 60}ms` }}>
              <span className="wish-n">{String(i + 1).padStart(2, "0")}</span>
              <span className="wish-t">{w}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="back-signoff">
        <span className="back-from">{tweaks.fromName}</span>
        <span className="back-name">{tweaks.signature}</span>
      </div>

      <button className="back-replay" onClick={onReplay}>Relight everything</button>
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [tweaks, setTweak] = window.useTweaks
    ? window.useTweaks(TWEAK_DEFAULTS)
    : [TWEAK_DEFAULTS, () => {}];

  const wishes = Array.isArray(tweaks.wishes) ? tweaks.wishes : [];
  const palette = CANDLE_PALETTES[tweaks.candleColors] || CANDLE_PALETTES["rose-gold"];
  const candleColorFor = (i) => palette[i % palette.length];

  const total = CANDLE_LAYOUT.length;
  const [lit, setLit] = useState(() => Array(total).fill(false));
  const [opened, setOpened] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [songKey, setSongKey] = useState(0);
  const [ceremony, setCeremony] = useState("idle"); // idle | asking | recording | blown

  const litCount = lit.filter(Boolean).length;
  const allLit = litCount === total;

  // When all candles are lit, advance to "asking" after a beat.
  useEffect(() => {
    if (allLit && ceremony === "idle") {
      // Play fireworks burst (audio + visual)
      try { if (window.playFireworks) window.playFireworks(); } catch (e) {}
      const t = setTimeout(() => setCeremony("asking"), 3800);
      return () => clearTimeout(t);
    }
  }, [allLit, ceremony]);

  // Auto-play the song as soon as the postcard flips to the back.
  useEffect(() => {
    if (flipped && tweaks.playSong !== false) {
      const t = setTimeout(() => setSongKey((k) => k + 1), 50);
      return () => clearTimeout(t);
    }
  }, [flipped, tweaks.playSong]);

  const submitWish = () => {
    setCeremony("recording");
    setTimeout(() => {
      setLit(Array(total).fill(false));
      setCeremony("blown");
      setTimeout(() => {
        setFlipped(true);
      }, 1300);
    }, 5500);
  };

  const onLight = (i) => {
    setLit((prev) => {
      if (prev[i]) return prev;
      const next = prev.slice();
      next[i] = true;
      return next;
    });
  };

  const replay = () => {
    setFlipped(false);
    setTimeout(() => {
      setLit(Array(total).fill(false));
      setCeremony("idle");
      if (typeof window.__resetBalloons === "function") window.__resetBalloons();
    }, 700);
  };

  const reopenEnvelope = () => {
    setFlipped(false);
    setLit(Array(total).fill(false));
    setCeremony("idle");
    if (typeof window.__resetBalloons === "function") window.__resetBalloons();
    setOpened(false);
  };

  // Back row first so front row visually overlaps
  const layout = useMemo(() => {
    return CANDLE_LAYOUT.map((c, i) => ({ ...c, idx: i }))
      .sort((a, b) => (a.row === "back" ? 0 : 1) - (b.row === "back" ? 0 : 1));
  }, []);

  return (
    <>
      <div className="postcard-stage">
        <div className={"postcard-flipper" + (flipped ? " is-flipped" : "")}>
          {/* FRONT */}
          <div className="postcard-face postcard-front" aria-hidden={flipped}>
            <div className="paper-grain" aria-hidden="true" />
            <div className="counter" aria-live="polite">
              <span>Candles lit</span>
              <span className="num">{String(litCount).padStart(2, "0")} / {total}</span>
            </div>

            <div className="pc-header">
              <div className="pc-eyebrow">
                A Postcard<span className="dot" />For You
              </div>
              <div className="pc-title">A little something — with a wish inside.</div>
            </div>

            {/* Big "25" backdrop */}
            <div className="big-25" aria-hidden="true">{tweaks.age}</div>

            <Balloons />

            <div className="scene">
              <div className="cake-wrap">
                <div className="plate" />
                <div className="tier bottom"><div className="dots" /></div>
                <div className="tier middle">
                  <div className="frosting-name">{tweaks.frostingName}</div>
                </div>
                <div className="tier top" />

                <div className={"candle-field" + (tweaks.showHints && litCount === 0 ? " hint" : "")}>
                  {tweaks.showHints && litCount === 0 && (
                    <div className="tap-finger" aria-hidden="true">👆</div>
                  )}
                  {layout.map((c) => (
                    <Candle
                      key={c.idx}
                      idx={c.idx}
                      x={c.xPct}
                      bottom={c.bottomPx}
                      lit={lit[c.idx]}
                      color={candleColorFor(c.idx)}
                      wish={wishes[c.idx] || ""}
                      onLight={onLight}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className={"instruction" + (litCount > 0 ? " gone" : "")}>
              <span className="arrow">tap each candle to light it ↑</span>
              <small>light all {total}</small>
            </div>

            <div className="postmark">
              <div className="seal">Handmade · 1 of 1</div>
              <div>Posted from the heart · {new Date().toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}</div>
            </div>

            <Confetti active={allLit && !flipped} />

            {window.FireworksLayer && (
              <window.FireworksLayer active={allLit && ceremony !== "blown"} />
            )}

            <MakeAWish phase={ceremony} name={tweaks.recipientName} onSubmit={submitWish} />
          </div>

          {/* BACK */}
          <div className="postcard-face postcard-back" aria-hidden={!flipped}>
            <div className="paper-grain" aria-hidden="true" />
            <PostcardBack tweaks={tweaks} songKey={songKey} onReplay={replay} />
          </div>
        </div>

        {/* Envelope cover */}
        <Envelope
          name={tweaks.envelopeName}
          note={tweaks.envelopeNote}
          sealLetter={tweaks.sealLetter}
          opened={opened}
          onOpen={() => setOpened(true)}
        />
      </div>

      {window.TweaksPanel && (
        <window.TweaksPanel>
          <window.TweakSection title="Recipient">
            <window.TweakText label="Name (postcard)" value={tweaks.recipientName}
              onChange={(v) => setTweak("recipientName", v)} />
            <window.TweakText label="Name on envelope" value={tweaks.envelopeName}
              onChange={(v) => setTweak("envelopeName", v)} />
            <window.TweakText label="Name on cake" value={tweaks.frostingName}
              onChange={(v) => setTweak("frostingName", v)} />
            <window.TweakText label="Seal monogram" value={tweaks.sealLetter}
              onChange={(v) => setTweak("sealLetter", v)} />
            <window.TweakNumber label="Age (stamp)" value={tweaks.age}
              onChange={(v) => setTweak("age", v)} min={1} max={120} />
          </window.TweakSection>

          <window.TweakSection title="Message">
            <window.TweakText label="Envelope hint" value={tweaks.envelopeNote}
              onChange={(v) => setTweak("envelopeNote", v)} />
            <window.TweakRow label="Letter (on back)">
              <textarea className="twk-field" rows={4}
                value={tweaks.message}
                onChange={(e) => setTweak("message", e.target.value)} />
            </window.TweakRow>
            <window.TweakText label="Sign-off" value={tweaks.fromName}
              onChange={(v) => setTweak("fromName", v)} />
            <window.TweakText label="Signature" value={tweaks.signature}
              onChange={(v) => setTweak("signature", v)} />
          </window.TweakSection>

          <window.TweakSection title="The 25 wishes">
            <window.TweakRow label="One wish per line (1–25)">
              <textarea className="twk-field twk-wishes" rows={12}
                value={(tweaks.wishes || []).join("\n")}
                onChange={(e) => {
                  const lines = e.target.value.split("\n").slice(0, 25);
                  while (lines.length < 25) lines.push("");
                  setTweak("wishes", lines);
                }} />
            </window.TweakRow>
          </window.TweakSection>

          <window.TweakSection title="Look & feel">
            <window.TweakSelect label="Candle palette" value={tweaks.candleColors}
              options={[
                { value: "pink-lilac-blue", label: "Pink · lilac · baby blue" },
                { value: "rose-gold",       label: "Rose & gold" },
                { value: "pastel",          label: "Pastel mix" },
                { value: "vivid",           label: "Vivid" },
                { value: "monochrome",      label: "Warm mono" },
              ]}
              onChange={(v) => setTweak("candleColors", v)} />
            <window.TweakToggle label="Show hint bob" value={tweaks.showHints}
              onChange={(v) => setTweak("showHints", v)} />
            <window.TweakToggle label="Auto-play song on flip" value={tweaks.playSong !== false}
              onChange={(v) => setTweak("playSong", v)} />
            <window.TweakButton label="Play song now" onClick={() => setSongKey((k) => k + 1)} />
            <window.TweakButton label="Reset candles" onClick={replay} />
            <window.TweakButton label="Re-seal envelope" onClick={reopenEnvelope} secondary />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
