// src/pages/site/Area.jsx
import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { useAuth } from "../../hooks/useAuth";
import { financeApi, api } from "../../lib/api";

/* ================ Letreiro (+18 / responsabilidade) ================ */
function TickerBar() {
  return (
    <div style={st.tickerWrap}>
      <div style={st.tickerTrack}>
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} style={st.tickerItem}>
            🔞 +18 &nbsp; • &nbsp; Dama Bet — Jogue com responsabilidade &nbsp; • &nbsp; Faça pausas & defina limites
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================== Animações ============================== */
const Coin = () => (
  <div style={st.animBox}>
    <div style={st.coinCore}>
      <div style={st.coinRim} />
    </div>
    <div style={st.sparkle} />
  </div>
);

const Dice = () => (
  <div style={st.animBox}>
    <div style={st.diceCore}>
      <span style={{ filter: "drop-shadow(0 10px 24px rgba(0,0,0,.6))" }}>⚄</span>
    </div>
  </div>
);

const SlotStrip = () => (
  <div style={{ ...st.animBox, overflow: "hidden" }}>
    <div style={st.slotReel}>
      {["🍒", "💎", "7️⃣", "🔔", "🍋", "🍇", "⭐"].map((s, i) => (
        <div key={i} style={st.slotCell}>{s}</div>
      ))}
      {["🍒", "💎", "7️⃣", "🔔", "🍋", "🍇", "⭐"].map((s, i) => (
        <div key={`d-${i}`} style={st.slotCell}>{s}</div>
      ))}
    </div>
    <div style={st.reelShine} />
  </div>
);

/* ============================== Página =============================== */
export default function Area() {
  const { user } = useAuth();
  const display = user?.nome || user?.usuario || "jogador(a)";

  const [saldo, setSaldo] = useState(null);
  const [pontos, setPontos] = useState(Number(user?.pontos_total ?? 0));
  const [indic, setIndic] = useState(Number(user?.indicacoes_total ?? 0));

  const [msgIdx, setMsgIdx] = useState(0);
  const msgs = useMemo(
    () => [
      "✨ Sorte favorece quem gira!",
      "💎 Grandes vitórias começam com pequenos giros.",
      "🔥 Hoje é dia de highlight — boa jogada!",
      "🏅 Aposte com classe. Jogue com responsabilidade.",
    ],
    []
  );

  useEffect(() => {
    let t;
    const loop = () => {
      t = setTimeout(() => {
        setMsgIdx((i) => (i + 1) % msgs.length);
        loop();
      }, 3500);
    };
    loop();
    return () => clearTimeout(t);
  }, [msgs.length]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await financeApi.getBalance();
        setSaldo(Number(data?.saldo_disponivel ?? data?.saldo ?? 0));
      } catch {
        setSaldo(null);
      }
      // se existir endpoint, buscamos pontos/indicações sem quebrar a página
      try {
        const r = await api.get?.("/minha-area/stats");
        setPontos(Number(r?.data?.pontos ?? pontos));
        setIndic(Number(r?.data?.indicacoes ?? indic));
      } catch {}
    })();
  }, []); // inicial

  const money = (v) =>
    `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <>
      <SiteHeader />
      <TickerBar />

      {/* HERO da Área */}
      <section style={st.hero}>
        <div className="wrap" style={{ padding: "18px 0" }}>
          <div style={st.heroGrid}>
            <div>
              <div style={st.hello}>
                Bem-vindo, <span style={st.goldTxt}>{display}</span>
              </div>
              <div style={st.heroMsg} aria-live="polite">
                {msgs[msgIdx]}
              </div>

              {/* Stats pill-row */}
              <div style={st.statRow}>
                <div style={st.pillStat}>
                  <span style={st.pillLabel}>Saldo</span>
                  <strong style={st.pillValue}>{saldo == null ? "—" : money(saldo)}</strong>
                </div>
                <div style={st.pillStat}>
                  <span style={st.pillLabel}>Indicações</span>
                  <strong style={st.pillValue}>{indic}</strong>
                </div>
                <div style={st.pillStat}>
                  <span style={st.pillLabel}>Pontos</span>
                  <strong style={st.pillValue}>{pontos}</strong>
                </div>
              </div>
            </div>

            {/* CTA lateral */}
            <div style={st.ctaCol}>
              <Link to="/financeiro" style={st.btnPrimary}>
                💳 Financeiro
              </Link>
              <div style={st.btnRow}>
                <Link to="/financeiro" style={st.btnGhost}>Adicionar saldo</Link>
              
              </div>
            </div>
          </div>
        </div>

        {/* Partículas de fundo */}
        <div style={st.heroFx} />
      </section>

      {/* GAMES */}
      <section className="wrap" style={{ padding: "16px 0 28px" }}>
        <div style={st.panel}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, letterSpacing: .3 }}>Jogos disponíveis</h3>

          <div className="games-grid">
            {/* Coin flip */}
            <article className="game-card" style={st.card}>
              <header style={st.cardHeader}>
                <h3 style={st.cardTitle}>Cara ou Coroa</h3>
                <span style={st.pillNew}>Novo</span>
              </header>
              <Coin />
              <Link className="btn sm" to="/jogos/coin-flip">Jogar agora</Link>
            </article>

            {/* Dice */}
            <article className="game-card" style={st.card}>
              <header style={st.cardHeader}>
                <h3 style={st.cardTitle}>Dados</h3>
              </header>
              <Dice />
              <Link className="btn sm" to="/jogos/dice">Jogar agora</Link>
            </article>

            {/* Slots */}
            <article className="game-card" style={st.card}>
              <header style={st.cardHeader}>
                <h3 style={st.cardTitle}>Slots</h3>
              </header>
              <SlotStrip />
              <Link className="btn sm" to="/jogos/slots">Jogar agora</Link>
            </article>
          </div>
        </div>
      </section>

      {/* CSS local */}
      <style>{cssGlobal}</style>
      <SiteFooter />
    </>
  );
}

/* ============================= STYLES ============================= */
const st = {
  /* HERO */
  hero: {
    position: "relative",
    background:
      "radial-gradient(1100px 600px at 85% -20%, rgba(255,215,128,.15), transparent 60%), radial-gradient(900px 500px at 10% -10%, rgba(56,189,248,.18), transparent 55%), #070b14",
    borderBottom: "1px solid rgba(255,255,255,.06)",
    overflow: "hidden",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr .8fr",
    gap: 16,
    alignItems: "center",
  },
  hello: {
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 6,
    textShadow: "0 0 12px rgba(255,215,128,.22)",
  },
  goldTxt: { color: "#ffd780" },
  heroMsg: {
    fontSize: 16,
    color: "#c7e7ff",
    marginBottom: 12,
    textShadow: "0 0 10px rgba(56,189,248,.25)",
    animation: "fadeMsg .6s ease",
  },
  statRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  pillStat: {
    minWidth: 180,
    flex: "0 0 auto",
    background:
      "linear-gradient(180deg, rgba(255,230,168,.10), rgba(255,230,168,.03))",
    border: "1px solid rgba(255,220,130,.35)",
    color: "#ffe6a8",
    padding: "10px 12px",
    borderRadius: 14,
    boxShadow: "0 8px 32px rgba(255,215,128,.10), inset 0 1px 0 rgba(255,255,255,.04)",
  },
  pillLabel: { fontSize: 12, opacity: .9 },
  pillValue: { fontSize: 18, letterSpacing: .2 },

  ctaCol: { display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" },
  btnPrimary: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "12px 16px", borderRadius: 14,
    background: "linear-gradient(180deg,#ffd780,#f5b65c)",
    color: "#2a1a05", fontWeight: 900, textDecoration: "none",
    border: "1px solid rgba(255,215,128,.65)",
    boxShadow: "0 12px 40px rgba(255,215,128,.25), 0 0 0 1px rgba(255,215,128,.35) inset",
    transform: "translateY(0)", transition: "transform .08s ease",
  },
  btnRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  btnGhost: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 14px", borderRadius: 12, textDecoration: "none",
    background: "#0b1222", color: "#eaf2ff", border: "1px solid #22314a",
  },
  heroFx: {
    position: "absolute", inset: 0, pointerEvents: "none",
    background:
      "radial-gradient(800px 200px at 40% -60px, rgba(255,255,255,.06), transparent 60%)",
    maskImage:
      "radial-gradient(800px 200px at 40% -60px, rgba(0,0,0,.85), transparent 65%)",
  },

  /* Painéis / grid jogos */
  panel: {
    background: "var(--panel, #101623)",
    border: "1px solid var(--line, #1f2637)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  /* Cards */
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    borderRadius: 16,
    border: "1px solid rgba(255,220,130,.25)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02)), radial-gradient(900px 300px at 50% -80px, rgba(255,215,128,.10), rgba(0,0,0,.15))",
    boxShadow: "0 1px 0 rgba(255,255,255,.03) inset, 0 10px 30px rgba(0,0,0,.25)",
    padding: 16,
    minHeight: 220,
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: { margin: 0, letterSpacing: .2 },
  pillNew: {
    background: "rgba(56,189,248,.18)",
    color: "#86e1ff",
    border: "1px solid rgba(56,189,248,.45)",
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
  },

  /* Área das mini-animações */
  animBox: {
    position: "relative",
    height: 96,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Coin 3D */
  coinCore: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 30% 30%, #fff6, transparent 58%), linear-gradient(180deg, #ffe8a8, #f5b65c)",
    border: "2px solid rgba(255,215,128,.9)",
    boxShadow:
      "0 0 0 1px rgba(0,0,0,.35) inset, 0 8px 26px rgba(245,182,92,.28), 0 0 22px rgba(245,182,92,.18)",
    animation: "spinY 1.1s linear infinite",
  },
  coinRim: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: "50%",
    border: "1px dashed rgba(255,215,128,.45)",
    animation: "pulse 1.8s ease-in-out infinite",
  },
  sparkle: {
    position: "absolute",
    width: 4, height: 24, borderRadius: 999,
    background: "linear-gradient(180deg, transparent, rgba(255,255,255,.9), transparent)",
    transform: "rotate(20deg)",
    animation: "shine 1.2s linear infinite",
    opacity: .9,
  },

  /* Dice */
  diceCore: {
    width: 54,
    height: 54,
    display: "grid",
    placeItems: "center",
    fontSize: 30,
    borderRadius: 14,
    background: "linear-gradient(180deg, #22c55e, #16a34a)",
    color: "#fff",
    border: "1px solid rgba(22,163,74,.65)",
    boxShadow: "0 10px 26px rgba(22,163,74,.22), 0 0 0 1px rgba(0,0,0,.35) inset",
    animation: "bob 2s ease-in-out infinite",
  },

  /* Slots */
  slotReel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    animation: "reel 3.2s linear infinite",
  },
  slotCell: {
    width: 42,
    height: 42,
    display: "grid",
    placeItems: "center",
    fontSize: 24,
    background: "linear-gradient(180deg, #0f172a, #0b1222)",
    border: "1px solid rgba(255,220,130,.32)",
    borderRadius: 12,
    boxShadow: "0 6px 16px rgba(0,0,0,.25)",
  },
  reelShine: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)",
    animation: "sweep 2.8s linear infinite",
    pointerEvents: "none",
  },

  /* Letreiro */
  tickerWrap: {
    position: "relative",
    overflow: "hidden",
    borderBottom: "1px solid rgba(56,189,248,.2)",
    background: "linear-gradient(180deg, rgba(14,20,35,.85), rgba(14,20,35,.65))",
    boxShadow: "0 1px 0 rgba(255,255,255,.03) inset",
  },
  tickerTrack: {
    display: "flex",
    gap: 28,
    padding: "6px 0",
    whiteSpace: "nowrap",
    animation: "marquee 18s linear infinite",
  },
  tickerItem: {
    color: "#8bd4ff",
    fontWeight: 800,
    letterSpacing: 0.3,
    textShadow: "0 0 8px rgba(56,189,248,.25)",
  },
};

/* ---------- Grid responsivo / botões globais do card ---------- */
const cssGlobal = `
.wrap { max-width:1200px; margin:0 auto; padding:0 16px; }
.games-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; }
@media (max-width: 980px){ .games-grid { grid-template-columns: 1fr; } }

