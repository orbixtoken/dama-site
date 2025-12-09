// src/pages/jogos/Dice.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { casinoApi, financeApi } from "../../lib/api";

/* ---------------- helpers ---------------- */
const money = (v) =>
  `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

/* se já tiver esse hook em outro lugar, pode trocar o import e remover daqui */
function useIsMobile(breakpoint = 640) {
  const [isMobile, set] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.(`(max-width:${breakpoint}px)`);
    const up = () => set(mq?.matches ?? window.innerWidth <= breakpoint);
    up();
    mq?.addEventListener?.("change", up);
    window.addEventListener("resize", up);
    return () => {
      mq?.removeEventListener?.("change", up);
      window.removeEventListener("resize", up);
    };
  }, [breakpoint]);
  return isMobile;
}

/* --------------- partículas (confete/faíscas) --------------- */
function FXCanvas({ triggerKey, type }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      c.width = c.clientWidth * DPR;
      c.height = c.clientHeight * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    const onRes = () => resize();
    window.addEventListener("resize", onRes);

    const W = () => c.clientWidth;
    const H = () => c.clientHeight;
    const N = type === "confetti" ? 60 : 36;

    const parts = Array.from({ length: N }, () => {
      const x = W() * (0.25 + Math.random() * 0.5);
      const y = H() * (0.40 + Math.random() * 0.2);
      const s = type === "confetti" ? 8 + Math.random() * 10 : 4 + Math.random() * 6;
      const vy = type === "confetti" ? -2 - Math.random() * 1.5 : -1.2 - Math.random() * 1.6;
      const vx = (Math.random() - 0.5) * (type === "confetti" ? 4 : 3);
      const life = 1000 + Math.random() * 900;
      const hue = 40 + Math.random() * 40;
      return { x, y, s, vy, vx, life, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.25, hue };
    });

    let last = performance.now();
    let raf;
    const loop = (now) => {
      const dt = Math.min(32, now - last);
      last = now;
      ctx.clearRect(0, 0, W(), H());
      parts.forEach((p) => {
        p.life -= dt;
        p.vy += 0.0012 * dt;
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.rot += p.vr * (dt / 16);
        if (type === "confetti") {
          const grd = ctx.createLinearGradient(p.x, p.y - p.s, p.x, p.y + p.s);
          grd.addColorStop(0, `hsl(${p.hue},95%,85%)`);
          grd.addColorStop(1, `hsl(${p.hue},75%,55%)`);
          ctx.fillStyle = grd;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-p.s * 0.6, -p.s * 0.16, p.s * 1.2, p.s * 0.32);
          ctx.restore();
        } else {
          ctx.fillStyle = "rgba(255,150,90,.65)";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 0.25, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "rgba(255,210,150,.4)";
          ctx.beginPath(); ctx.arc(p.x + 0.8, p.y + 0.6, p.s * 0.18, 0, Math.PI * 2); ctx.fill();
        }
      });
      if (parts.some((p) => p.life > 0 && p.y < H() + 40)) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onRes);
    };
  }, [triggerKey, type]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}

/* ------------------------ visuais ------------------------ */
const FACE = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const THEMES = {
  gold: {
    bg: "linear-gradient(145deg,#3c2c10,#1f1609)",
    border: "#fbbf24",
    pip: "#fff7d1",
    glow: "0 18px 50px rgba(234,179,8,.38)",
  },
  emerald: {
    bg: "linear-gradient(145deg,#054f36,#062921)",
    border: "#22c55e",
    pip: "#d8fff0",
    glow: "0 18px 50px rgba(16,185,129,.38)",
  },
  neon: {
    bg: "linear-gradient(145deg,#0f172a,#020617)",
    border: "#38bdf8",
    pip: "#e0f2fe",
    glow: "0 18px 50px rgba(56,189,248,.38)",
  },
  crimson: {
    bg: "linear-gradient(145deg,#7f1d1d,#3b0d0d)",
    border: "#fb7185",
    pip: "#ffe1e1",
    glow: "0 18px 50px rgba(248,113,113,.38)",
  },
};

function DiceVisual({
  size = 120,
  theme = "gold",
  rolling,
  finalFace,
  onStop,
  soundOn,
  sfx,
}) {
  const t = THEMES[theme] || THEMES.gold;
  const [face, setFace] = useState(1);
  const t0 = useRef(0);
  const timer = useRef(null);

  // injeta CSS das animações
  useEffect(() => {
    if (typeof document !== "undefined" && !document.getElementById("dice-anim-style")) {
      const css = `
        @keyframes diceShake {
          0%{ transform: translate(0,0) rotate(0) }
          20%{ transform: translate(3px,-3px) rotate(3deg) }
          50%{ transform: translate(-3px,3px) rotate(-3deg) }
          80%{ transform: translate(2px,1px) rotate(1deg) }
          100%{ transform: translate(0,0) rotate(0) }
        }
        @keyframes diceStageGlow {
          0%,100%{ opacity:.75; box-shadow:0 0 22px rgba(248,250,252,.18); transform:scale(1) }
          50%{ opacity:1; box-shadow:0 0 40px rgba(250,250,170,.55); transform:scale(1.04) }
        }
        @keyframes diceSpotSweep {
          0%{ transform:translateX(-120%) rotate(6deg); opacity:0 }
          20%{ opacity:.8 }
          80%{ opacity:.8 }
          100%{ transform:translateX(120%) rotate(6deg); opacity:0 }
        }
        @keyframes diceLedPulse {
          0%,100%{ opacity:.4 }
          50%{ opacity:1 }
        }
      `;
      const el = document.createElement("style");
      el.id = "dice-anim-style";
      el.textContent = css;
      document.head.appendChild(el);
    }
  }, []);

  // animação de rolagem do dado
  useEffect(() => {
    clearInterval(timer.current);
    if (!rolling) {
      if (finalFace >= 1 && finalFace <= 6) setFace(finalFace);
      return;
    }

    if (soundOn) {
      try {
        sfx.current.roll.loop = true;
        sfx.current.roll.currentTime = 0;
        sfx.current.roll.play();
      } catch {}
    }

    t0.current = performance.now();
    timer.current = setInterval(() => {
      setFace((f) => {
        let n = 1 + Math.floor(Math.random() * 6);
        if (n === f) n = ((n % 6) + 1);
        return n;
      });
    }, 80);

    let stopped = false;
    const minMs = 950;
    const check = () => {
      if (stopped) return;
      const elapsed = performance.now() - t0.current;
      if (elapsed >= minMs && finalFace >= 1 && finalFace <= 6) {
        stopped = true;
        clearInterval(timer.current);
        setFace(finalFace);
        if (soundOn) {
          try {
            sfx.current.roll.pause();
            sfx.current.roll.currentTime = 0;
          } catch {}
          try {
            sfx.current.stop.currentTime = 0;
            sfx.current.stop.play();
          } catch {}
        }
        setTimeout(() => onStop?.(), 160);
      } else {
        requestAnimationFrame(check);
      }
    };
    const raf = requestAnimationFrame(check);

    return () => {
      clearInterval(timer.current);
      cancelAnimationFrame(raf);
      try {
        sfx.current.roll.pause();
      } catch {}
    };
  }, [rolling, finalFace, onStop, soundOn, sfx]);

  const boxSize = size;
  const emojiSize = Math.round(size * 0.52);

  return (
    <div
      style={{
        height: 260,
        display: "grid",
        placeItems: "center",
        borderRadius: 18,
        border: "1px solid rgba(148,163,184,.45)",
        background:
          "radial-gradient(900px 360px at 50% -60px, rgba(251,191,36,.18), transparent 65%)," +
          "radial-gradient(900px 380px at 10% 120%, rgba(56,189,248,.20), transparent 70%)," +
          "linear-gradient(180deg, rgba(15,23,42,.95), rgba(3,7,18,.98))",
        marginBottom: 12,
        position: "relative",
        overflow: "hidden",
        boxShadow:
          "0 18px 50px rgba(0,0,0,.85), inset 0 1px 0 rgba(255,255,255,.05)",
      }}
    >
      {/* faixa de LEDs em cima e embaixo */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 18,
          right: 18,
          height: 8,
          backgroundImage:
            "radial-gradient(circle, rgba(252,211,77,1) 0, rgba(252,211,77,1) 2px, transparent 3px)",
          backgroundSize: "26px 10px",
          opacity: 0.9,
          filter: "drop-shadow(0 0 6px rgba(252,211,77,.95))",
          animation: "diceLedPulse 1.9s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 18,
          right: 18,
          height: 8,
          backgroundImage:
            "radial-gradient(circle, rgba(56,189,248,1) 0, rgba(56,189,248,1) 2px, transparent 3px)",
          backgroundSize: "26px 10px",
          opacity: 0.8,
          filter: "drop-shadow(0 0 6px rgba(56,189,248,.95))",
          animation: "diceLedPulse 2.3s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* holofote varrendo */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "-40%",
            width: "60%",
            height: "70%",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.25), rgba(255,255,255,0))",
            opacity: 0.7,
            filter: "blur(4px)",
            transform: "rotate(10deg)",
            animation: "diceSpotSweep 3.4s linear infinite",
          }}
        />
      </div>

      {/* palco/platô */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          width: boxSize * 1.8,
          height: boxSize * 0.42,
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 30%, rgba(255,255,255,.35), rgba(251,191,36,.1), rgba(0,0,0,0.98))",
          boxShadow:
            "0 -8px 26px rgba(0,0,0,1), 0 0 40px rgba(250,204,21,.6)",
          opacity: rolling ? 1 : 0.88,
          animation: "diceStageGlow 2.6s ease-in-out infinite",
        }}
      />

      {/* sombra do dado no palco */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 64,
          left: "50%",
          width: boxSize * 1.1,
          height: boxSize * 0.35,
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 50%, rgba(0,0,0,.55), transparent 70%)",
          filter: "blur(4px)",
          opacity: 0.9,
        }}
      />

      {/* dado em si */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "grid",
          placeItems: "center",
          transform: rolling ? "translateY(-4px)" : "translateY(-2px)",
          transition: "transform .18s ease-out",
        }}
      >
        <div
          style={{
            width: boxSize,
            height: boxSize,
            borderRadius: 20,
            background: t.bg,
            border: `1px solid ${t.border}`,
            boxShadow:
              `0 12px 40px rgba(0,0,0,.65), 0 0 0 1px rgba(15,23,42,.9) inset, ${t.glow}`,
            display: "grid",
            placeItems: "center",
            fontSize: emojiSize,
            color: t.pip,
            userSelect: "none",
            animation: rolling ? "diceShake .32s ease-in-out infinite" : "none",
            transformStyle: "preserve-3d",
            textShadow:
              "0 10px 28px rgba(0,0,0,.8), 0 0 16px rgba(248,250,252,.4)",
          }}
          aria-live="polite"
          aria-label={rolling ? "Rolando o dado" : `Face ${face}`}
        >
          {/* highlight lateral simulando 3D */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 20,
              background:
                "linear-gradient(135deg, rgba(255,255,255,.2), transparent 35%, transparent 65%, rgba(0,0,0,.55))",
              mixBlendMode: "soft-light",
              pointerEvents: "none",
            }}
          />
          {FACE[face]}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 12,
          fontSize: 12,
          opacity: 0.82,
          color: "#e5e7eb",
          textShadow: "0 0 8px rgba(15,23,42,.8)",
        }}
      >
        {rolling ? "Rolando…" : "Escolha um número e jogue na sorte 🎲"}
      </div>
    </div>
  );
}

/* --------------------------- página --------------------------- */
export default function Dice() {
  const isMobile = useIsMobile();
  const DICE_SIZE = isMobile ? 100 : 120;

  const [saldo, setSaldo] = useState(null);
  const [stake, setStake] = useState("1,00");
  const [target, setTarget] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [last, setLast] = useState(null);
  const [hist, setHist] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  const [rolling, setRolling] = useState(false);
  const [serverFace, setServerFace] = useState(null);
  const [theme, setTheme] = useState("gold");
  const [soundOn, setSoundOn] = useState(true);
  const [fxKey, setFxKey] = useState(0);
  const [fxType, setFxType] = useState("confetti");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const phrases = [
    "🎲 Aposta elegante, sorte dourada.",
    "✨ Um roll perfeito pode virar o jogo.",
    "🏅 Confie no palpite — o Tiger te observa.",
  ];

  const sfx = useRef(null);
  useEffect(() => {
    if (!sfx.current) {
      sfx.current = {
        roll: new Audio("/sfx/dice-roll.wav"),
        stop: new Audio("/sfx/dice-stop.wav"),
        win: new Audio("/sfx/win.wav"),
        lose: new Audio("/sfx/lose.wav"),
      };
      [sfx.current.roll, sfx.current.stop, sfx.current.win, sfx.current.lose].forEach(
        (a) => {
          a.preload = "auto";
          a.load?.();
          a.volume = 0.5;
        }
      );
      sfx.current.roll.volume = 0.35;
    }
    return () => {
      try {
        sfx.current.roll.pause();
      } catch {}
    };
  }, []);

  async function loadSaldo() {
    try {
      const { data } = await financeApi.getBalance();
      setSaldo(Number(data?.saldo_disponivel ?? data?.saldo ?? 0));
    } catch {
      // ignora, saldo fica null
    }
  }
  async function loadHist() {
    setHistLoading(true);
    try {
      const fn = casinoApi.minhasDice;
      if (fn) {
        const { data } = await fn();
        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        setHist(items.slice(0, 10));
      }
    } catch {
      // ignora
    } finally {
      setHistLoading(false);
    }
  }
  useEffect(() => {
    loadSaldo();
    loadHist();
  }, []);

  const stakeNum = useMemo(() => {
    const n = Number(String(stake).replace(/[^\d,.-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? Math.max(0.01, n) : 0;
  }, [stake]);

  const estPayout = 6;
  const estPotential = useMemo(() => stakeNum * estPayout, [stakeNum]);

  async function play() {
    if (loading) return;
    setErr("");
    setLast(null);
    if (!stakeNum || stakeNum <= 0) return setErr("Informe um valor de aposta válido.");
    if (target < 1 || target > 6) return setErr("Target inválido (1..6).");

    setPhraseIdx((i) => (i + 1) % phrases.length);

    setLoading(true);
    setRolling(true);
    setServerFace(null);

    const WATCH_MS = 1600;
    let resolved = false;
    const stopWith = (face, payload) => {
      if (resolved) return;
      resolved = true;
      setServerFace(face);
      setLast(payload);
    };

    try {
      const { data } = await casinoApi.dicePlay(stakeNum, target);

      let roll = Number(
        data?.roll ?? data?.resultado ?? data?.face ?? data?.result ?? NaN
      );
      const serverTarget = Number(data?.target ?? target);
      const won = typeof data?.won === "boolean" ? data.won : roll === serverTarget;

      if (!Number.isFinite(roll)) {
        roll = won
          ? serverTarget
          : [1, 2, 3, 4, 5, 6].filter((n) => n !== serverTarget)[
              Math.floor(Math.random() * 5)
            ];
      }

      const payout = Number(data?.payout ?? estPayout);
      const profit =
        data?.profit !== undefined
          ? Number(data.profit)
          : won
          ? Number((payout * stakeNum - stakeNum).toFixed(2))
          : -stakeNum;

      const payload = {
        roll,
        target: serverTarget,
        won: !!won,
        payout,
        profit,
        new_balance:
          data?.new_balance !== undefined ? Number(data.new_balance) : null,
        raw: data,
      };

      setTimeout(() => stopWith(roll, payload), WATCH_MS);
    } catch (e) {
      setErr(e?.response?.data?.erro || e?.message || "Falha ao jogar.");
      const r = 1 + Math.floor(Math.random() * 6);
      const w = r === target;
      const profit = w
        ? Number((6 * stakeNum - stakeNum).toFixed(2))
        : -stakeNum;
      const payload = {
        roll: r,
        target,
        won: w,
        payout: 6,
        profit,
        new_balance: null,
        raw: null,
      };
      setTimeout(() => stopWith(r, payload), 900);
    }
  }

  const onDiceStop = async () => {
    setRolling(false);
    setLoading(false);

    if (soundOn && last) {
      try {
        (last.won ? sfx.current.win : sfx.current.lose).play();
      } catch {}
    }

    setFxType(last?.won ? "confetti" : "sparks");
    setFxKey((k) => k + 1);

    if (last?.new_balance !== null && Number.isFinite(last.new_balance)) {
      setSaldo(last.new_balance);
    } else {
      await loadSaldo();
    }

    setHist((h) => {
      const base = Array.isArray(h) ? h : [];
      const item = {
        id: Date.now(),
        created_at: new Date().toISOString(),
        roll: last?.roll,
        target: last?.target,
        stake: stakeNum,
        won: last?.won,
        result: last?.won ? "WIN" : "LOSE",
        valor: stakeNum,
      };
      return [item, ...base].slice(0, 10);
    });
    loadHist();
  };

  /* ---------------- visuais da página ---------------- */
  const page = {
    minHeight: "100vh",
    color: "#eaecef",
    background:
      "radial-gradient(1400px 800px at 80% -10%, #1b2552, transparent 65%)," +
      "radial-gradient(1200px 700px at 10% -10%, #4c1d95, transparent 60%)," +
      "#050816",
  };
  const inner = {
    maxWidth: 1080,
    margin: "0 auto",
    padding: "24px 16px",
    position: "relative",
  };
  const grid = {
    display: "grid",
    gap: 16,
    gridTemplateColumns: isMobile ? "1fr" : "1.1fr .9fr",
    alignItems: "start",
  };
  const card = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.015)), rgba(8,12,20,.92)",
    border: "1px solid rgba(255,220,130,.25)",
    borderRadius: 14,
    padding: 16,
    boxShadow:
      "0 0 18px rgba(255,215,128,.06), inset 0 1px 0 rgba(255,255,255,.03)",
    position: "relative",
    overflow: "hidden",
  };
  const chip = (active, color = "#10b981") => ({
    minWidth: 44,
    textAlign: "center",
    padding: "8px 0",
    borderRadius: 10,
    border: `1px solid ${active ? color : "rgba(120,140,170,.35)"}`,
    background: active ? color + "33" : "#0c1220",
    color: active ? "#fff6cc" : "#eaecef",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
  });
  const btn = (disabled) => ({
    background: disabled
      ? "linear-gradient(180deg, rgba(255,215,128,.35), rgba(245,184,92,.25))"
      : "linear-gradient(180deg, #ffd780, #f5b65c)",
    color: "#2a1a05",
    border: "1px solid rgba(255,215,128,.65)",
    borderRadius: 12,
    padding: "12px 14px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 900,
    width: "100%",
    boxShadow: disabled
      ? "none"
      : "0 10px 40px rgba(255,215,128,.25), 0 0 0 1px rgba(255,215,128,.35) inset",
  });

  return (
    <div style={page}>
      <style>{`
        @keyframes pulseRow { 0%,100%{opacity:.78} 50%{opacity:1} }
      `}</style>

      <div style={inner}>
        {/* header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <img
            src="/dama-bet-logo.png"
            alt="Tiger 67"
            height={isMobile ? 28 : 34}
            style={{
              filter: "drop-shadow(0 0 6px rgba(255,215,128,.25))",
            }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 20 : 24,
              letterSpacing: 0.3,
              textShadow: "0 0 12px rgba(255,215,128,.25)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Dice <span style={{ opacity: 0.85 }}>(escolha 1–6)</span>
          </h1>
        </div>

        {/* frase */}
        <div
          style={{
            marginBottom: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,220,130,.25)",
            background:
              "linear-gradient(180deg, rgba(255,230,168,.10), rgba(255,230,168,.03))",
            color: "#ffe6a8",
            fontSize: isMobile ? 13 : 14,
            boxShadow: "0 0 18px rgba(255,215,128,.08) inset",
          }}
        >
          <span>⚜️</span> {phrases[phraseIdx]}
        </div>

        {/* controles topo */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 8,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.9 }}>
            Tema:&nbsp;
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                background: "#020617",
                border: "1px solid #253047",
                color: "#eaecef",
                borderRadius: 6,
                padding: "6px 8px",
              }}
            >
              <option value="gold">Gold</option>
              <option value="emerald">Emerald</option>
              <option value="neon">Neon Blue</option>
              <option value="crimson">Crimson</option>
            </select>
          </div>
          <label
            style={{
              fontSize: 12,
              opacity: 0.9,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <input
              type="checkbox"
              checked={soundOn}
              onChange={(e) => setSoundOn(e.target.checked)}
            />{" "}
            Som
          </label>
        </div>

        <div style={grid}>
          {/* Jogo */}
          <div style={card}>
            <DiceVisual
              size={DICE_SIZE}
              theme={theme}
              rolling={rolling}
              finalFace={serverFace}
              onStop={onDiceStop}
              soundOn={soundOn}
              sfx={sfx}
            />

            {/* FX overlay */}
            {last && (
              <FXCanvas key={fxKey} triggerKey={fxKey} type={fxType} />
            )}

            {err && (
              <div
                style={{
                  background: "#2a0f10",
                  border: "1px solid #7f1d1d",
                  color: "#fecaca",
                  borderRadius: 8,
                  padding: "8px 10px",
                  marginBottom: 10,
                }}
              >
                {err}
              </div>
            )}

            {last && !rolling && (
              <div
                style={{
                  background: last.won
                    ? "linear-gradient(180deg, rgba(255,215,128,.15), rgba(255,215,128,.05))"
                    : "linear-gradient(180deg, rgba(239,68,68,.15), rgba(239,68,68,.05))",
                  border: `1px solid ${
                    last.won
                      ? "rgba(255,215,128,.55)"
                      : "rgba(239,68,68,.55)"
                  }`,
                  color: last.won ? "#fff0a8" : "#fecaca",
                  borderRadius: 12,
                  padding: 10,
                  marginBottom: 8,
                }}
              >
                <b>{last.won ? "Você venceu! 🎉" : "Você perdeu"}</b>
                <div style={{ marginTop: 6 }}>
                  Saiu: <b>{last.roll}</b> — Seu número:{" "}
                  <b>{last.target}</b> — Payout: <b>{last.payout}x</b>
                </div>
                <div style={{ marginTop: 4 }}>
                  {last.profit >= 0 ? "Lucro" : "Prejuízo"}:{" "}
                  <b>{money(last.profit)}</b>
                </div>
              </div>
            )}

            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
              Saldo disponível
            </div>
            <div
              style={{
                marginBottom: 8,
                fontWeight: 700,
                color: "#fff6cc",
                textShadow: "0 0 10px rgba(255,215,128,.25)",
              }}
            >
              {saldo === null ? "—" : money(saldo)}
            </div>

            <div style={{ fontSize: 13, opacity: 0.85 }}>Valor da aposta</div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                style={{
                  width: "100%",
                  background: "#020617",
                  border: "1px solid rgba(255,220,130,.28)",
                  color: "#eaecef",
                  borderRadius: 10,
                  padding: "10px 12px",
                  boxShadow: "0 0 12px rgba(255,215,128,.08) inset",
                }}
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="Ex.: 1,00"
                disabled={loading}
              />
              {["1,00", "5,00", "10,00"].map((v) => (
                <button
                  key={v}
                  type="button"
                  style={chip(stake === v)}
                  onClick={() => setStake(v)}
                  disabled={loading}
                >
                  R$ {v.replace(",00", "")}
                </button>
              ))}
            </div>

            <div
              style={{
                fontSize: 13,
                opacity: 0.85,
                marginTop: 10,
              }}
            >
              Escolha seu número (1 a 6)
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  style={chip(target === n, "#22c55e")}
                  onClick={() => setTarget(n)}
                  disabled={loading}
                >
                  {n}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
              Payout estimado <b>6x</b>. Potencial:{" "}
              <b>{money(estPotential)}</b>.
            </div>

            <div style={{ marginTop: 14 }}>
              <button
                style={btn(loading || !stakeNum)}
                onClick={play}
                disabled={loading || !stakeNum}
              >
                {loading ? "Rolando…" : "Jogar"}
              </button>
            </div>
          </div>

          {/* Histórico */}
          <div style={card}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>
              Histórico recente
            </div>
            {histLoading ? (
              <div>Carregando…</div>
            ) : hist.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Sem partidas recentes.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    fontSize: 14,
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr style={{ opacity: 0.85 }}>
                      <th
                        style={{
                          padding: "8px 10px",
                          borderTop:
                            "1px solid rgba(255,255,255,.06)",
                        }}
                      >
                        Quando
                      </th>
                      <th
                        style={{
                          padding: "8px 10px",
                          borderTop:
                            "1px solid rgba(255,255,255,.06)",
                        }}
                      >
                        Saiu
                      </th>
                      <th
                        style={{
                          padding: "8px 10px",
                          borderTop:
                            "1px solid rgba(255,255,255,.06)",
                        }}
                      >
                        Escolha
                      </th>
                      <th
                        style={{
                          padding: "8px 10px",
                          borderTop:
                            "1px solid rgba(255,255,255,.06)",
                          textAlign: "right",
                        }}
                      >
                        Aposta
                      </th>
                      <th
                        style={{
                          padding: "8px 10px",
                          borderTop:
                            "1px solid rgba(255,255,255,.06)",
                        }}
                      >
                        Resultado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {hist.map((r, i) => (
                      <tr
                        key={r.id || i}
                        style={{
                          animation:
                            i < 3
                              ? "pulseRow 2s ease-in-out"
                              : "none",
                        }}
                      >
                        <td
                          style={{
                            padding: "8px 10px",
                            borderTop:
                              "1px dashed rgba(255,255,255,.08)",
                          }}
                        >
                          {r.created_at
                            ? new Date(
                                r.created_at
                              ).toLocaleString("pt-BR")
                            : "—"}
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            borderTop:
                              "1px dashed rgba(255,255,255,.08)",
                          }}
                        >
                          {r.roll ?? r.result ?? "—"}
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            borderTop:
                              "1px dashed rgba(255,255,255,.08)",
                          }}
                        >
                          {r.target ?? r.escolha ?? "—"}
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            borderTop:
                              "1px dashed rgba(255,255,255,.08)",
                            textAlign: "right",
                          }}
                        >
                          {money(r.stake ?? r.valor ?? 0)}
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            borderTop:
                              "1px dashed rgba(255,255,255,.08)",
                          }}
                        >
                          {r.won === true || r.result === "WIN"
                            ? "✅"
                            : r.won === false || r.result === "LOSE"
                            ? "❌"
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                opacity: 0.75,
              }}
            >
              * Depende de <code>/cassino/dice/minhas</code>.
            </div>
          </div>
        </div>

        {/* rodapé responsável */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 10,
            alignItems: "center",
            fontSize: 12,
            color: "#ffe6a8",
          }}
        >
          <span>🔞 +18</span>
          <span>Jogue com responsabilidade</span>
          <span style={{ marginLeft: "auto" }}>
            Tiger 67 • Entretenimento
          </span>
        </div>
      </div>
    </div>
  );
}
