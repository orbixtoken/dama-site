// src/pages/site/LandingPage.jsx
import { Link, useNavigate } from "react-router-dom";
import "./landing.css";

const BG_IMG = import.meta.env.VITE_LANDING_BG || "/dama-bet-fundo.png";
const LOGO_IMG =
  import.meta.env.VITE_LANDING_LOGO || "/dama-bet-silhueta-gold-no-bg.png";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="brand" onClick={() => navigate("/")}>
            <img src={LOGO_IMG} alt="Dama Bet" className="brand-logo" />
            <span className="brand-name">Dama Bet</span>
          </div>
          <div className="header-actions">
            <Link className="btn ghost" to="/login">
              Entrar
            </Link>
            {/* ✅ rota correta do signup */}
            <Link className="btn" to="/signup">
              Criar Conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div
          className="hero-bg"
          style={{ backgroundImage: `url("${BG_IMG}")` }}
        />
        {/* ✅ garante que overlay não bloqueie cliques */}
        <div className="hero-overlay" style={{ pointerEvents: "none" }} />
        {/* ✅ idem para a imagem decorativa */}
        <img
          src={LOGO_IMG}
          alt=""
          className="hero-figure"
          style={{ pointerEvents: "none" }}
        />
        <div className="hero-inner">
          <h1>
            Elegância no jogo.{" "}
            <span className="gold">Recompensas à altura.</span>
          </h1>
          <p className="hero-sub">.</p>

          <div className="scroll-hint">
            <a href="#games">▾</a>
          </div>
        </div>
      </section>

      {/* Games */}
      <section id="games" className="games wrap">
        <h2>Jogos em destaque</h2>
        <div className="games-grid">
          <article className="game-card">
            <header>
              <h3>Coin Flip</h3>
              <span className="pill">Novo</span>
            </header>
            <p>Escolha cara ou coroa e jogue em segundos.</p>
            {/* ✅ leva para a área autenticada */}
            <Link className="btn sm" to="/area">
              Jogar Coin Flip
            </Link>
          </article>

          <article className="game-card">
            <header>
              <h3>Dice</h3>
            </header>
            <p>Acerte o número do dado e busque o multiplicador.</p>
            <Link className="btn sm" to="/area">
              Jogar Dice
            </Link>
          </article>

          <article className="game-card">
            <header>
              <h3>Slots</h3>
            </header>
            <p>Gire e combine símbolos para multiplicar sua stake.</p>
            <Link className="btn sm" to="/area">
              Jogar Slots
            </Link>
          </article>
        </div>
      </section>

      {/* Footer simples */}
      <footer className="footer">
        <div className="wrap footer-inner">
          <span>
            © {new Date().getFullYear()} Dama Bet. Todos os direitos
            reservados. Produto destinado a Maiores de 18 anos.
          </span>
        </div>
      </footer>
    </div>
  );
}
