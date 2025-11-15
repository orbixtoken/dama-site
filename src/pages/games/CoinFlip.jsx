import { useEffect, useMemo, useRef, useState } from "react";
import { financeApi, casinoApi } from "../../lib/api";

const s = {
  page: { minHeight: "100vh", background: "#0c0f14", color: "#eaecef" },
  inner: { maxWidth: 960, margin: "0 auto", padding: "24px 16px" },
  grid: { display: "grid", gap: 16, gridTemplateColumns: "1fr 340px" },
  card: { background: "#0f141f", border: "1px solid #1f2533", borderRadius: 12, padding: 16 },
  h1: { margin: 0, fontSize: 22, fontWeight: 800, marginBottom: 12 },
  label: { fontSize: 13, marginBottom: 6, opacity: 0.85 },
  input: {
    width: "100%", background: "#0c1220", border: "1px solid #253047",
    color: "#eaecef", borderRadius: 8, padding: "10px 12px",
  },
  row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  chip: (active, color) => ({
    flex: 1, minWidth: 120, textAlign: "center", padding: "14px 0", borderRadius: 12,
    border: `2px solid ${active ? color : "#374151"}`,
    background: active ? color + "22" : "#101624",
    color: active ? "#fff" : "#eaecef",
    fontWeight: 800, fontSize: 16, cursor: "pointer", transition: "0.25s",
  }),
  btn: {
    background: "#10b981", color: "#0b0f14", border: 0, borderRadius: 10,
    padding: "14px", fontWeight: 800, cursor: "pointer", width: "100%",
  },
  table: { width: "100%", fontSize: 14 },
  kpi: { fontSize: 22, fontWeight: 800 },
  stat: { background: "#0e1422", border: "1px solid #1f2533", borderRadius: 10, padding: 12 },
};

const PRESETS = [5, 10, 20, 50, 100, 200];
const fmtBRL = (v) => "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

function canPlayMP3orWav() {
  try {
    const a = document.createElement("audio");
    return !!a && !!a.canPlayType && (a.canPlayType("audio/mpeg") !== "" || a.canPlayType("audio/wav") !== "");
  } catch { return false; }
}

const angleForFace = (face, baseTurns = 3) =>
  baseTurns * 360 + (face === "CARA" ? 0 : 180);

