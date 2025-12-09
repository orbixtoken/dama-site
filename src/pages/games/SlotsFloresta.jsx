// src/pages/jogos/SlotsFloresta.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, casinoApi, financeApi } from "../../lib/api";
import useIsMobile from "../../hooks/useIsMobile";

/* ===================== Helpers / Consts ===================== */
// Tema Floresta Mística
const SYMBOLS = ["🍀", "🍄", "🦊", "🦉", "💎", "7️⃣"];
const money = (n) =>
  `R$ ${Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

function computeSnapOffset(currentOffset, targetIndex, totalLen, itemH, visible) {
  const cycle = totalLen * itemH;
  const topIndex = (targetIndex - Math.floor(visible / 2) + totalLen) % totalLen;
  let ideal = Math.floor(currentOffset / cycle) * cycle + topIndex * itemH;
  if (ideal < currentOffset) ideal += cycle;
  return ideal;
}

/* ===================== Visual: Shine / CSS ===================== */
const globalCSS = `
@keyframes db-glow-pulse {
  0%,100% { box-shadow: 0 0 0 rgba(34,197,94,0), 0 0 0 rgba(34,197,94,0); transform: translateY(0) }
  50%     { box-shadow: 0 0 26px rgba(74,222,128,.5), 0 0 3px rgba(22,163,74,.7) inset; }
}
@keyframes db-sweep {
  0%   { transform: translateX(-120%); opacity: .0; }
  30%  { opacity: .9; }
  60%  { opacity: .9; }
  100% { transform: translateX(120%); opacity: 0; }
}
@keyframes db-win-flash {
  0%   { opacity: 0 }
  10%  { opacity: .7 }
  100% { opacity: 0 }
}
.db-shimmer {
  position: absolute; top:0; bottom:0; left:0; right:0; overflow:hidden; pointer-events:none;
}
.db-shimmer::before{
  content:""; position:absolute; top:0; bottom:0; width:40%;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.14) 50%, rgba(255,255,255,0) 100%);
  filter: blur(2px);
  animation: db-sweep 2.7s linear infinite;
}

/* Luzes topo estilo vagalume / verde */
.dm-light-strip {
  position:absolute;
  left:12px;
  right:12px;
  height:8px;
  background-image: radial-gradient(circle, rgba(190,242,100,.98) 0, rgba(190,242,100,.98) 3px, transparent 4px);
  background-size:26px 14px;
  background-repeat:repeat-x;
  opacity:.9;
  filter: drop-shadow(0 0 10px rgba(132,204,22,.95));
  animation: dm-light-move 2s linear infinite;
  pointer-events:none;
}
.dm-light-strip-top { top:6px; }
.dm-light-strip-bottom { bottom:6px; transform: scaleY(-1); }

