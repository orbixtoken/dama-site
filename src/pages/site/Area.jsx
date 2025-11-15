// src/pages/site/Area.jsx
import { Link } from "react-router-dom";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { useAuth } from "../../hooks/useAuth";

/* ---------- Letreiro (+18 / Jogue com responsabilidade) ---------- */
function TickerBar() {
  return (
    <div style={styles.tickerWrap}>
      <div style={styles.tickerTrack}>
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} style={styles.tickerItem}>
            + 18 &nbsp; &nbsp; Dama Bet — Jogue com responsabilidade &nbsp; &nbsp; + 18
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- Animações --------------------------- */
const Coin = () => (
  <div style={styles.animBox}>
    <div style={styles.coin} />
  </div>
);

const Dice = () => (
  <div style={styles.animBox}>
    <div style={styles.dice}>⚄</div>
  </div>
);

const SlotStrip = () => (
  <div style={{ ...styles.animBox, overflow: "hidden" }}>
    <div style={styles.slotReel}>
      {["⭐", "🔔", "🍒", "💎", "7️⃣", "🍋", "🍇"].map((s, i) => (
        <div key={i} style={styles.slotCell}>
          {s}
        </div>
      ))}
      {["⭐", "🔔", "🍒", "💎", "7️⃣", "🍋", "🍇"].map((s, i) => (
        <div key={`d-${i}`} style={styles.slotCell}>
          {s}
        </div>
      ))}
    </div>
  </div>
);

export default function Area() {
  const { user } = useAuth();
  const display = user?.nome || user?.usuario || "jogador(a)";

  return (
    <>
      <SiteHeader />
      <TickerBar />

      <section className="wrap" style={{ padding: "16px 0 28px" }}>
        {/* Cabeçalho da área */}
        <div style={styles.panel}>
          <div style={styles.headRow}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Bem-vindo, <span className="gold">{display}</span>
              </h2>
              <p style={styles.sub}>
                Teste sua sorte em jogos rápidos e divertidos.
                <span style={styles.badge}>Chances novas a cada giro!</span>
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link className="btn" to="/jogos">
                Hub de jogos
              </Link>
              <Link className="btn ghost" to="/financeiro">
                Financeiro
              </Link>
              
            </div>
          </div>
        </div>

        {/* Grid de jogos */}
        <div style={styles.panel}>
          <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Jogos disponíveis</h3>

          <div className="games-grid">
            {/* Coin flip */}
            <article className="game-card" style={styles.card}>
              <header style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Cara ou Coroa</h3>
                <span style={styles.pill}>Novo</span>
              </header>

              {/* animação centralizada */}
              <Coin />

              <Link className="btn sm" to="/jogos/coin-flip">
                Jogar agora
              </Link>
            </article>

            {/* Dice */}
            <article className="game-card" style={styles.card}>
              <header style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Dados</h3>
              </header>

              <Dice />

              <Link className="btn sm" to="/jogos/dice">
                Jogar agora
              </Link>
            </article>

            {/* Slots */}
            <article className="game-card" style={styles.card}>
              <header style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Slots</h3>
              </header>

              <SlotStrip />

              <Link className="btn sm" to="/jogos/slots">
                Jogar agora
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* Estilos inline escopados (apenas para esta página) */}
      <style>
        {`
        .wrap { max-width: 1200px; margin: 0 auto; padding: 0 16px; }
        .btn { display:inline-flex; align-items:center; gap:8px; padding:10px 14px;
               border-radius:12px; background:linear-gradient(180deg,#38bdf8,#2563eb);
               color:#04131a; font-weight:800; text-decoration:none; border:1px solid rgba(56,189,248,.6);
               box-shadow:0 8px 32px rgba(56,189,248,.18), 0 0 0 1px rgba(8,47,73,.25) inset; }
        .btn.ghost { background:#0b1222; color:#eaf2ff; border:1px solid #22314a; box-shadow:none; }
        .btn.sm { padding:9px 12px; }
        .gold { color: #facc15; }

        .games-grid {
          display:grid;
          grid-template-columns: repeat(3, 1fr);
          gap:16px;
        }
        @media (max-width: 980px){
          .games-grid { grid-template-columns: 1fr; }
        }
        `}
      </style>

      <SiteFooter />
    </>
  );
}

