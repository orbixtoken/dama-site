import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, casinoApi, financeApi } from "../../lib/api";
import useIsMobile from "../../hooks/useIsMobile";

/* ---------------- helpers ---------------- */
function money(n) {
  return `R$ ${Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}
const SYMBOLS = ["🍒", "🍋", "🔔", "💎", "⭐", "7️⃣"];

/** calcula o offset para alinhar o targetIndex na “linha guia” central */
function computeSnapOffset(currentOffset, targetIndex, totalLen, itemH, visible) {
  const cycle = totalLen * itemH;
  const topIndex = (targetIndex - Math.floor(visible / 2) + totalLen) % totalLen;
  let ideal = Math.floor(currentOffset / cycle) * cycle + topIndex * itemH;
  if (ideal < currentOffset) ideal += cycle;
  return ideal;
}

/* ---------------- Reel (1 carretel) ---------------- */
function Reel({ spinning, targetIndex, spinMs, symbols, itemH, fontSize, visible, onStop }) {
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
          const targetOff = computeSnapOffset(prev, targetIndex, symbols.length, itemH, visible);
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
        width: itemH * 1.85,              // largura proporcional ao item
        borderRadius: 14,
        border: "1px solid rgba(90,120,255,.25)",
        background:
          "radial-gradient(1000px 380px at 50% -10%, rgba(120,80,255,.08), rgba(0,0,0,.3))," +
          "linear-gradient(180deg, rgba(255,255,255,.03), rgba(0,0,0,.25))",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 0 0 1px rgba(0,0,0,.3), 0 0 18px rgba(110,90,255,.12) inset",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: itemH,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg, transparent, #22d3ee, transparent)",
          opacity: 0.55,
          pointerEvents: "none",
          filter: "drop-shadow(0 0 6px rgba(34,211,238,.35))",
        }}
      />
      <div style={{ transform: `translateY(${-offset}px)`, willChange: "transform" }}>
        {LONG.map((s, i) => (
          <div
            key={i}
            style={{
              height: itemH,
              display: "grid",
              placeItems: "center",
              fontSize,
              textShadow: "0 6px 18px rgba(0,0,0,.45)",
              userSelect: "none",
            }}
          >
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Página ---------------- */
export default function SlotsCommon() {
  const isMobile = useIsMobile(880);     // breakpoint principal
  const isTiny = useIsMobile(420);       // telas muito pequenas

  // tamanhos responsivos
  const VISIBLE = 3;
  const ITEM_H = isTiny ? 78 : isMobile ? 92 : 120;
  const FONT = isTiny ? 40 : isMobile ? 48 : 56;
  const SPIN_MS = isMobile ? [1300, 1600, 1900] : [1600, 2000, 2400];

  const [bet, setBet] = useState("1,00");
  const [spinning, setSpinning] = useState(false);
  const [targets, setTargets] = useState([0, 0, 0]);
  const [result, setResult] = useState(null);
  const [saldo, setSaldo] = useState(0);

  // histórico
  const [hist, setHist] = useState({ items: [], page: 1, pageSize: 10, total: 0 });

  // som
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
      [sfx.current.spin, sfx.current.stop, sfx.current.win, sfx.current.lose].forEach((a) => {
        a.preload = "auto";
        a.load?.();
        a.volume = 0.5;
      });
    }
    return () => {
      try {
        sfx.current?.spin?.pause();
      } catch {}
    };
  }, []);

  // controle de parada (evita “rodar de novo”)
  const [spinId, setSpinId] = useState(0);
  const inFlightRef = useRef(false);
  const remainingStops = useRef(0);
  const onStopRef = useRef(null);
  const reelStop = useCallback(() => {
    onStopRef.current && onStopRef.current();
  }, []);

  const loadHistory = async (page = 1) => {
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
      loadHistory(1);
    })();
  }, []);

  const betValue = useMemo(() => {
    const n = Number(String(bet).replace(/[^\d,.-]/g, "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [bet]);

  const play = useCallback(async () => {
    if (spinning || inFlightRef.current) return;

    setResult(null);
    inFlightRef.current = true;
    remainingStops.current = 3;

    // rolos visuais UMA vez
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
        msg: ok ? `Você ganhou! (x${mult.toFixed(2)})` : "Sem prêmio",
      });
      setSaldo(saldoDepois);

      if (soundOn) {
        try {
          sfx.current.spin.pause();
          (ok ? sfx.current.win : sfx.current.lose).play();
        } catch {}
      }

      setSpinning(false);
      inFlightRef.current = false;
      loadHistory(1);
    };

    const onAnyStop = () => {
      try {
        if (soundOn) {
          sfx.current.stop.currentTime = 0;
          sfx.current.stop.play();
        }
      } catch {}
      remainingStops.current -= 1;
      if (remainingStops.current <= 0) {
        finish(respRef.current);
      }
    };
    onStopRef.current = onAnyStop;

    // dispara giro
    setTargets(rolos);
    setSpinId((x) => x + 1); // remonta reels (estado limpo)
    setSpinning(true);
    if (soundOn) {
      try {
        sfx.current.spin.currentTime = 0;
        sfx.current.spin.play();
      } catch {}
    }

    // requisita servidor enquanto anima
    try {
      const { data } = await casinoApi.slotsCommonPlay(betValue);
      respRef.current = data;
    } catch {
      respRef.current = { payout: 0, mult: 0, saldo_depois: saldo - betValue };
    }
  }, [betValue, loadHistory, saldo, soundOn, spinning]);

  const btnDisabled = spinning || betValue <= 0 || betValue > saldo;

  /* ---------------- estilos responsivos ---------------- */
  const pageStyle = {
    minHeight: "100vh",
    color: "#eaf2ff",
    padding: isMobile ? "18px 12px" : "28px 16px",
    background:
      "radial-gradient(1200px 600px at 50% -100px, #0b1430, #070b14 50%, #060a12 80%)",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1.2fr .9fr",
    gap: isMobile ? 12 : 20,
    alignItems: "start",
  };

  const boxStyle = {
    borderRadius: 14,
    padding: isMobile ? 12 : 16,
    border: "1px solid rgba(120,140,255,.12)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02))," +
      "radial-gradient(900px 300px at 50% -80px, rgba(120,80,255,.06), rgba(0,0,0,.15))",
    boxShadow: "0 1px 0 rgba(255,255,255,.03) inset",
  };

  const reelsWrapStyle = {
    display: "flex",
    gap: isMobile ? 10 : 14,
    padding: isMobile ? 10 : 14,
    borderRadius: 14,
    border: "1px solid rgba(120,140,255,.2)",
    background:
      "radial-gradient(1000px 420px at 50% -20%, rgba(255,255,255,.03), rgba(0,0,0,.25))",
    justifyContent: "center",
    flexWrap: "nowrap",
  };

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            margin: isMobile ? "2px 0 12px" : "6px 0 18px",
            fontSize: isMobile ? 20 : 22,
          }}
        >
          <span style={{ fontSize: isMobile ? 20 : 24 }}>🎰</span> Slots —{" "}
          <span style={{ opacity: 0.85 }}>comum</span>
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
            fontSize: 12,
            opacity: 0.85,
          }}
        >
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={soundOn}
              onChange={(e) => setSoundOn(e.target.checked)}
            />
            Som
          </label>
        </div>

        {result && (
          <div
            style={{
              marginBottom: 12,
              borderRadius: 10,
              padding: "10px 12px",
              border: `1px solid ${result.ok ? "rgba(16,185,129,.6)" : "rgba(239,68,68,.6)"}`,
              background: result.ok
                ? "linear-gradient(180deg, rgba(16,185,129,.18), rgba(16,185,129,.05))"
                : "linear-gradient(180deg, rgba(239,68,68,.18), rgba(239,68,68,.05))",
              color: result.ok ? "#d1fae5" : "#fee2e2",
              boxShadow: result.ok
                ? "0 0 24px rgba(16,185,129,.08) inset"
                : "0 0 24px rgba(239,68,68,.08) inset",
              fontSize: isMobile ? 13 : 14,
            }}
          >
            <div style={{ fontWeight: 700 }}>{result.msg}</div>
            <div style={{ opacity: 0.9 }}>
              Prêmio: <b>{money(result.premio)}</b> • Saldo: <b>{money(result.saldo)}</b>
            </div>
          </div>
        )}

        <div style={gridStyle}>
          {/* Jogo */}
          <div style={boxStyle}>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>
              Saldo disponível
            </div>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>{money(saldo)}</div>

            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>
              Valor da aposta
            </div>
            <input
              value={bet}
              onChange={(e) => setBet(e.target.value)}
              placeholder="1,00"
              style={{
                width: "100%",
                background: "#0b1222",
                border: "1px solid rgba(120,140,255,.25)",
                color: "#eaf2ff",
                borderRadius: 10,
                padding: "10px 12px",
                marginBottom: 12,
                boxShadow: "0 0 12px rgba(110,90,255,.08) inset",
              }}
            />

            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {[1, 2, 5, 10].map((v) => (
                <button
                  key={v}
                  onClick={() =>
                    setBet(v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }))
                  }
                  style={{
                    border: "1px solid rgba(120,140,255,.25)",
                    background:
                      "linear-gradient(180deg, rgba(46,64,120,.55), rgba(20,28,48,.85))",
                    color: "#eaf2ff",
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: "0 0 10px rgba(110,90,255,.15) inset",
                  }}
                >
                  R$ {v}
                </button>
              ))}
            </div>

            <button
              disabled={btnDisabled}
              onClick={play}
              style={{
                background: btnDisabled
                  ? "linear-gradient(180deg, rgba(34,197,94,.35), rgba(16,185,129,.25))"
                  : "linear-gradient(180deg, #34d399, #10b981)",
                color: "#062018",
                border: "1px solid rgba(16,185,129,.65)",
                padding: "10px 14px",
                borderRadius: 10,
                fontWeight: 800,
                letterSpacing: 0.2,
                cursor: btnDisabled ? "not-allowed" : "pointer",
                marginBottom: 14,
                boxShadow: btnDisabled
                  ? "0 0 0"
                  : "0 6px 40px rgba(16,185,129,.25), 0 0 0 1px rgba(16,185,129,.35) inset",
                transition: "transform .06s ease",
              }}
            >
              {spinning ? "Girando..." : "GIRO!"}
            </button>

            <div style={reelsWrapStyle}>
              {[0, 1, 2].map((i) => (
                <Reel
                  key={`${spinId}-${i}`}
                  spinning={spinning}
                  targetIndex={targets[i] ?? 0}
                  spinMs={SPIN_MS[i % SPIN_MS.length]}
                  symbols={SYMBOLS}
                  itemH={ITEM_H}
                  fontSize={FONT}
                  visible={VISIBLE}
                  onStop={reelStop}
                />
              ))}
            </div>

            <div style={{ opacity: 0.7, fontSize: 12, marginTop: 8 }}>
              * Animação local; o resultado oficial vem do servidor após a rolagem.
            </div>
          </div>

          {/* Histórico */}
          <div
            style={{
              ...boxStyle,
              order: isMobile ? 2 : 0, // no mobile, fica abaixo
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Histórico recente</div>

            <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
              <thead style={{ opacity: 0.8 }}>
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
                    style={{ borderTop: "1px dashed rgba(255,255,255,.06)" }}
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
                        color: Number(it.premio) > 0 ? "#86efac" : "#e5e7eb",
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

            {hist.total > hist.pageSize && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => loadHistory(Math.max(1, hist.page - 1))}
                  disabled={hist.page <= 1}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    background: "#0b1222",
                    border: "1px solid #24324a",
                    color: "#eaf2ff",
                  }}
                >
                  Anterior
                </button>
                <button
                  onClick={() => loadHistory(hist.page + 1)}
                  disabled={hist.page * hist.pageSize >= hist.total}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    background: "#0b1222",
                    border: "1px solid #24324a",
                    color: "#eaf2ff",
                  }}
                >
                  Próxima
                </button>
                <div style={{ marginLeft: "auto", opacity: 0.8, fontSize: 12 }}>
                  pág. {hist.page} / {Math.ceil(hist.total / hist.pageSize)}
                </div>
              </div>
            )}

            <div style={{ opacity: 0.55, fontSize: 12, marginTop: 8 }}>
              * Depende de <code>/cassino/slots/common/minhas</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
