import { useEffect, useMemo, useRef, useState } from "react";
import { casinoApi, financeApi } from "../../lib/api";

/* ----------------------- estilos ----------------------- */
const s = {
  page: { background: "#0c0f14", minHeight: "100vh", color: "#eaecef" },
  inner: { maxWidth: 900, margin: "0 auto", padding: "24px 16px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 },
  card: { background: "#101624", border: "1px solid #1f2533", borderRadius: 12, padding: 16 },
  h1: { margin: "0 0 12px 0", fontSize: 22 },
  label: { fontSize: 13, margin: "10px 0 6px", opacity: 0.85 },
  input: {
    width: "100%", background: "#0c1220", border: "1px solid #253047",
    color: "#eaecef", borderRadius: 8, padding: "10px 12px",
  },
  row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  btn: {
    background: "#10b981", color: "#0b0f14", border: 0, borderRadius: 8,
    padding: "10px 14px", cursor: "pointer", fontWeight: 700,
  },
  btnGhost: {
    background: "transparent", color: "#eaecef", border: "1px solid #374151",
    borderRadius: 8, padding: "8px 10px", cursor: "pointer",
  },
  chip: (active) => ({
    minWidth: 44, textAlign: "center", padding: "10px 0", borderRadius: 10,
    border: `1px solid ${active ? "#10b981" : "#374151"}`,
    background: active ? "#0f2a1d" : "transparent",
    color: active ? "#bbf7d0" : "#eaecef",
    cursor: "pointer", fontWeight: 700,
  }),
  error: {
    background: "#2a0f10", border: "1px solid #7f1d1d", color: "#fecaca",
    borderRadius: 8, padding: "8px 10px", marginBottom: 10,
  },
  success: {
    background: "#0f2a1d", border: "1px solid #14532d", color: "#bbf7d0",
    borderRadius: 8, padding: "8px 10px", marginBottom: 10,
  },
  tableWrap: { overflowX: "auto", marginTop: 10 },
  thtd: { padding: "8px 10px", fontSize: 14, borderTop: "1px solid #1f2533" },
  tiny: { fontSize: 12, opacity: 0.75 },

  diceWrap: {
    height: 220,
    display: "grid",
    placeItems: "center",
    borderRadius: 12,
    border: "1px dashed #233048",
    background:
      "radial-gradient(1200px 420px at 50% -40%, rgba(120,80,255,.08), rgba(0,0,0,.18))," +
      "linear-gradient(180deg, rgba(255,255,255,.02), rgba(0,0,0,.2))",
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
  },
  rollHint: { position: "absolute", bottom: 10, fontSize: 12, opacity: .75 },
};

/* temas do dado (gradiente/borda/sombra) */
const DICE_THEMES = {
  neonBlue: {
    bg: "linear-gradient(180deg,#0f1b3a,#0b1330)",
    border: "#2b3a7a",
    glow: "0 12px 40px rgba(59,130,246,.15)",
    pip: "#dce8ff",
  },
  emerald: {
    bg: "linear-gradient(180deg,#0e2a22,#0a1f19)",
    border: "#1f6b55",
    glow: "0 12px 40px rgba(16,185,129,.18)",
    pip: "#d8fff0",
  },
  crimson: {
    bg: "linear-gradient(180deg,#2a0f14,#1a0a0c)",
    border: "#7a2b39",
    glow: "0 12px 40px rgba(239,68,68,.18)",
    pip: "#ffe1e1",
  },
  gold: {
    bg: "linear-gradient(180deg,#2a230e,#1b160a)",
    border: "#7a6a2b",
    glow: "0 12px 40px rgba(234,179,8,.18)",
    pip: "#fff7d1",
  },
};

/* Face unicode: ⚀ ⚁ ⚂ ⚃ ⚄ ⚅ */
const FACE = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const money = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

/* dado com animação + tema e sons */
function DiceVisual({ themeKey = "neonBlue", rolling, finalFace, onStop, soundOn, sfx }) {
  const theme = DICE_THEMES[themeKey] || DICE_THEMES.neonBlue;
  const [face, setFace] = useState(1);
  const t0 = useRef(0);
  const minRollMs = 900;
  const swapEveryMs = 90;
  const timer = useRef(null);

  useEffect(() => {
    if (typeof document !== "undefined" && !document.getElementById("dice-shake-style")) {
      const css = `
        @keyframes diceShake {
          0%{ transform: translate(0,0) rotate(0) }
          25%{ transform: translate(2px,-2px) rotate(2deg) }
          50%{ transform: translate(-2px,2px) rotate(-2deg) }
          75%{ transform: translate(2px,1px) rotate(1deg) }
          100%{ transform: translate(0,0) rotate(0) }
        }`;
      const el = document.createElement("style");
      el.id = "dice-shake-style";
      el.textContent = css;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    clearInterval(timer.current);
    if (!rolling) {
      if (finalFace >= 1 && finalFace <= 6) setFace(finalFace);
      return;
    }

    if (soundOn) {
      try { sfx.current.roll.loop = true; sfx.current.roll.currentTime = 0; sfx.current.roll.play(); } catch {}
    }

    t0.current = performance.now();
    timer.current = setInterval(() => {
      setFace((f) => {
        let n = Math.floor(1 + Math.random() * 6);
        if (n === f) n = ((n % 6) + 1);
        return n;
      });
    }, swapEveryMs);

    let stopped = false;
    const tryStop = () => {
      if (stopped) return;
      const elapsed = performance.now() - t0.current;
      if (elapsed >= minRollMs && finalFace >= 1 && finalFace <= 6) {
        stopped = true;
        clearInterval(timer.current);
        setFace(finalFace);

        if (soundOn) {
          try { sfx.current.roll.pause(); sfx.current.roll.currentTime = 0; } catch {}
          try { sfx.current.stop.currentTime = 0; sfx.current.stop.play(); } catch {}
        }
        setTimeout(() => onStop?.(), 150);
      } else {
        requestAnimationFrame(tryStop);
      }
    };
    const raf = requestAnimationFrame(tryStop);

    return () => {
      clearInterval(timer.current);
      cancelAnimationFrame(raf);
      try { sfx.current.roll.pause(); } catch {}
    };
  }, [rolling, finalFace, onStop, soundOn, sfx]);

  return (
    <div style={s.diceWrap}>
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 18,
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          boxShadow:
            `0 6px 30px rgba(0,0,0,.45), 0 0 0 1px rgba(0,0,0,.35) inset, ${theme.glow}`,
          display: "grid",
          placeItems: "center",
          fontSize: 64,
          transition: "transform .15s ease",
          transform: rolling ? "scale(1.04) rotate(3deg)" : "scale(1)",
          color: theme.pip,
          userSelect: "none",
          animation: rolling ? "diceShake .35s ease-in-out infinite" : "none",
        }}
        aria-live="polite"
        aria-label={rolling ? "Rolando o dado" : `Face ${face}`}
      >
        <span style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,.6))" }}>
          {FACE[face]}
        </span>
      </div>
      <div style={s.rollHint}>{rolling ? "Rolando…" : "Escolha um número e jogue"}</div>
    </div>
  );
}

