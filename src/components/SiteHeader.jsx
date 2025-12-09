// src/components/SiteHeader.jsx
import { Link, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function SiteHeader() {
  const nav = useNavigate();
  const { token, user, logout } = useAuth();
  const logo = "/dama-bet-logo.png";
  const display = user?.nome || user?.usuario || "";

  const onLogout = () => {
    try {
      logout();
    } finally {
      nav("/login", { replace: true });
    }
  };

  return (
    <header style={s.bar}>
      <div style={s.inner}>
        <Link to="/" style={s.brand} aria-label="Ir para a página inicial">
          <img src={logo} alt="Tiger 67" style={s.logo} />
          <span style={s.name}>Tiger 67</span>
        </Link>

        <nav style={s.nav}>
          {/* Hub de jogos */}
          

          {/* Mantemos Afiliados; removemos Sobre e Contato */}
          <NavLink to="/afiliados" style={s.link}>Indicações e Pontos</NavLink>

          {!token ? (
            <>
              <Link to="/login" style={s.btnGhost}>Entrar</Link>
              <Link to="/signup" style={s.btnPrimary}>Criar conta</Link>
            </>
          ) : (
            <>
              <span style={s.greeting}>
                Olá, <b>{display || "jogador(a)"} </b>
              </span>
              <Link to="/area" style={s.btnPrimary}>Minha área</Link>
              <button onClick={onLogout} style={s.btnGhostBtn} type="button">
                Sair
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

const s = {
  /* Barra com gradiente e leve glow */
  bar: {
    position: "sticky",
    top: 0,
    zIndex: 40,
    background:
      "linear-gradient(180deg, rgba(13,18,34,.85), rgba(10,14,26,.78))," +
      "radial-gradient(1100px 200px at 50% -120px, rgba(99,102,241,.18), rgba(0,0,0,0))",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(99,102,241,.25)",
    boxShadow: "0 8px 35px rgba(59,130,246,.08)",
  },
  inner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
  },
  logo: { width: 22, height: 22, objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(147,197,253,.35))" },
  name: {
    fontWeight: 800,
    letterSpacing: 0.2,
    background: "linear-gradient(90deg, #60a5fa, #a78bfa 60%, #22d3ee)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  nav: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },

  /* Link com estado ativo colorido e efeito brilho no hover */
  link: ({ isActive }) => ({
    color: "#e5edff",
    textDecoration: "none",
    padding: "8px 10px",
    fontSize: 14,
    borderRadius: 999,
    background: isActive
      ? "linear-gradient(90deg, rgba(59,130,246,.25), rgba(99,102,241,.28))"
      : "transparent",
    border: isActive ? "1px solid rgba(99,102,241,.45)" : "1px solid rgba(148,163,184,.12)",
    boxShadow: isActive ? "0 0 0 1px rgba(99,102,241,.25) inset, 0 0 14px rgba(99,102,241,.15)" : "none",
    transition: "transform .08s ease, box-shadow .18s ease, background .18s ease, border .18s ease",
    willChange: "transform, box-shadow",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    outline: "none",
    cursor: "pointer",
    userSelect: "none",
    ...(isActive
      ? { transform: "translateY(-0.5px)" }
      : {}),
    ':hover': {}, // (React inline não aplica pseudo; mantemos o visual com transition + background no active)
  }),

  btnGhost: {
    color: "#e5edff",
    textDecoration: "none",
    border: "1px solid rgba(148,163,184,.25)",
    padding: "8px 12px",
    borderRadius: 12,
    background: "linear-gradient(180deg, rgba(17,24,39,.55), rgba(17,24,39,.25))",
    transition: "box-shadow .18s ease, transform .06s ease",
    boxShadow: "0 0 0 1px rgba(148,163,184,.12) inset",
  },
  btnGhostBtn: {
    color: "#e5edff",
    background: "linear-gradient(180deg, rgba(17,24,39,.55), rgba(17,24,39,.25))",
    border: "1px solid rgba(148,163,184,.25)",
    padding: "8px 12px",
    borderRadius: 12,
    cursor: "pointer",
    transition: "box-shadow .18s ease, transform .06s ease",
    boxShadow: "0 0 0 1px rgba(148,163,184,.12) inset",
  },

  /* Botão com gradiente vibrante e glow */
  btnPrimary: {
    color: "#06151a",
    textDecoration: "none",
    fontWeight: 800,
    letterSpacing: 0.2,
    background: "linear-gradient(180deg, #60a5fa, #22d3ee)",
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(34,211,238,.65)",
    boxShadow:
      "0 6px 28px rgba(34,211,238,.25), 0 0 0 1px rgba(34,211,238,.35) inset",
    transition: "transform .06s ease, box-shadow .18s ease",
  },

  greeting: { opacity: 0.9, fontSize: 13, marginRight: 6, color: "#cfe8ff" },
};
