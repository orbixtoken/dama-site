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
        <div className="header-inner wrap">
          <div className="brand" onClick={() => navigate("/")}>
            <img src={LOGO_IMG} alt="Dama Bet" className="brand-logo" />
            <span className="brand-name">Dama Bet</span>
          </div>
          <div className="header-actions">
            <Link className="btn ghost" to="/login">
              Entrar
            </Link>
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
        <div className="hero-overlay" />

        <div className="hero-inner wrap">
          {/* texto */}
          <div className="hero-text">
            <div className="hero-tag-row">
              <span className="hero-tag">Cassino online exclusivo</span>
              <span className="hero-tag hero-tag-alt">
                Ambiente seguro e verificado
              </span>
            </div>

            <h1 className="hero-title">
              <span className="hero-title-main">Elegância no jogo.</span>{" "}
              <span className="hero-title-highlight">
                Cassino rápido e recompensas reais.
              </span>
            </h1>

            <p className="hero-sub">
              Deposite via PIX, escolha seu jogo favorito e entre na vibe
              exclusiva da Dama Bet. Coin Flip, Dice e Slots em uma experiência
              feita para ser simples, bonita e intensa.
            </p>

            <div className="hero-cta-row">
              <button
                type="button"
                className="btn hero-btn-primary"
                onClick={() => navigate("/signup")}
              >
                Começar agora
              </button>
              <button
                type="button"
                className="btn ghost hero-btn-secondary"
                onClick={() => navigate("/login")}
              >
                Já tenho conta
              </button>
            </div>

            {/* benefícios em “chips” */}
            <div className="hero-benefits">
              <div className="benefit-pill">
                <span className="pill-dot">●</span> Depósito via PIX
              </div>
              <div className="benefit-pill">
                <span className="pill-dot">●</span> Jogos instantâneos
              </div>
              <div className="benefit-pill">
                <span className="pill-dot">●</span> Bônus de boas-vindas*
              </div>
            </div>

            {/* letreiro neon / marquee */}
            <div className="hero-marquee">
              <div className="marquee-inner">
                <span>💎 Cashback diário selecionado</span>
                <span>🎁 Missões e conquistas em breve</span>
                <span>🔥 Coin Flip, Dice e Slots com visual premium</span>
              </div>
            </div>

            <div className="scroll-hint">
              <a href="#games">Ver jogos ▾</a>
            </div>
          </div>

          {/* figura da Dama */}
          <div className="hero-figure-wrap">
            <img
              src={LOGO_IMG}
              alt="Dama Bet"
              className="hero-figure"
              loading="lazy"
            />
            <div className="hero-figure-glow" />
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
            <p>Escolha cara ou coroa, gire a moeda e veja a magia acontecer.</p>
            <div className="game-tags">
              <span>🔥 Rápido</span>
              <span>⚡ Instantâneo</span>
            </div>
            <Link className="btn sm" to="/area">
              Jogar Coin Flip
            </Link>
          </article>

          <article className="game-card">
            <header>
              <h3>Dice</h3>
              <span className="pill pill-blue">Clássico</span>
            </header>
            <p>Acerte o número do dado e busque multiplicadores elegantes.</p>
            <div className="game-tags">
              <span>🎲 Seis faces</span>
              <span>💥 Payout alto</span>
            </div>
            <Link className="btn sm" to="/area">
              Jogar Dice
            </Link>
          </article>

          <article className="game-card">
            <header>
              <h3>Slots</h3>
              <span className="pill pill-gold">Visual neon</span>
            </header>
            <p>Gire os rolos, combine símbolos e veja a chuva de moedas.</p>
            <div className="game-tags">
              <span>💎 Multiplicadores</span>
              <span>✨ Animações fortes</span>
            </div>
            <Link className="btn sm" to="/area">
              Jogar Slots
            </Link>
          </article>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="wrap footer-inner">
          <span>
            © {new Date().getFullYear()} Dama Bet. Todos os direitos
            reservados. Produto destinado a maiores de 18 anos.
          </span>
        </div>
      </footer>
    </div>
  );
}