/* ----------------------------- página ----------------------------- */
export default function Dice() {
  const [saldo, setSaldo] = useState(null);
  const [stake, setStake] = useState("1,00");
  const [target, setTarget] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [last, setLast] = useState(null);
  const [hist, setHist] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  // animação/tema/sons
  const [rolling, setRolling] = useState(false);
  const [serverFace, setServerFace] = useState(null);
  const [themeKey, setThemeKey] = useState("neonBlue");
  const [soundOn, setSoundOn] = useState(true);

  // audios (JS puro)
  const sfx = useRef(null);
  useEffect(() => {
    if (!sfx.current) {
      sfx.current = {
        roll: new Audio("/sfx/dice-roll.wav"),
        stop: new Audio("/sfx/dice-stop.wav"),
        win:  new Audio("/sfx/win.wav"),
        lose: new Audio("/sfx/lose.wav"),
      };
      [sfx.current.roll, sfx.current.stop, sfx.current.win, sfx.current.lose].forEach(a => {
        a.preload = "auto"; a.load?.(); a.volume = 0.5;
      });
      sfx.current.roll.volume = 0.35;
    }
    return () => { try { sfx.current?.roll?.pause(); } catch {} };
  }, []);

  async function loadSaldo() {
    try {
      const { data } = await financeApi.getBalance();
      setSaldo(Number(data?.saldo_disponivel ?? 0));
    } catch {}
  }

  async function loadHist() {
    setHistLoading(true);
    try {
      if (casinoApi.minhasDice) {
        const { data } = await casinoApi.minhasDice();
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        setHist(items.slice(0, 10));
      }
    } catch {} finally {
      setHistLoading(false);
    }
  }

  useEffect(() => { loadSaldo(); loadHist(); }, []);

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

    setLoading(true);
    setRolling(true);
    setServerFace(null);

    // watchdog para garantir parada
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

      let rollFromServer = Number(
        data?.roll ?? data?.resultado ?? data?.face ?? data?.result ?? NaN
      );
      const serverTarget = Number(data?.target ?? target);

      let won =
        typeof data?.won === "boolean"
          ? data.won
          : (Number.isFinite(rollFromServer) && rollFromServer === serverTarget);

      if (!Number.isFinite(rollFromServer)) {
        if (won) {
          rollFromServer = serverTarget;
        } else {
          const pool = [1, 2, 3, 4, 5, 6].filter((n) => n !== serverTarget);
          rollFromServer = pool[Math.floor(Math.random() * pool.length)];
        }
      }

      const payout = Number(data?.payout ?? estPayout);
      const profit =
        data?.profit !== undefined
          ? Number(data.profit)
          : won
          ? Number((payout * stakeNum - stakeNum).toFixed(2))
          : -stakeNum;

      const payload = {
        roll: rollFromServer,
        target: serverTarget,
        won: !!won,
        payout,
        profit,
        new_balance: data?.new_balance !== undefined ? Number(data.new_balance) : null,
        raw: data,
      };

      setTimeout(() => stopWith(rollFromServer, payload), WATCH_MS);
    } catch (e) {
      const msg = e?.response?.data?.erro || e?.message || "Falha ao jogar.";
      setErr(msg);

      const pool = [1, 2, 3, 4, 5, 6];
      const r = pool[Math.floor(Math.random() * pool.length)];
      const w = r === target;
      const profit = w ? Number((6 * stakeNum - stakeNum).toFixed(2)) : -stakeNum;
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
      try { (last.won ? sfx.current.win : sfx.current.lose).play(); } catch {}
    }

    if (last?.new_balance !== null && Number.isFinite(last.new_balance)) {
      setSaldo(last.new_balance);
    } else {
      await loadSaldo();
    }

    // histórico local imediato (garante exibição)
    setHist((h) => {
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
      const arr = Array.isArray(h) ? h : [];
      return [item, ...arr].slice(0, 10);
    });

    // tenta atualizar do backend também
    loadHist();
  };

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <h1 style={s.h1}>🎲 Dice (escolha 1–6)</h1>
        <div style={{ ...s.row, marginBottom: 12 }}>
          <div style={{ ...s.tiny }}>
            Tema do dado:&nbsp;
            <select
              value={themeKey}
              onChange={(e) => setThemeKey(e.target.value)}
              style={{ background: "#0c1220", border: "1px solid #253047", color: "#eaecef", borderRadius: 6, padding: "6px 8px" }}
            >
              <option value="neonBlue">Neon Blue</option>
              <option value="emerald">Emerald</option>
              <option value="crimson">Crimson</option>
              <option value="gold">Gold</option>
            </select>
          </div>
          <label style={{ ...s.tiny, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={soundOn}
              onChange={(e) => setSoundOn(e.target.checked)}
            />
            Som
          </label>
        </div>

        <div style={s.grid}>
          {/* Jogo */}
          <div style={s.card}>
            <DiceVisual
              themeKey={themeKey}
              rolling={rolling}
              finalFace={serverFace}
              onStop={onDiceStop}
              soundOn={soundOn}
              sfx={sfx}
            />

            {err && <div style={s.error}>{err}</div>}
            {last && !rolling && (
              <div style={last.won ? s.success : s.error}>
                <b>{last.won ? "Você venceu!" : "Você perdeu"}</b>
                <div style={{ marginTop: 6 }}>
                  Saiu: <b>{last.roll}</b> — Seu número: <b>{last.target}</b> — Payout:{" "}
                  <b>{last.payout}x</b>
                </div>
                <div style={{ marginTop: 4 }}>
                  {last.profit >= 0 ? "Lucro" : "Prejuízo"}: <b>{money(last.profit)}</b>
                </div>
              </div>
            )}

            <div style={s.label}>Saldo disponível</div>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>
              {saldo === null ? "—" : money(saldo)}
            </div>

            <div style={s.label}>Valor da aposta</div>
            <div style={s.row}>
              <input
                style={s.input}
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="Ex.: 1,00"
                disabled={loading}
              />
              <button style={s.btnGhost} type="button" onClick={() => setStake("1,00")} disabled={loading}>R$ 1</button>
              <button style={s.btnGhost} type="button" onClick={() => setStake("5,00")} disabled={loading}>R$ 5</button>
              <button style={s.btnGhost} type="button" onClick={() => setStake("10,00")} disabled={loading}>R$ 10</button>
            </div>

            <div style={s.label}>Escolha seu número (1 a 6)</div>
            <div style={s.row}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button key={n} type="button" style={s.chip(target === n)} onClick={() => setTarget(n)} disabled={loading}>
                  {n}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 8, ...s.tiny }}>
              Payout estimado <b>{estPayout}x</b>. Potencial (estimado):{" "}
              <b>{money(estPotential)}</b>. O valor real pode variar conforme a configuração do servidor.
            </div>

            <div style={{ marginTop: 14 }}>
              <button style={s.btn} onClick={play} disabled={loading || !stakeNum}>
                {loading ? "Rolando…" : "Jogar"}
              </button>
            </div>
          </div>

          {/* Histórico */}
          <div style={s.card}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Histórico recente</div>
            {histLoading ? (
              <div>Carregando…</div>
            ) : hist.length === 0 ? (
              <div style={s.tiny}>Sem partidas recentes.</div>
            ) : (
              <div style={s.tableWrap}>
                <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ opacity: 0.75 }}>
                      <th style={s.thtd}>Quando</th>
                      <th style={s.thtd}>Saiu</th>
                      <th style={s.thtd}>Escolha</th>
                      <th style={{ ...s.thtd, textAlign: "right" }}>Aposta</th>
                      <th style={s.thtd}>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hist.map((r, i) => (
                      <tr key={r.id || i}>
                        <td style={s.thtd}>
                          {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                        </td>
                        <td style={s.thtd}>{r.roll ?? r.result ?? "—"}</td>
                        <td style={s.thtd}>{r.target ?? r.escolha ?? "—"}</td>
                        <td style={{ ...s.thtd, textAlign: "right" }}>
                          {money(r.stake ?? r.valor ?? 0)}
                        </td>
                        <td style={s.thtd}>
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
            <div style={{ marginTop: 10, ...s.tiny }}>
              *<code></code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