.dm-machine-title-wrap {
  display:flex;
  align-items:center;
  justify-content:center;
  gap:6px;
  padding:5px 14px;
  border-radius:18px 18px 24px 24px;
  background:linear-gradient(180deg,#facc15,#22c55e,#166534);
  border:1px solid rgba(22,101,52,.9);
  box-shadow:0 14px 40px rgba(21,128,61,.9);
  animation: dm-title-glow 2s ease-in-out infinite;
}
.dm-machine-title {
  text-transform:uppercase;
  letter-spacing:2px;
  font-weight:900;
  font-size:13px;
  color:#041316;
  text-shadow:0 1px 0 rgba(255,255,255,.85);
}

@keyframes dm-light-move {
  from { background-position-x:0; }
  to   { background-position-x:26px; }
}
@keyframes dm-title-glow {
  0%,100% { box-shadow:0 0 26px rgba(132,204,22,.9); }
  50%     { box-shadow:0 0 32px rgba(34,197,94,.95); }
}
`;

/* ===================== CoinBurst (mantém ouro) ===================== */
function CoinBurst({ trigger }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let t0 = performance.now();

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const N = 26;
    const coins = Array.from({ length: N }, () => ({
      x: canvas.clientWidth * (0.2 + Math.random() * 0.6),
      y: -20 - Math.random() * 40,
      r: 8 + Math.random() * 10,
      vy: 1.4 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 1.2,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.2,
      life: 1200 + Math.random() * 700,
    }));

    function drawCoin(c) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, c.r);
      grad.addColorStop(0, "#fff6c8");
      grad.addColorStop(0.45, "#ffe08a");
      grad.addColorStop(0.75, "#f2b84c");
      grad.addColorStop(1, "#c78a2a");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(80,50,10,.35)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(-c.r * 0.3, -c.r * 0.3, c.r * 0.5, c.r * 0.35, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const loop = (now) => {
      const dt = Math.min(32, now - t0);
      t0 = now;
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      coins.forEach((c) => {
        c.vy += 0.018 * dt;
        c.x += c.vx * dt * 0.06;
        c.y += c.vy * dt * 0.06;
        c.rot += c.vr * dt * 0.06;
        c.life -= dt;
        drawCoin(c);
      });

      const alive = coins.some((c) => c.life > 0 && c.y < canvas.clientHeight + 40);
      if (alive) {
        raf = requestAnimationFrame(loop);
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [trigger]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <canvas
        ref={ref}
        style={{ width: "100%", height: "100%", display: "block" }}
        aria-hidden
      />
    </div>
  );
}

/* ===================== Reel ===================== */
function Reel({
  spinning,
  targetIndex,
  spinMs,
  symbols,
  itemH,
  fontSize,
  visible,
  aspect,
  onStop,
}) {
  const total = symbols.length;
  const LONG = useMemo(
    () => Array.from({ length: total * 20 }, (_, i) => symbols[i % total]),
    [symbols, total]
  );

  const [offset, setOffset] = useState(0);
  const raf = useRef(null);
  const t0 = useRef(0);
  const DECEL_MS = 600;

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (!spinning) return;

    t0.current = performance.now();
    let phase = "spin";
    const spinEndAt = t0.current + spinMs;
    const decelEndAt = spinEndAt + DECEL_MS;

    const cycle = symbols.length * itemH;
    const baseSpeed = 18 + Math.random() * 6;
    let last = t0.current;

    const tick = (now) => {
      const dt = Math.max(0, now - last);
      last = now;

      if (phase === "spin") {
        setOffset((prev) => prev + baseSpeed * (dt / (1000 / 60)));
        if (now >= spinEndAt) phase = "decel";
      } else {
        setOffset((prev) => {
          const targetOff = computeSnapOffset(
            prev,
            targetIndex,
            symbols.length,
            itemH,
            visible
          );
          const remain = Math.max(0, decelEndAt - now);
          const p = 1 - remain / DECEL_MS;
          const eased = 1 - Math.pow(1 - p, 3);
          const next = prev + (targetOff - prev) * eased;
          if (now >= decelEndAt - 0.5) return targetOff;
          return next;
        });
        if (now >= decelEndAt) {
          onStop?.();
          return;
        }
      }
      setOffset((prev) => (prev % cycle) + (prev < 0 ? cycle : 0));
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [spinning, targetIndex, spinMs, symbols.length, itemH, visible, onStop]);

  const wrapH = itemH * visible;

  return (
    <div
      style={{
        height: wrapH,
        width: itemH * aspect,
        borderRadius: 16,
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(5,46,22,.98), rgba(5,30,16,1))",
        boxShadow:
          "inset 0 0 0 1px rgba(22,101,52,.65), 0 8px 30px rgba(2,6,23,.9)",
      }}
    >
      {/* Moldura verde/dourada via mask */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          padding: 1,
          background:
            "conic-gradient(from 0deg, #bbf7d0, #22c55e, #facc15, #16a34a, #bbf7d0)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          boxShadow: "0 0 18px rgba(22,163,74,.9)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(900px 320px at 50% -80px, rgba(190,242,100,.35), rgba(5,30,16,1))",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: itemH,
          left: 0,
          right: 0,
          height: 2,
          background:
            "linear-gradient(90deg, transparent, rgba(190,242,100,.95), transparent)",
          filter: "drop-shadow(0 0 10px rgba(132,204,22,.9))",
          opacity: 0.95,
        }}
      />

      <div className="db-shimmer" />

      <div style={{ transform: `translateY(${-offset}px)`, willChange: "transform" }}>
        {LONG.map((s, i) => (
          <div
            key={i}
            style={{
              height: itemH,
              display: "grid",
              placeItems: "center",
              userSelect: "none",
              fontSize,
              textShadow:
                "0 10px 24px rgba(0,0,0,.8), 0 0 16px rgba(34,197,94,.85)",
            }}
          >
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== Page ===================== */
export default function SlotsFloresta() {
  const isMobile = useIsMobile(880);
  const isTiny = useIsMobile(420);

  const VISIBLE = 3;

  const reelsWrapRef = useRef(null);
  const [reelGeom, setReelGeom] = useState(() => ({
    itemH: 68,
    font: 32,
    gap: 10,
    aspect: 1.8,
  }));

  useEffect(() => {
    const el = reelsWrapRef.current;
    if (!el) return;

    const compute = () => {
      const pad = isMobile ? 8 : 14;
      const gap = isMobile ? 10 : 14;
      const colCount = 3;
      const aspect = isMobile ? 1.8 : 1.6;

      const wrapWidth = el.clientWidth - pad * 2;
      const reelWidth = Math.max(80, (wrapWidth - gap * (colCount - 1)) / colCount);

      let itemH = reelWidth / aspect;
      const vh = Math.max(480, window.innerHeight || 800);
      const maxByHeight = Math.floor((vh * 0.22) / VISIBLE);
      itemH = Math.min(itemH, maxByHeight);

      const minH = isTiny ? 58 : isMobile ? 58 : 92;
      const maxH = isTiny ? 74 : isMobile ? 78 : 140;
      itemH = Math.max(minH, Math.min(maxH, itemH));

      const font = Math.round(itemH * (isMobile ? 0.46 : 0.5));
      setReelGeom({ itemH, font, gap, aspect });
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener("orientationchange", compute);
    window.addEventListener("resize", compute);
    return () => {
      try {
        ro.disconnect();
      } catch {}
      window.removeEventListener("orientationchange", compute);
      window.removeEventListener("resize", compute);
    };
  }, [isMobile, isTiny, VISIBLE]);

  const SPIN_MS = isMobile ? [1100, 1350, 1600] : [1600, 2000, 2400];

  const [bet, setBet] = useState("1,00");
  const [spinning, setSpinning] = useState(false);
  const [targets, setTargets] = useState([0, 0, 0]);
  const [result, setResult] = useState(null);
  const [saldo, setSaldo] = useState(0);
  const [winBurstKey, setWinBurstKey] = useState(0);
  const [phraseIdx, setPhraseIdx] = useState(0);

  const phrases = [
    "🌿 A Floresta da Sorte guarda segredos para quem gira com coragem.",
    "🍀 Cada giro pode acordar o espírito da fortuna.",
    "🦊 A raposa observa... e às vezes libera um prêmio inesperado.",
  ];

  const [hist, setHist] = useState({ items: [], page: 1, pageSize: 10, total: 0 });

  const [soundOn, setSoundOn] = useState(true);
  const sfx = useRef(null);
  useEffect(() => {
    if (!sfx.current) {
      sfx.current = {
        spin: new Audio("/sfx/slot-spin.wav"),
        stop: new Audio("/sfx/slot-stop.wav"),
        win: new Audio("/sfx/win.wav"),
        lose: new Audio("/sfx/lose.wav"),
      };
      sfx.current.spin.loop = true;
      [sfx.current.spin, sfx.current.stop, sfx.current.win, sfx.current.lose].forEach(
        (a) => {
          a.preload = "auto";
          a.load?.();
          a.volume = 0.55;
        }
      );
    }
    return () => {
      try {
        sfx.current?.spin?.pause();
      } catch {}
    };
  }, []);

  const [spinId, setSpinId] = useState(0);
  const inFlightRef = useRef(false);
  const remainingStops = useRef(0);
  const onStopRef = useRef(null);
  const reelStop = useCallback(() => {
    onStopRef.current && onStopRef.current();
  }, []);

  const loadHistory = async () => {
    try {
      const { data } = await casinoApi.minhasSlotsCommon();
      const items = Array.isArray(data)
        ? data.map((r) => ({
            id: r.id,
            criado_em: r.criado_em || r.resolvido_em,
            aposta: Number(r.stake ?? r.aposta_valor ?? 0),
            premio: Number(r.payout_total ?? r.payout ?? 0),
            saldo_depois: r.saldo_depois ?? null,
          }))
        : [];
      setHist({ items, page: 1, pageSize: 10, total: items.length });
    } catch {
      setHist((h) => ({ ...h, items: [] }));
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await financeApi.saldo();
        const s = Number(r?.data?.saldo_disponivel ?? r?.data?.saldo ?? 0);
        setSaldo(s);
      } catch {
        try {
          const r2 = await api.get("/saldo");
          const s2 = Number(r2?.data?.saldo_disponivel ?? r2?.data?.saldo ?? 0);
          setSaldo(s2);
        } catch {
          setSaldo(0);
        }
      }
      loadHistory();
    })();
  }, []);

  const betValue = useMemo(() => {
    const n = Number(String(bet).replace(/[^\d,.-]/g, "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [bet]);

  const play = useCallback(async () => {
    if (spinning || inFlightRef.current) return;

    setPhraseIdx((i) => (i + 1) % phrases.length);

    setResult(null);
    inFlightRef.current = true;
    remainingStops.current = 3;

    const rolos = [
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
    ];
    const respRef = { current: null };

    const finish = (dataResp) => {
      const payout = Number(dataResp?.payout || 0);
      const mult = Number(dataResp?.mult || 0);
      const saldoDepois = Number(
        dataResp?.saldo_depois ?? saldo - betValue + (payout || 0)
      );
      const ok = payout > 0;

      setResult({
        ok,
        premio: payout,
        saldo: saldoDepois,
        msg: ok
          ? `🍀 A floresta respondeu! Multiplicador x${mult.toFixed(2)} liberado.`
          : "A mata ficou em silêncio desta vez — tente outro giro.",
      });
      setSaldo(saldoDepois);

      if (soundOn) {
        try {
          sfx.current.spin.pause();
          (ok ? sfx.current.win : sfx.current.lose).play();
        } catch {}
      }
      if (ok) {
        setWinBurstKey((k) => k + 1);
      }

      setSpinning(false);
      inFlightRef.current = false;
      loadHistory();
    };

    const onAnyStop = () => {
      try {
        if (soundOn) {
          sfx.current.stop.currentTime = 0;
          sfx.current.stop.play();
        }
      } catch {}
      remainingStops.current -= 1;
      if (remainingStops.current <= 0) finish(respRef.current);
    };
    onStopRef.current = onAnyStop;

    setTargets(rolos);
    setSpinId((x) => x + 1);
    setSpinning(true);
    if (soundOn) {
      try {
        sfx.current.spin.currentTime = 0;
        sfx.current.spin.play();
      } catch {}
    }

    try {
      const { data } = await casinoApi.slotsCommonPlay(betValue);
      respRef.current = data;
    } catch {
      respRef.current = { payout: 0, mult: 0, saldo_depois: saldo - betValue };
    }
  }, [betValue, loadHistory, saldo, soundOn, spinning, phrases.length]);

  const btnDisabled = spinning || betValue <= 0 || betValue > saldo;

  /* ===================== Styles ===================== */
  const pageStyle = {
    minHeight: "100vh",
    color: "#dcfce7",
    padding: isMobile ? "12px 10px" : "28px 16px",
    background:
      "radial-gradient(1100px 600px at 20% -120px, #14532d, transparent 60%)," +
      "radial-gradient(1200px 700px at 80% 120%, #052e16, #020617 65%)",
    position: "relative",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1.2fr .9fr",
    gap: isMobile ? 10 : 20,
    alignItems: "start",
  };

  const boxStyle = {
    borderRadius: 14,
    padding: isMobile ? 10 : 16,
    border: "1px solid rgba(22,101,52,.7)",
    background:
      "linear-gradient(180deg, rgba(6,24,15,.96), rgba(5,20,12,.98))," +
      "radial-gradient(900px 320px at 10% -40px, rgba(34,197,94,.35), transparent 70%)",
    boxShadow: "0 1px 0 rgba(22,163,74,.4) inset, 0 0 30px rgba(2,6,23,.9)",
  };

  const machineShellStyle = {
    marginTop: 4,
    borderRadius: 22,
    padding: isMobile ? 10 : 14,
    background:
      "radial-gradient(1100px 480px at 50% -40px, rgba(34,197,94,.82), rgba(6,24,15,1))",
    boxShadow: "0 20px 70px rgba(2,6,23,1)",
    border: "1px solid rgba(22,101,52,.9)",
    position: "relative",
    overflow: "hidden",
  };

  const machineTopStyle = {
    display: "flex",
    justifyContent: "center",
    marginBottom: isMobile ? 8 : 10,
  };

  const machineBottomStyle = {
    marginTop: isMobile ? 8 : 10,
    display: "flex",
    justifyContent: "center",
    fontSize: isMobile ? 11 : 12,
    opacity: 0.9,
    color: "#bbf7d0",
    textShadow: "0 0 10px rgba(34,197,94,.8)",
  };

  const reelsWrapStyle = {
    position: "relative",
    display: "flex",
    gap: reelGeom.gap,
    padding: isMobile ? 8 : 14,
    borderRadius: 18,
    border: "1px solid rgba(34,197,94,.75)",
    background:
      "linear-gradient(180deg, rgba(6,24,15,1), rgba(4,20,11,.98))," +
      "radial-gradient(1000px 420px at 50% -20%, rgba(34,197,94,.35), rgba(6,24,15,1))",
    justifyContent: "center",
    flexWrap: "nowrap",
    boxShadow:
      "inset 0 0 0 1px rgba(22,163,74,.5), 0 12px 60px rgba(5,46,22,.9)",
  };

  return (
    <div style={pageStyle}>
      <style>{globalCSS}</style>

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(1200px 900px at 80% -20%, rgba(190,242,100,.35), transparent 65%)",
          pointerEvents: "none",
          maskImage:
            "radial-gradient(700px 450px at 60% 15%, black 40%, transparent 85%)",
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: isMobile ? "0 0 12px" : "0 0 18px",
          }}
        >
          <img
            src="/dama-bet-logo.png"
            alt="Tiger 67"
            height={isMobile ? 28 : 34}
            style={{ filter: "drop-shadow(0 0 6px rgba(34,197,94,.7))" }}
          />
          <h1
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              margin: 0,
              fontSize: isMobile ? 20 : 24,
              letterSpacing: 0.2,
              textShadow:
                "0 1px 0 #000, 0 0 16px rgba(34,197,94,.95), 0 0 30px rgba(190,242,100,.9)",
            }}
          >
            Slots <span style={{ opacity: 0.9 }}>— Floresta da Sorte</span>
          </h1>
        </div>

        {/* Frase destaque */}
        <div
          style={{
            marginBottom: 10,
            fontSize: isMobile ? 13 : 14,
            color: "#dcfce7",
            opacity: 0.98,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid rgba(34,197,94,.7)",
            background:
              "linear-gradient(90deg, rgba(4,120,87,.9), rgba(101,163,13,.85))",
            boxShadow:
              "0 0 24px rgba(34,197,94,.75), 0 0 28px rgba(190,242,100,.7)",
          }}
        >
          <span>🌲</span> {phrases[phraseIdx]}
        </div>

        <div style={gridStyle}>
          {/* Jogo */}
          <div style={{ ...boxStyle, position: "relative" }}>
            {/* Som */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
                fontSize: 12,
                opacity: 0.9,
              }}
            >
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={soundOn}
                  onChange={(e) => setSoundOn(e.target.checked)}
                />{" "}
                Som
              </label>
            </div>

            {/* Saldo */}
            <div style={{ fontSize: 13, opacity: 0.88, marginBottom: 6 }}>
              Saldo disponível
            </div>
            <div
              style={{
                fontWeight: 800,
                marginBottom: 10,
                color: "#bbf7d0",
                textShadow:
                  "0 0 10px rgba(34,197,94,.9), 0 0 16px rgba(190,242,100,.9)",
              }}
            >
              {money(saldo)}
            </div>

            {/* Aposta */}
            <div style={{ fontSize: 13, opacity: 0.88, marginBottom: 6 }}>
              Valor da aposta
            </div>
            <input
              value={bet}
              onChange={(e) => setBet(e.target.value)}
              placeholder="1,00"
              style={{
                width: "100%",
                background: "rgba(3,22,11,.98)",
                border: "1px solid rgba(34,197,94,.7)",
                color: "#dcfce7",
                borderRadius: 10,
                padding: "8px 10px",
                marginBottom: 10,
                boxShadow: "0 0 18px rgba(22,163,74,.45) inset",
              }}
            />

            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              {[1, 2, 5, 10].map((v) => (
                <button
                  key={v}
                  onClick={() =>
                    setBet(v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }))
                  }
                  style={{
                    border: "1px solid rgba(190,242,100,.9)",
                    background:
                      "linear-gradient(135deg, rgba(21,128,61,.95), rgba(132,204,22,.9))",
                    color: "#f7fee7",
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow:
                      "0 0 14px rgba(34,197,94,.9), 0 0 20px rgba(190,242,100,.9) inset",
                  }}
                >
                  R$ {v}
                </button>
              ))}
            </div>

            {/* Botão GIRO */}
            <button
              disabled={btnDisabled}
              onClick={play}
              style={{
                background: btnDisabled
                  ? "linear-gradient(135deg, rgba(34,197,94,.4), rgba(132,204,22,.35))"
                  : "linear-gradient(135deg, #bbf7d0, #22c55e, #a3e635)",
                color: "#052e16",
                border: "1px solid rgba(190,242,100,.95)",
                padding: "10px 14px",
                borderRadius: 14,
                fontWeight: 900,
                letterSpacing: 0.7,
                cursor: btnDisabled ? "not-allowed" : "pointer",
                marginBottom: 12,
                boxShadow: btnDisabled
                  ? "0 0 0"
                  : "0 12px 50px rgba(22,163,74,.9), 0 0 0 1px rgba(190,242,100,.95) inset",
                animation: btnDisabled ? "none" : "db-glow-pulse 1.7s ease-in-out infinite",
                transform: "translateZ(0)",
              }}
            >
              {spinning ? "Girando..." : "GIRO NA FLORESTA!"}
            </button>

            {/* Máquina */}
            <div style={machineShellStyle}>
              <div style={machineTopStyle}>
                <div className="dm-machine-title-wrap">
                  <span>🍀</span>
                  <span className="dm-machine-title">Floresta da Sorte</span>
                  <span>🦊</span>
                </div>
              </div>

              <div ref={reelsWrapRef} style={reelsWrapStyle}>
                <div className="dm-light-strip dm-light-strip-top" />
                <div className="dm-light-strip dm-light-strip-bottom" />

                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 14,
                    right: 14,
                    top: 6,
                    height: 1,
                    background:
                      "linear-gradient(90deg, transparent, rgba(190,242,100,1), transparent)",
                    filter: "blur(0.4px)",
                    opacity: 0.9,
                  }}
                />

                {[0, 1, 2].map((i) => (
                  <Reel
                    key={`${spinId}-${i}`}
                    spinning={spinning}
                    targetIndex={targets[i] ?? 0}
                    spinMs={SPIN_MS[i % SPIN_MS.length]}
                    symbols={SYMBOLS}
                    itemH={reelGeom.itemH}
                    fontSize={reelGeom.font}
                    visible={3}
                    aspect={reelGeom.aspect}
                    onStop={reelStop}
                  />
                ))}

                {result?.ok && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 18,
                      background:
                        "radial-gradient(600px 220px at 50% 40%, rgba(190,242,100,.55), transparent 70%)",
                      animation: "db-win-flash 900ms ease-out",
                      pointerEvents: "none",
                    }}
                  />
                )}

                <CoinBurst key={winBurstKey} trigger={!!result?.ok} />
              </div>

              <div style={machineBottomStyle}>
                <span>
                  Clique em GIRO NA FLORESTA e descubra se a natureza vai revelar um 7️⃣
                  premiado.
                </span>
              </div>
            </div>

            {/* dica */}
            <div style={{ opacity: 0.75, fontSize: 12, marginTop: 8 }}>
              * Animação local; o resultado oficial vem do servidor após a rolagem.
            </div>

            {/* resultado */}
            {result && (
              <div
                style={{
                  marginTop: 10,
                  borderRadius: 12,
                  padding: "10px 12px",
                  border: `1px solid ${
                    result.ok ? "rgba(34,197,94,.9)" : "rgba(248,113,113,.85)"
                  }`,
                  background: result.ok
                    ? "linear-gradient(180deg, rgba(34,197,94,.24), rgba(22,101,52,.18))"
                    : "linear-gradient(180deg, rgba(248,113,113,.22), rgba(127,29,29,.16))",
                  color: result.ok ? "#dcfce7" : "#fee2e2",
                  boxShadow: result.ok
                    ? "0 0 30px rgba(34,197,94,.45) inset"
                    : "0 0 24px rgba(248,113,113,.4) inset",
                  fontSize: isMobile ? 13 : 14,
                }}
              >
                <div style={{ fontWeight: 800 }}>{result.msg}</div>
                <div style={{ opacity: 0.96 }}>
                  Prêmio: <b>{money(result.premio)}</b> • Saldo:{" "}
                  <b>{money(result.saldo)}</b>
                </div>
              </div>
            )}
          </div>

          {/* Histórico */}
          <div style={{ ...boxStyle, order: isMobile ? 2 : 0 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Histórico recente</div>

            <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
              <thead style={{ opacity: 0.9 }}>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 0" }}>Quando</th>
                  <th style={{ textAlign: "right", padding: "6px 0" }}>Aposta</th>
                  <th style={{ textAlign: "right", padding: "6px 0" }}>Prêmio</th>
                  <th style={{ textAlign: "right", padding: "6px 0" }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {hist.items.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "8px 0", opacity: 0.75 }}>
                      Sem registros.
                    </td>
                  </tr>
                )}
                {hist.items.map((it) => (
                  <tr
                    key={it.id}
                    style={{ borderTop: "1px dashed rgba(22,163,74,.45)" }}
                  >
                    <td style={{ padding: "6px 0" }}>
                      {it.criado_em ? new Date(it.criado_em).toLocaleString("pt-BR") : "—"}
                    </td>
                    <td style={{ padding: "6px 0", textAlign: "right" }}>
                      {money(it.aposta)}
                    </td>
                    <td
                      style={{
                        padding: "6px 0",
                        textAlign: "right",
                        color: Number(it.premio) > 0 ? "#bbf7d0" : "#e5e7eb",
                        textShadow:
                          Number(it.premio) > 0
                            ? "0 0 10px rgba(34,197,94,.9)"
                            : "none",
                      }}
                    >
                      {money(it.premio)}
                    </td>
                    <td style={{ padding: "6px 0", textAlign: "right" }}>
                      {it.saldo_depois == null ? "—" : money(it.saldo_depois)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ opacity: 0.55, fontSize: 12, marginTop: 8 }}>
              * Depende de <code>/cassino/slots/common/minhas</code>.
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
            opacity: 0.8,
            color: "#bbf7d0",
          }}
        >
          <span>🔞 +18</span>
          <span>Jogue com responsabilidade</span>
          <span style={{ marginLeft: "auto" }}>Tiger 67 • Entretenimento</span>
        </div>
      </div>
    </div>
  );
}
