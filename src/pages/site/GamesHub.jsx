// src/pages/games/GamesHub.jsx (ou o caminho que você usa)
import { Link } from "react-router-dom";

export default function GamesHub() {
  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <header style={styles.header}>
          <h2 style={{ margin: 0 }}>Hub de jogos</h2>
          <p style={styles.sub}>
            Escolha um jogo abaixo e boa sorte!
            <span style={styles.badge}>Diversão rápida</span>
          </p>
        </header>

        <div style={styles.grid}>
          <GameCard
            title="Cara ou Coroa"
            to="/jogos/coin-flip"
            tag="Novo"
            Anim={Coin}
          />

          <GameCard
            title="Dados"
            to="/jogos/dice"
            Anim={Dice}
          />

          <GameCard
            title="Slots"
            to="/jogos/slots"
            Anim={SlotStrip}
          />
        </div>
      </div>

      {/* estilos locais */}
      <style>
        {`
        @keyframes hubSpinY { 0%{transform:rotateY(0)} 100%{transform:rotateY(360deg)} }
        @keyframes hubBob { 0%,100%{ transform: translateY(0) rotate(0deg) } 50%{ transform: translateY(-8px) rotate(-6deg) } }
        @keyframes hubReel { 0%{ transform: translateX(0) } 100%{ transform: translateX(-50%) } }
        `}
      </style>
    </div>
  );
}

/* --------------------------- Card genérico --------------------------- */
function GameCard({ title, to, tag, Anim }) {
  return (
    <article style={styles.card}>
      <div style={styles.cardTop}>
        <h3 style={styles.cardTitle}>{title}</h3>
        {tag && <span style={styles.pill}>{tag}</span>}
      </div>

      <div style={styles.animBox}>
        <Anim />
      </div>

      <Link to={to} style={styles.btn}>Jogar agora</Link>
    </article>
  );
}

/* ------------------------------ Animações ---------------------------- */
function Coin() {
  return <div style={styles.coin} />;
}

function Dice() {
  return <div style={styles.dice}>⚄</div>;
}

function SlotStrip() {
  const symbols = ["⭐", "🔔", "🍒", "💎", "7️⃣", "🍋", "🍇"];
  return (
    <div style={{ ...styles.reelWrap }}>
      <div style={styles.reelTrack}>
        {symbols.concat(symbols).map((s, i) => (
          <div key={i} style={styles.reelCell}>{s}</div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- Styles ------------------------------ */
const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1400px 600px at 50% -180px, #0f172a, #0b1222 55%, #08101d 85%)",
  },
  wrap: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "20px 16px 32px",
  },
  header: {
    background:
      "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02)), radial-gradient(900px 300px at 50% -80px, rgba(120,80,255,.06), rgba(0,0,0,.15))",
    border: "1px solid #1f2637",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
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
    fontWeight: 700,
  },

  grid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(3, 1fr)",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    borderRadius: 14,
    border: "1px solid rgba(120,140,255,.12)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02)), radial-gradient(900px 300px at 50% -80px, rgba(80,160,255,.05), rgba(0,0,0,.2))",
    boxShadow: "0 1px 0 rgba(255,255,255,.03) inset",
    padding: 16,
    minHeight: 220,
    justifyContent: "space-between",
    color: "#eaf2ff",
  },
  cardTop: {
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

  /* animações centralizadas com altura única */
  animBox: {
    height: 96,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Coin */
  coin: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 30% 30%, #fff6, transparent 55%), linear-gradient(180deg, #fde68a, #f59e0b)",
    border: "2px solid rgba(234,179,8,.8)",
    boxShadow:
      "0 0 0 1px rgba(0,0,0,.35) inset, 0 6px 20px rgba(245,158,11,.25), 0 0 18px rgba(245,158,11,.15)",
    animation: "hubSpinY 1.1s linear infinite",
  },

  /* Dice */
  dice: {
    width: 50,
    height: 50,
    display: "grid",
    placeItems: "center",
    fontSize: 30,
    borderRadius: 12,
    background: "linear-gradient(180deg, #0ea5e9, #0369a1)",
    color: "#fff",
    border: "1px solid rgba(3,105,161,.6)",
    boxShadow: "0 8px 22px rgba(2,132,199,.25)",
    animation: "hubBob 2.1s ease-in-out infinite",
  },

  /* Slots */
  reelWrap: {
    width: 170,
    overflow: "hidden",
  },
  reelTrack: {
    display: "flex",
    gap: 8,
    animation: "hubReel 3.2s linear infinite",
  },
  reelCell: {
    width: 40,
    height: 40,
    display: "grid",
    placeItems: "center",
    fontSize: 22,
    background: "linear-gradient(180deg, #111827, #0b1222)",
    border: "1px solid #22314a",
    borderRadius: 10,
    boxShadow: "0 4px 10px rgba(0,0,0,.25)",
  },

  /* Botão */
  btn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 12,
    background: "linear-gradient(180deg,#34d399,#10b981)",
    color: "#062018",
    fontWeight: 800,
    textDecoration: "none",
    border: "1px solid rgba(16,185,129,.65)",
    boxShadow:
      "0 6px 40px rgba(16,185,129,.25), 0 0 0 1px rgba(16,185,129,.35) inset",
  },

  /* responsivo */
  "@media (maxWidth:980px)": {},
};