export default function Coinflip() {
  // UI
  const [side, setSide] = useState("CARA");
  const [stake, setStake] = useState("10");
  const [som, setSom] = useState(true);

  // estado
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState(null);
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState("");

  // animação controlada por ângulo (giro único)
  const [angle, setAngle] = useState(0);
  const [transitionOn, setTransitionOn] = useState(false);

  // sfx
  const sfx = useRef({ flip: null, win: null, lose: null });
  useEffect(() => {
    if (!canPlayMP3orWav()) return;
    sfx.current.flip = new Audio("/sfx/coin-flip.wav");
    sfx.current.win = new Audio("/sfx/win.wav");
    sfx.current.lose = new Audio("/sfx/lose.wav");
    [sfx.current.flip, sfx.current.win, sfx.current.lose].forEach(a => { if (a) { a.preload = "auto"; a.load?.(); a.volume = 0.5; } });
  }, []);

  // saldo inicial e quando a aba volta ao foco
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
    const onVisible = () => { if (document.visibilityState === "visible") fetchBalanceOnce(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // reconsulta com tentativas (evita divergência)
  async function reconcileBalance(maxTries = 5, baseDelay = 350) {
    for (let i = 0; i < maxTries; i++) {
      try {
        const { data } = await financeApi.getBalance();
        const disp = Number(data?.saldo_disponivel ?? data?.saldo ?? 0);
        setBalance(disp);
        return disp;
      } catch {
        await new Promise(r => setTimeout(r, baseDelay + i * 150));
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

  // termina transição (quando o giro acaba)
  useEffect(() => {
    const el = document.getElementById("coin3d");
    if (!el) return;
    const onEnd = async () => {
      setTransitionOn(false);
      const real = await reconcileBalance();
      setLast((prev) => prev ? { ...prev, newBalance: real } : prev);
      if (som && last) (last.win ? sfx.current.win : sfx.current.lose)?.play?.();
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

    setLoading(true);
    if (som && sfx.current.flip) {
      sfx.current.flip.currentTime = 0;
      sfx.current.flip.play().catch(() => {});
    }

    try {
      const bet = uiToBackend(side);
      const { data } = await casinoApi.coinflipPlay(validStake, bet);

      const resultRaw = data?.result?.side ?? data?.side ?? data?.result ?? "";
      const resultUi = backendToUi(resultRaw);
      const won = !!(data?.win ?? data?.winner ?? resultUi === side);
      const profit = Number(data?.payout ?? data?.profit ?? (won ? validStake : -validStake));

      // prepara resultado (saldo será conciliado ao final da transição)
      setLast({
        win: won,
        result: resultUi,
        profit,
        newBalance: null,
      });

      // histórico (mostramos já na UI)
      setHistory(h => ([
        {
          time: new Date().toISOString(),
          sideBet: side,
          result: resultUi,
          win: won,
          stake: validStake,
          profit,
        },
        ...h,
      ]).slice(0, 10));

      // giro único controlado por ângulo
      const turns = 3 + Math.floor(Math.random() * 3); // 3..5 voltas
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

  return (
    <div style={s.page}>
      <style>{`
        .coin-scene { perspective: 1000px; }
        .face {
          position:absolute; inset:0; display:grid; place-items:center; border-radius:50%;
          border:4px solid rgba(255,255,255,.15);
          box-shadow:0 4px 20px rgba(0,0,0,.4), inset 0 2px 8px rgba(255,255,255,.3), inset 0 -2px 6px rgba(0,0,0,.4);
          color:#0a0a0a; font-weight:900; font-size:28px; backface-visibility:hidden;
        }
        .cara  { background: radial-gradient(100% 100% at 50% 30%, #ffd86b, #c49d31); }
        .coroa { background: radial-gradient(100% 100% at 50% 30%, #9ea6b4, #5a6070); }
      `}</style>

      <div style={s.inner}>
        <h1 style={s.h1}>🪙 Cara ou Coroa</h1>

        <div style={s.grid}>
          {/* Jogo */}
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div>Saldo: <b className="kpi" style={s.kpi}>{fmtBRL(balance)}</b></div>
              <label style={{ fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={som} onChange={(e) => setSom(e.target.checked)} /> Som
              </label>
            </div>

            <div style={s.label}>Escolha</div>
            <div style={s.row}>
              <button
                type="button"
                style={s.chip(side === "CARA", "#22c55e")}
                onClick={() => setSide("CARA")}
                disabled={loading || transitionOn}
              >
                🎯 Cara
              </button>
              <button
                type="button"
                style={s.chip(side === "COROA", "#3b82f6")}
                onClick={() => setSide("COROA")}
                disabled={loading || transitionOn}
              >
                👑 Coroa
              </button>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={s.label}>Valor da aposta</div>
              <input
                style={s.input}
                inputMode="decimal"
                placeholder="Ex.: 10"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                disabled={loading || transitionOn}
              />
              <div style={{ ...s.row, marginTop: 8 }}>
                {PRESETS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={s.chip(Number(stake) === v, "#10b981")}
                    onClick={() => setStake(String(v))}
                    disabled={loading || transitionOn}
                  >
                    {fmtBRL(v)}
                  </button>
                ))}
              </div>
            </div>

            {err && (
              <div style={{ background:"#2a0f10", border:"1px solid #7f1d1d", color:"#fecaca",
                            borderRadius:8, padding:"8px 10px", marginTop:10, marginBottom:6 }}>
                {err}
              </div>
            )}

            {/* Moeda */}
            <div className="coin-scene" style={{ display: "grid", placeItems: "center", height: 260 }}>
              <div
                id="coin3d"
                className="coin"
                style={{
                  position: "relative",
                  width: 180,
                  height: 180,
                  transformStyle: "preserve-3d",
                  willChange: "transform",
                  transform: `rotateY(${angle}deg)`,
                  transition: transitionOn ? "transform 1.1s cubic-bezier(.2,.7,.2,1)" : "none",
                }}
              >
                <div className="face cara">CARA</div>
                <div className="face coroa" style={{ transform: "rotateY(180deg)" }}>COROA</div>
              </div>
            </div>

            <button style={s.btn} onClick={play} disabled={loading || transitionOn}>
              {transitionOn ? "Girando…" : "Jogar"}
            </button>

            {last && (
              <div style={{ marginTop: 14 }}>
                <div style={s.stat}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    Resultado:{" "}
                    <span style={{ color: last.win ? "#86efac" : "#fca5a5" }}>
                      {last.result} — {last.win ? "Vitória" : "Derrota"}
                    </span>
                  </div>
                  <div>Variação: {fmtBRL(last.profit)}</div>
                  <div>Saldo atualizado: {fmtBRL(last.newBalance ?? balance)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Histórico */}
          <div style={s.card}>
            <h2 style={{ margin: 0, marginBottom: 8 }}>Histórico recente</h2>
            {history.length === 0 ? (
              <div style={{ opacity: 0.8 }}>Sem partidas ainda.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={s.table}>
                  <thead>
                    <tr style={{ opacity: 0.8 }}>
                      <th style={{ textAlign: "left", padding: "6px 4px" }}>Quando</th>
                      <th style={{ textAlign: "left", padding: "6px 4px" }}>Aposta</th>
                      <th style={{ textAlign: "left", padding: "6px 4px" }}>Resultado</th>
                      <th style={{ textAlign: "right", padding: "6px 4px" }}>Stake</th>
                      <th style={{ textAlign: "right", padding: "6px 4px" }}>Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #1f2533" }}>
                        <td style={{ padding: "6px 4px" }}>{new Date(r.time).toLocaleTimeString()}</td>
                        <td style={{ padding: "6px 4px" }}>{r.sideBet}</td>
                        <td style={{ padding: "6px 4px", color: r.win ? "#86efac" : "#fca5a5" }}>
                          {r.result} {r.win ? "✓" : "✗"}
                        </td>
                        <td style={{ padding: "6px 4px", textAlign: "right" }}>{fmtBRL(r.stake)}</td>
                        <td style={{ padding: "6px 4px", textAlign: "right", color: r.profit >= 0 ? "#86efac" : "#fca5a5" }}>
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
      </div>
    </div>
  );
}
