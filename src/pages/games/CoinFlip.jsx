// src/pages/jogos/Coinflip.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { financeApi, casinoApi } from "../../lib/api";
import useIsMobile from "../../hooks/useIsMobile";

/* =============== helpers & estilo base =============== */
const fmtBRL = (v) =>
  "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
const PRESETS = [5, 10, 20, 50, 100, 200];

function canPlayMP3orWav() {
  try {
    const a = document.createElement("audio");
    return (
      !!a &&
      !!a.canPlayType &&
      (a.canPlayType("audio/mpeg") !== "" || a.canPlayType("audio/wav") !== "")
    );
  } catch {
    return false;
  }
}

const angleForFace = (face, baseTurns = 4) =>
  baseTurns * 360 + (face === "CARA" ? 0 : 180);

/* =============== Partículas (canvas) =============== */
function FXCanvas({ trigger, type = "confetti" }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let raf;
    let t0 = performance.now();

    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = canvas.clientWidth * DPR;
      canvas.height = canvas.clientHeight * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const W = () => canvas.clientWidth;
    const H = () => canvas.clientHeight;

    const N = type === "confetti" ? 50 : 36;
    const parts = Array.from({ length: N }, () => {
      const x = W() * (0.25 + Math.random() * 0.5);
      const y = H() * (type === "confetti" ? 0.35 : 0.45);
      const s = type === "confetti" ? 6 + Math.random() * 10 : 4 + Math.random() * 7;
      const vy = type === "confetti" ? -2 - Math.random() * 2 : -1.4 - Math.random() * 1.8;
      const vx = (Math.random() - 0.5) * (type === "confetti" ? 4 : 3);
      const life = 1200 + Math.random() * 800;
      const hue = 40 + Math.random() * 40; // dourados
      return { x, y, s, vy, vx, life, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2, hue };
    });

    function draw(p) {
      if (type === "confetti") {
        // retângulos dourados
        const grd = ctx.createLinearGradient(p.x, p.y - p.s, p.x, p.y + p.s);
        grd.addColorStop(0, `hsl(${p.hue}, 90%, 85%)`);
        grd.addColorStop(1, `hsl(${p.hue}, 75%, 55%)`);
        ctx.fillStyle = grd;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.s * 0.6, -p.s * 0.15, p.s * 1.2, p.s * 0.3);
        ctx.restore();
      } else {
        // faísca/poeira
        ctx.fillStyle = "rgba(255,100,80,.6)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,180,120,.5)";
        ctx.beginPath();
        ctx.arc(p.x + 0.8, p.y + 0.6, p.s * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const loop = (now) => {
      const dt = Math.min(32, now - t0);
      t0 = now;

      ctx.clearRect(0, 0, W(), H());
      parts.forEach((p) => {
        p.life -= dt;
        p.vy += 0.001 * dt; // leve gravidade
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.rot += p.vr * (dt / 16);
        draw(p);
      });

      const alive = parts.some((p) => p.life > 0 && p.y < H() + 30);
      if (alive) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [trigger, type]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}

/* =============== Componente principal =============== */
export default function Coinflip() {
  const isMobile = useIsMobile();
  const COIN = isMobile ? 130 : 200;
  const SCENE_H = isMobile ? 240 : 300;

  // UI
  const [side, setSide] = useState("CARA");
  const [stake, setStake] = useState("10");
  const [som, setSom] = useState(true);

  // app state
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState(null);
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState("");

  // animação
  const [angle, setAngle] = useState(0);
  const [transitionOn, setTransitionOn] = useState(false);
  const [fxKey, setFxKey] = useState(0);
  const [fxType, setFxType] = useState("confetti");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const phrases = [
    "💫 A Dama sorri para quem arrisca com responsabilidade.",
    "✨ Um giro elegante pode mudar o jogo.",
    "🏅 Confie no seu palpite — e na sorte dourada!",
  ];

  // sons
  const sfx = useRef({ flip: null, win: null, lose: null });
  useEffect(() => {
    if (!canPlayMP3orWav()) return;
    sfx.current.flip = new Audio("/sfx/coin-flip.wav");
    sfx.current.win = new Audio("/sfx/win.wav");
    sfx.current.lose = new Audio("/sfx/lose.wav");
    [sfx.current.flip, sfx.current.win, sfx.current.lose].forEach((a) => {
      if (a) {
        a.preload = "auto";
        a.load?.();
        a.volume = 0.6;
      }
    });
  }, []);

  // saldo
  async function fetchBalanceOnce() {
    try {
      const { data } = await financeApi.getBalance();
      const disp = Number(data?.saldo_disponivel ?? data?.saldo ?? 0);
      setBalance(disp);
    } catch {}
  }
  useEffect(() => { fetchBalanceOnce(); }, []);
  useEffect(() => {
    const onFocus = () => fetchBalanceOnce();
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchBalanceOnce();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  async function reconcileBalance(maxTries = 5, baseDelay = 350) {
    for (let i = 0; i < maxTries; i++) {
      try {
        const { data } = await financeApi.getBalance();
        const disp = Number(data?.saldo_disponivel ?? data?.saldo ?? 0);
        setBalance(disp);
        return disp;
      } catch {
        await new Promise((r) => setTimeout(r, baseDelay + i * 150));
      }
    }
    return balance;
  }

  const validStake = useMemo(() => {
    const n = Number(String(stake).replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : NaN;
  }, [stake]);

  const uiToBackend = (ui) => (ui === "CARA" ? "heads" : "tails");
  const backendToUi = (raw) => {
    const v = String(raw || "").toLowerCase();
    return v === "heads" || v === "cara" ? "CARA" : "COROA";
  };

  // fim da transição do giro
  useEffect(() => {
    const el = document.getElementById("coin3d");
    if (!el) return;
    const onEnd = async () => {
      setTransitionOn(false);
      const real = await reconcileBalance();
      setLast((prev) => (prev ? { ...prev, newBalance: real } : prev));
      if (som && last) (last.win ? sfx.current.win : sfx.current.lose)?.play?.();
      setFxKey((k) => k + 1);
      setFxType(last?.win ? "confetti" : "sparks");
    };
    el.addEventListener("transitionend", onEnd);
    return () => el.removeEventListener("transitionend", onEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [som, last]);

  async function play() {
    setErr("");
    if (!Number.isFinite(validStake) || validStake <= 0) {
      setErr("Informe um valor válido.");
      return;
    }
    if (validStake > balance) {
      setErr("Saldo insuficiente.");
      return;
    }

    setPhraseIdx((i) => (i + 1) % phrases.length);

    setLoading(true);
    if (som && sfx.current.flip) {
      try {
        sfx.current.flip.currentTime = 0;
        await sfx.current.flip.play();
      } catch {}
    }

    try {
      const bet = uiToBackend(side);
      const { data } = await casinoApi.coinflipPlay(validStake, bet);

      const resultRaw = data?.result?.side ?? data?.side ?? data?.result ?? "";
      const resultUi = backendToUi(resultRaw);
      const won = !!(data?.win ?? data?.winner ?? resultUi === side);
      const profit = Number(
        data?.payout ?? data?.profit ?? (won ? validStake : -validStake)
      );

      setLast({
        win: won,
        result: resultUi,
        profit,
        newBalance: null,
      });

      setHistory((h) =>
        [
          {
            time: new Date().toISOString(),
            sideBet: side,
            result: resultUi,
            win: won,
            stake: validStake,
            profit,
          },
          ...h,
        ].slice(0, 10)
      );

      const turns = 4 + Math.floor(Math.random() * 3); // 4..6
      const finalDeg = angleForFace(resultUi, turns);
      setTransitionOn(true);
      setAngle((prev) => {
        const base = Math.floor(prev / 360) * 360;
        return base + finalDeg;
      });
    } catch (e) {
      const msg = e?.response?.data?.erro || e?.message || "Falha ao jogar.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  /* =============== Estilos de página =============== */
  const page = {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 700px at 70% -10%, #1b2440, transparent 60%), #070b14",
    color: "#eaecef",
  };
  const inner = { maxWidth: 1100, margin: "0 auto", padding: "24px 16px", position: "relative" };
  const grid = {
    display: "grid",
    gap: 16,
    gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
    alignItems: "start",
  };
  const card = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.015)), rgba(8,12,20,.85)",
    border: "1px solid rgba(255,220,130,.25)",
    borderRadius: 14,
    padding: 16,
    boxShadow:
      "0 0 18px rgba(255,215,128,.05), inset 0 1px 0 rgba(255,255,255,.03)",
    position: "relative",
  };
  const chip = (active, color) => ({
    flex: 1,
    minWidth: isMobile ? 86 : 120,
    textAlign: "center",
    padding: isMobile ? "12px 0" : "14px 0",
    borderRadius: 12,
    border: `2px solid ${active ? color : "rgba(120,140,170,.35)"}`,
    background: active ? color + "22" : "#0c1220",
    color: active ? "#fff6cc" : "#eaecef",
    fontWeight: 900,
    fontSize: isMobile ? 14 : 16,
    cursor: "pointer",
    transition: "0.25s",
    boxShadow: active ? "0 0 10px rgba(255,215,128,.22) inset" : "none",
  });
  const btn = (disabled) => ({
    background: disabled
      ? "linear-gradient(180deg, rgba(255,215,128,.35), rgba(245,184,92,.25))"
      : "linear-gradient(180deg, #ffd780, #f5b65c)",
    color: "#2a1a05",
    border: "1px solid rgba(255,215,128,.65)",
    borderRadius: 12,
    padding: "14px",
    width: "100%",
    fontWeight: 900,
    letterSpacing: 0.4,
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled
      ? "none"
      : "0 10px 40px rgba(255,215,128,.25), 0 0 0 1px rgba(255,215,128,.35) inset",
    animation: disabled ? "none" : "db-pulse 1.8s ease-in-out infinite",
  });

  return (
    <div style={page}>
      <style>{`
        @keyframes db-pulse {
          0%,100%{ transform: translateY(0); box-shadow: 0 0 0 rgba(255,215,128,0) }
          50%{ box-shadow: 0 0 28px rgba(255,215,128,.28) }
        }
        @keyframes sweep {
          0% { transform: translateX(-130%); opacity: .0 }
          20%{ opacity: .9 }
          80%{ opacity: .9 }
          100%{ transform: translateX(130%); opacity: 0 }
        }
        .coin-scene { perspective: 1200px; position: relative; }
        .coin-sweep {
          position:absolute; inset:0; overflow:hidden; pointer-events:none;
        }
        .coin-sweep::before{
          content:""; position:absolute; top:0; bottom:0; width:38%;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.13) 50%, rgba(255,255,255,0) 100%);
          filter: blur(2px); animation: sweep 2.6s linear infinite;
        }
        .face {
          position:absolute; inset:0; display:grid; place-items:center; border-radius:50%;
          border:4px solid rgba(255,255,255,.18);
          box-shadow:0 8px 28px rgba(0,0,0,.45),
                     inset 0 2px 10px rgba(255,255,255,.30),
                     inset 0 -2px 8px rgba(0,0,0,.45);
          color:#111; font-weight:900; backface-visibility:hidden;
        }
        .cara  { background: radial-gradient(120% 120% at 50% 28%, #fff2bf, #ffd86b 45%, #c49d31 100%); }
        .coroa { background: radial-gradient(120% 120% at 50% 28%, #e8edf7, #9ea6b4 45%, #5a6070 100%); color:#0a0a0a; }
        .edge {
          position:absolute; inset:0; border-radius:50%;
          box-shadow:
            0 0 0 6px rgba(160,120,50,.25) inset,
            0 0 0 10px rgba(80,55,15,.2) inset;
          pointer-events:none;
        }
        .coin-trail {
          position:absolute; inset:0; pointer-events:none;
          background:
            radial-gradient(600px 240px at 50% 35%, rgba(255,230,160,.18), transparent 70%),
            radial-gradient(300px 120px at 50% 65%, rgba(255,215,128,.10), transparent 80%);
          opacity:.0; transition:opacity .25s ease;
        }
        .trail-on{ opacity:1; }
      `}</style>

      <div style={inner}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <img
            src="/dama-bet-logo.png"
            alt="Dama Bet"
            height={isMobile ? 28 : 34}
            style={{ filter: "drop-shadow(0 0 6px rgba(255,215,128,.25))" }}
          />
          <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, letterSpacing: .3, textShadow: "0 0 12px rgba(255,215,128,.25)" }}>
            Cara ou Coroa
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
          }}
        >
          <span>⚜️</span> {phrases[phraseIdx]}
        </div>

        <div style={grid}>
          {/* Jogo */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                Saldo:{" "}
                <b style={{ fontSize: isMobile ? 20 : 22, color: "#fff6cc", textShadow: "0 0 10px rgba(255,215,128,.25)" }}>
                  {fmtBRL(balance)}
                </b>
              </div>
              <label style={{ fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={som}
                  onChange={(e) => setSom(e.target.checked)}
                />{" "}
                Som
              </label>
            </div>

            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>Escolha</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                style={chip(side === "CARA", "#22c55e")}
                onClick={() => setSide("CARA")}
                disabled={loading || transitionOn}
              >
                🎯 Cara
              </button>
              <button
                type="button"
                style={chip(side === "COROA", "#3b82f6")}
                onClick={() => setSide("COROA")}
                disabled={loading || transitionOn}
              >
                👑 Coroa
              </button>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>
                Valor da aposta
              </div>
              <input
                style={{
                  width: "100%",
                  background: "#0c1220",
                  border: "1px solid rgba(255,220,130,.28)",
                  color: "#eaecef",
                  borderRadius: 10,
                  padding: "10px 12px",
                  boxShadow: "0 0 12px rgba(255,215,128,.08) inset",
                }}
                inputMode="decimal"
                placeholder="Ex.: 10"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                disabled={loading || transitionOn}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
                {PRESETS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={chip(Number(stake) === v, "#10b981")}
                    onClick={() => setStake(String(v))}
                    disabled={loading || transitionOn}
                  >
                    {fmtBRL(v)}
                  </button>
                ))}
              </div>
            </div>

            {err && (
              <div
                style={{
                  background: "#2a0f10",
                  border: "1px solid #7f1d1d",
                  color: "#fecaca",
                  borderRadius: 8,
                  padding: "8px 10px",
                  marginTop: 10,
                  marginBottom: 6,
                }}
              >
                {err}
              </div>
            )}

            {/* Cena da moeda */}
            <div
              className="coin-scene"
              style={{
                display: "grid",
                placeItems: "center",
                height: SCENE_H,
                borderRadius: 14,
                background:
                  "radial-gradient(900px 300px at 50% -40px, rgba(255,230,160,.08), rgba(0,0,0,.10))",
                border: "1px solid rgba(255,220,130,.28)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,.04)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div className="coin-sweep" />
              <div
                className={`coin-trail ${transitionOn ? "trail-on" : ""}`}
                aria-hidden
              />
              {/* coin */}
              <div
                id="coin3d"
                style={{
                  position: "relative",
                  width: COIN,
                  height: COIN,
                  transformStyle: "preserve-3d",
                  willChange: "transform",
                  transform: `rotateY(${angle}deg)`,
                  transition: transitionOn
                    ? "transform 1200ms cubic-bezier(.18,.8,.22,1)"
                    : "none",
                  borderRadius: "50%",
                }}
              >
                <div className="face cara" style={{ fontSize: isMobile ? 20 : 26 }}>
                  CARA
                </div>
                <div
                  className="face coroa"
                  style={{ transform: "rotateY(180deg)", fontSize: isMobile ? 20 : 26 }}
                >
                  COROA
                </div>
                <div className="edge" />
              </div>

              {/* FX */}
              <FXCanvas key={`${fxType}-${fxKey}`} trigger={!!last} type={last?.win ? "confetti" : "sparks"} />
            </div>

            <button style={btn(loading || transitionOn)} onClick={play} disabled={loading || transitionOn}>
              {transitionOn ? "Girando…" : "Jogar"}
            </button>

            {last && (
              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    background: last.win
                      ? "linear-gradient(180deg, rgba(255,215,128,.15), rgba(255,215,128,.05))"
                      : "linear-gradient(180deg, rgba(239,68,68,.15), rgba(239,68,68,.05))",
                    border: `1px solid ${
                      last.win ? "rgba(255,215,128,.55)" : "rgba(239,68,68,.55)"
                    }`,
                    borderRadius: 12,
                    padding: 12,
                    boxShadow: "0 0 18px rgba(0,0,0,.25) inset",
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>
                    Resultado:{" "}
                    <span style={{ color: last.win ? "#fff0a8" : "#fca5a5" }}>
                      {last.result} — {last.win ? "Vitória 🎉" : "Derrota"}
                    </span>
                  </div>
                  <div>Variação: {fmtBRL(last.profit)}</div>
                  <div>Saldo atualizado: {fmtBRL(last.newBalance ?? balance)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Histórico */}
          <div style={card}>
            <h2 style={{ margin: 0, marginBottom: 8 }}>Histórico recente</h2>
            {history.length === 0 ? (
              <div style={{ opacity: 0.8 }}>Sem partidas ainda.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ opacity: 0.85 }}>
                      <th style={{ textAlign: "left", padding: "6px 4px" }}>Quando</th>
                      <th style={{ textAlign: "left", padding: "6px 4px" }}>Aposta</th>
                      <th style={{ textAlign: "left", padding: "6px 4px" }}>Resultado</th>
                      <th style={{ textAlign: "right", padding: "6px 4px" }}>Stake</th>
                      <th style={{ textAlign: "right", padding: "6px 4px" }}>Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r, i) => (
                      <tr key={i} style={{ borderTop: "1px dashed rgba(255,255,255,.08)" }}>
                        <td style={{ padding: "6px 4px" }}>
                          {new Date(r.time).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: "6px 4px" }}>{r.sideBet}</td>
                        <td
                          style={{
                            padding: "6px 4px",
                            color: r.win ? "#fff0a8" : "#fca5a5",
                            textShadow: r.win ? "0 0 8px rgba(255,215,128,.25)" : "none",
                          }}
                        >
                          {r.result} {r.win ? "✓" : "✗"}
                        </td>
                        <td style={{ padding: "6px 4px", textAlign: "right" }}>
                          {fmtBRL(r.stake)}
                        </td>
                        <td
                          style={{
                            padding: "6px 4px",
                            textAlign: "right",
                            color: r.profit >= 0 ? "#fff0a8" : "#fca5a5",
                          }}
                        >
                          {fmtBRL(r.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
            opacity: 0.85,
            color: "#ffe6a8",
          }}
        >
          <span>🔞 +18</span>
          <span>Jogue com responsabilidade</span>
          <span style={{ marginLeft: "auto" }}>Dama Bet • Entretenimento</span>
        </div>
      </div>
    </div>
  );
}