.btn { display:inline-flex; align-items:center; gap:8px; padding:10px 14px;
       border-radius:12px; background:linear-gradient(180deg,#38bdf8,#2563eb);
       color:#04131a; font-weight:800; text-decoration:none; border:1px solid rgba(56,189,248,.6);
       box-shadow:0 8px 32px rgba(56,189,248,.18), 0 0 0 1px rgba(8,47,73,.25) inset; }
.btn.sm { padding:9px 12px; }

/* keyframes */
@keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
@keyframes spinY { 0%{transform:rotateY(0)} 100%{transform:rotateY(360deg)} }
@keyframes pulse { 0%,100%{opacity:.45; transform:scale(.98)} 50%{opacity:.9; transform:scale(1.02)} }
@keyframes shine { 0%{transform:translateX(-60px) rotate(20deg)} 100%{transform:translateX(60px) rotate(20deg)} }
@keyframes bob { 0%,100%{ transform: translateY(0) rotate(0deg); } 50%{ transform: translateY(-8px) rotate(-6deg); } }
@keyframes reel { 0%{ transform: translateX(0); } 100%{ transform: translateX(-50%); } }
@keyframes sweep { 0%{ transform: translateX(-100%); } 100%{ transform: translateX(100%); } }
@keyframes fadeMsg { from{opacity:0; transform:translateY(4px)} to{opacity:1; transform:translateY(0)} }
`;