/* ----------------------------- Styles ---------------------------- */
const styles = {
  panel: {
    background: "var(--panel, #101623)",
    border: "1px solid var(--line, #1f2637)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  headRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  sub: {
    margin: "6px 0 0",
    color: "var(--muted,#aab3c5)",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    background: "rgba(56,189,248,.1)",
    border: "1px solid rgba(56,189,248,.4)",
    color: "#bae6fd",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
  },

  /* Letreiro */
  tickerWrap: {
    position: "relative",
    overflow: "hidden",
    borderBottom: "1px solid rgba(56,189,248,.2)",
    background:
      "linear-gradient(180deg, rgba(14,20,35,.85), rgba(14,20,35,.65))",
    boxShadow: "0 1px 0 rgba(255,255,255,.03) inset",
  },
  tickerTrack: {
    display: "flex",
    gap: 24,
    padding: "6px 0",
    whiteSpace: "nowrap",
    animation: "marquee 20s linear infinite",
  },
  tickerItem: {
    color: "#8bd4ff",
    fontWeight: 700,
    letterSpacing: 0.3,
    textShadow: "0 0 8px rgba(56,189,248,.25)",
  },

  /* Cards */
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    borderRadius: 14,
    border: "1px solid rgba(120,140,255,.12)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02)), radial-gradient(900px 300px at 50% -80px, rgba(120,80,255,.06), rgba(0,0,0,.15))",
    boxShadow: "0 1px 0 rgba(255,255,255,.03) inset",
    padding: 16,
    minHeight: 220,
    justifyContent: "space-between",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: { margin: 0 },
  pill: {
    background: "rgba(56,189,248,.15)",
    color: "#86e1ff",
    border: "1px solid rgba(56,189,248,.45)",
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },

  /* Área dedicada às animações */
  animBox: {
    position: "relative",
    height: 90,               // altura fixa para todas as animações
    display: "flex",
    alignItems: "center",
    justifyContent: "center", // centraliza
    overflow: "visible",
  },

  /* Coin */
  coin: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 30% 30%, #fff6, transparent 55%), linear-gradient(180deg, #fde68a, #f59e0b)",
    border: "2px solid rgba(234,179,8,.8)",
    boxShadow:
      "0 0 0 1px rgba(0,0,0,.35) inset, 0 6px 20px rgba(245,158,11,.25), 0 0 18px rgba(245,158,11,.15)",
    animation: "spinY 1.15s linear infinite",
  },

  /* Dice */
  dice: {
    width: 46,
    height: 46,
    display: "grid",
    placeItems: "center",
    fontSize: 28,
    borderRadius: 12,
    background:
      "linear-gradient(180deg, #0ea5e9, #0369a1)",
    color: "#fff",
    border: "1px solid rgba(3,105,161,.6)",
    boxShadow: "0 8px 22px rgba(2,132,199,.25)",
    animation: "bob 2.1s ease-in-out infinite",
  },

  /* Slot */
  slotReel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    animation: "reel 3.2s linear infinite",
  },
  slotCell: {
    width: 38,
    height: 38,
    display: "grid",
    placeItems: "center",
    fontSize: 22,
    background: "linear-gradient(180deg, #111827, #0b1222)",
    border: "1px solid #22314a",
    borderRadius: 10,
    boxShadow: "0 4px 10px rgba(0,0,0,.25)",
  },
};

/* keyframes globais desta página */
const keyframes = `
@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
@keyframes spinY { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(360deg); } }
@keyframes bob { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-8px) rotate(-6deg); } }
@keyframes reel { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
`;
/* injeta os keyframes uma única vez */
if (typeof document !== "undefined" && !document.getElementById("area-keyframes")) {
  const style = document.createElement("style");
  style.id = "area-keyframes";
  style.innerHTML = keyframes;
  document.head.appendChild(style);
}
