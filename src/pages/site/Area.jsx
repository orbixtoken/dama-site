// src/pages/site/Area.jsx
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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
            🔞 +18 &nbsp; • &nbsp; Dama Bet — Jogue com responsabilidade &nbsp; • &nbsp; Faça
            pausas & defina limites &nbsp; • &nbsp; Cashback e bônus especiais para jogadores
            frequentes
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
    <div style={st.chipGlow} />
  </div>
);

const Dice = () => (
  <div style={st.animBox}>
    <div style={st.diceCore}>
      <span style={{ filter: "drop-shadow(0 10px 24px rgba(0,0,0,.6))" }}>⚄</span>
    </div>
    <div style={st.chipGlowGreen} />
  </div>
);

const SlotStrip = () => (
  <div style={{ ...st.animBox, overflow: "hidden" }}>
    <div style={st.slotReel}>
      {["🍒", "💎", "7️⃣", "🔔", "🍋", "🍇", "⭐"].map((s, i) => (
        <div key={i} style={st.slotCell}>
          {s}
        </div>
      ))}
      {["🍒", "💎", "7️⃣", "🔔", "🍋", "🍇", "⭐"].map((s, i) => (
        <div key={`d-${i}`} style={st.slotCell}>
          {s}
        </div>
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
      "✨ A sorte gosta de quem gira sem medo!",
      "💎 Grandes vitórias começam com pequenos giros.",
      "🔥 Slots em destaque — aproveite o momento!",
      "🏅 Aposte com classe. Jogue com responsabilidade.",
      "🍀 Hoje pode ser o seu grande giro da sorte."
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
        <div className="wrap" style={{ padding: "22px 0" }}>
          <div style={st.heroGrid}>
            {/* Lado esquerdo - boas-vindas e stats */}
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
                  <span style={st.pillLabel}>Saldo disponível</span>
                  <strong style={st.pillValue}>
                    {saldo == null ? "—" : money(saldo)}
                  </strong>
                  <span style={st.pillSub}>Use com estratégia. Boa sorte! 🍀</span>
                </div>
                <div style={st.pillStat}>
                  <span style={st.pillLabel}>Indicações</span>
                  <strong style={st.pillValue}>{indic}</strong>
                  <span style={st.pillSub}>Convide amigos e ganhe benefícios.</span>
                </div>
                <div style={st.pillStat}>
                  <span style={st.pillLabel}>Pontos de jogo</span>
                  <strong style={st.pillValue}>{pontos}</strong>
                  <span style={st.pillSub}>Suba de nível jogando com frequência.</span>
                </div>
              </div>
            </div>

            {/* CTA lateral */}
            <div style={st.ctaCol}>
              <div style={st.ctaGlow} />
              <Link to="/financeiro" style={st.btnPrimary}>
                💳 Abrir carteira
              </Link>
              <div style={st.btnRow}>
                <Link to="/financeiro" style={st.btnGhost}>
                  ➕ Adicionar saldo
                </Link>
                <Link to="/financeiro" style={st.btnGhostAlt}>
                  🎁 Ver promoções
                </Link>
              </div>
              <div style={st.heroTagline}>
                <span style={st.tagHot}>HOT</span>
                <span>Slots em destaque com multiplicadores especiais.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Partículas de fundo */}
        <div style={st.heroFx} />
        <div style={st.heroChipLeft} />
        <div style={st.heroChipRight} />
      </section>

      {/* GAMES */}
      <section className="wrap" style={{ padding: "18px 0 32px" }}>
        <div style={st.panel}>
          <header style={st.panelHeader}>
            <div>
              <h3 style={st.panelTitle}>Jogos disponíveis</h3>
              <p style={st.panelSubtitle}>
                Escolha seu favorito, faça sua aposta e acompanhe tudo em tempo real.
              </p>
            </div>
            <div style={st.panelTabs}>
              <span style={st.tabActive}>🎰 Slots</span>
              <span style={st.tab}>🎲 Clássicos</span>
              <span style={st.tabMuted}>🔴 Ao vivo em breve</span>
            </div>
          </header>

          {/* GRID com 7 jogos, Tigrinho em destaque */}
          <div className="games-grid">
            {/* Destaque: Tigrinho da Fortuna */}
            <article
              className="game-card game-card--featured"
              style={st.cardFeatured}
            >
              <header style={st.cardHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={st.tigrinhoEmoji}>🐯</span>
                  <div>
                    <h3 style={st.cardTitle}>Tigrinho da Fortuna</h3>
                    <div style={st.cardSubtitle}>
                      Visual exclusivo Dama Bet inspirado nos slots mais famosos.
                    </div>
                  </div>
                </div>
                <span style={st.pillTigrinho}>Destaque</span>
              </header>
              <p style={st.cardDesc}>
                Gire com o tigrinho, alinhe símbolos dourados e dispute multiplicadores
                especiais. Mesmo motor do slots comum, com tema mais chamativo e
                sensação de “racha tela”.
              </p>

              <div style={st.tigrinhoRow}>
                <div style={st.tigrinhoBadge}>
                  🔥 Alta atividade agora • Muitos giros recentes
                </div>
                <div style={st.tigrinhoChipsWrap}>
                  <div style={st.tigrinhoChip} />
                  <div style={{ ...st.tigrinhoChip, transform: "scale(.8) translateX(-8px)" }} />
                  <div style={{ ...st.tigrinhoChip, transform: "scale(.7) translateX(-14px)" }} />
                </div>
              </div>

              <Link className="btn sm" to="/jogos/slots-tigrinho">
                Jogar Tigrinho
              </Link>
              <div style={st.cardRibbonTigrinho}>
                
              </div>
            </article>

            {/* 1 - Cara ou Coroa */}
            <article className="game-card" style={st.card}>
              <header style={st.cardHeader}>
                <h3 style={st.cardTitle}>Cara ou Coroa</h3>
                <span style={st.pillNew}>Novo</span>
              </header>
              <p style={st.cardDesc}>
                Escolha o lado da moeda, confirme sua aposta e veja o resultado em segundos.
              </p>
              <Coin />
              <Link className="btn sm" to="/jogos/coin-flip">
                Jogar agora
              </Link>
              <div style={st.cardRibbon}>Retornos rápidos • Apostas simples</div>
            </article>

            {/* 2 - Dados */}
            <article className="game-card" style={st.card}>
              <header style={st.cardHeader}>
                <h3 style={st.cardTitle}>Dados</h3>
                <span style={st.pillHot}>Quente</span>
              </header>
              <p style={st.cardDesc}>
                Aposte nos números e sinta a emoção dos lançamentos de dados com
                multiplicadores dinâmicos.
              </p>
              <Dice />
              <Link className="btn sm" to="/jogos/dice">
                Jogar agora
              </Link>
              <div style={st.cardRibbonGreen}>Multiplicadores especiais hoje</div>
            </article>

            {/* 3 - Slots comum */}
            <article className="game-card" style={st.card}>
              <header style={st.cardHeader}>
                <h3 style={st.cardTitle}>Slots comum</h3>
                <span style={st.pillJackpot}>Jackpot</span>
              </header>
              <p style={st.cardDesc}>
                A versão clássica dos rolos: emojis tradicionais, rolagem suave e
                histórico detalhado.
              </p>
              <SlotStrip />
              <Link className="btn sm" to="/jogos/slots">
                Jogar agora
              </Link>
              <div style={st.cardRibbonPurple}> 🔥</div>
            </article>

            {/* 4 - Slots Floresta Mística */}
            <article className="game-card" style={st.card}>
              <header style={st.cardHeader}>
                <h3 style={st.cardTitle}>Slots Floresta Mística</h3>
                <span style={st.pillTheme}>Tema</span>
              </header>
              <p style={st.cardDesc}>
                Um cenário de floresta brilhante, com símbolos mágicos e clima mais
                relax para girar.
              </p>
              <div style={st.animBox}>
                <span style={{ fontSize: 32 }}>🌲✨🦌</span>
              </div>
              <Link className="btn sm" to="/jogos/slots-floresta">
                Explorar floresta
              </Link>
            </article>

            {/* 5 - Slots Neon 777 */}
            <article className="game-card" style={st.card}>
              <header style={st.cardHeader}>
                <h3 style={st.cardTitle}>Slots Neon 777</h3>
                <span style={st.pillNeon}>Neon</span>
              </header>
              <p style={st.cardDesc}>
                Estilo cassino de strip, com luzes neon, clima futurista e foco no 7️⃣
                brilhando na tela.
              </p>
              <div style={st.animBox}>
                <span style={{ fontSize: 30, textShadow: "0 0 18px #22d3ee" }}>7️⃣ 7️⃣ 7️⃣</span>
              </div>
              <Link className="btn sm" to="/jogos/slots-neon">
                Jogar Neon
              </Link>
            </article>

            {/* 6 - Slots Egípcio */}
            <article className="game-card" style={st.card}>
              <header style={st.cardHeader}>
                <h3 style={st.cardTitle}>Slots Egípcio</h3>
                <span style={st.pillTheme}>Tema</span>
              </header>
              <p style={st.cardDesc}>
                Pirâmides, olhos de Hórus e escaravelhos dourados em um tema inspirado no
                Egito antigo.
              </p>
              <div style={st.animBox}>
                <span style={{ fontSize: 30 }}>🏺👁️‍🗨️🔱</span>
              </div>
              <Link className="btn sm" to="/jogos/slots-desert">
                Entrar no templo
              </Link>
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
      "radial-gradient(1200px 700px at 85% -20%, rgba(251,191,36,.18), transparent 60%), radial-gradient(900px 600px at 10% -10%, rgba(59,130,246,.25), transparent 55%), radial-gradient(700px 500px at 50% 120%, rgba(236,72,153,.35), #020617)",
    borderBottom: "1px solid rgba(255,255,255,.06)",
    overflow: "hidden"
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr .8fr",
    gap: 18,
    alignItems: "center"
  },
  hello: {
    fontSize: 24,
    fontWeight: 800,
    marginBottom: 6,
    textShadow: "0 0 16px rgba(251,191,36,.35)"
  },
  goldTxt: { color: "#ffe58a" },
  heroMsg: {
    fontSize: 16,
    color: "#e0f2fe",
    marginBottom: 14,
    textShadow: "0 0 12px rgba(56,189,248,.35)",
    animation: "fadeMsg .6s ease"
  },
  statRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap"
  },
  pillStat: {
    minWidth: 190,
    flex: "0 0 auto",
    background:
      "linear-gradient(180deg, rgba(255,230,168,.16), rgba(15,23,42,.9))",
    border: "1px solid rgba(255,220,130,.45)",
    color: "#ffe9b2",
    padding: "10px 12px 9px",
    borderRadius: 16,
    boxShadow:
      "0 10px 40px rgba(0,0,0,.6), 0 0 0 1px rgba(148,163,184,.25) inset",
    position: "relative",
    overflow: "hidden"
  },
  pillLabel: { fontSize: 11, opacity: 0.9, textTransform: "uppercase" },
  pillValue: { fontSize: 18, letterSpacing: 0.2 },
  pillSub: {
    display: "block",
    marginTop: 2,
    fontSize: 11,
    color: "#e2e8f0",
    opacity: 0.9
  },

  ctaCol: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "flex-end",
    position: "relative"
  },
  ctaGlow: {
    position: "absolute",
    inset: "-40%",
    background:
      "radial-gradient(400px 260px at 70% 30%, rgba(59,130,246,.35), transparent 70%)",
    opacity: 0.7,
    pointerEvents: "none",
    filter: "blur(2px)"
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "13px 18px",
    borderRadius: 999,
    background:
      "linear-gradient(135deg,#facc15,#f97316,#f97316,#fb923c)",
    color: "#1f1303",
    fontWeight: 900,
    textDecoration: "none",
    border: "1px solid rgba(251,191,36,.85)",
    boxShadow:
      "0 16px 40px rgba(251,191,36,.35), 0 0 0 1px rgba(120,53,15,.7) inset",
    transform: "translateY(0)",
    transition: "transform .09s ease, box-shadow .09s ease, filter .09s ease"
  },
  btnRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  btnGhost: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 999,
    textDecoration: "none",
    background: "linear-gradient(135deg,#020617,#0b1120)",
    color: "#e2e8f0",
    border: "1px solid rgba(148,163,184,.8)",
    fontSize: 13,
    fontWeight: 600
  },
  btnGhostAlt: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 999,
    textDecoration: "none",
    background: "linear-gradient(135deg,#4c1d95,#7e22ce)",
    color: "#f9fafb",
    border: "1px solid rgba(196,181,253,.9)",
    fontSize: 13,
    fontWeight: 700,
    boxShadow: "0 0 18px rgba(147,51,234,.45)"
  },
  heroTagline: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "#e5e7eb",
    marginTop: 4
  },
  tagHot: {
    background: "linear-gradient(135deg,#ef4444,#f97316)",
    color: "#fff7ed",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    padding: "3px 8px",
    boxShadow: "0 0 12px rgba(248,113,113,.7)"
  },
  heroFx: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(800px 220px at 40% -80px, rgba(255,255,255,.1), transparent 65%)",
    maskImage:
      "radial-gradient(800px 200px at 40% -60px, rgba(0,0,0,.9), transparent 65%)"
  },
  heroChipLeft: {
    position: "absolute",
    left: "-40px",
    top: "40%",
    width: 90,
    height: 90,
    borderRadius: "50%",
    border: "4px solid rgba(248,250,252,.5)",
    background:
      "conic-gradient(from 0deg, #fb923c, #facc15, #6366f1, #ec4899, #fb923c)",
    opacity: 0.25,
    filter: "blur(0.4px)",
    animation: "floatChip 10s ease-in-out infinite"
  },
  heroChipRight: {
    position: "absolute",
    right: "-30px",
    top: "18%",
    width: 70,
    height: 70,
    borderRadius: "50%",
    border: "3px solid rgba(248,250,252,.7)",
    background:
      "conic-gradient(from 120deg, #22c55e, #0ea5e9, #f97316, #22c55e)",
    opacity: 0.3,
    filter: "blur(0.3px)",
    animation: "floatChip 12s ease-in-out infinite reverse"
  },

  /* Painéis / grid jogos */
  panel: {
    background:
      "linear-gradient(180deg,#020617,#020617,#020617,#020617,#020617)",
    border: "1px solid #1e293b",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    boxShadow: "0 18px 45px rgba(0,0,0,.75)"
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    marginBottom: 12,
    flexWrap: "wrap"
  },
  panelTitle: {
    margin: 0,
    fontSize: 18,
    letterSpacing: 0.4
  },
  panelSubtitle: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#cbd5f5"
  },
  panelTabs: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
  },
  tabActive: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "linear-gradient(135deg,#f97316,#facc15)",
    color: "#1f2933",
    fontSize: 12,
    fontWeight: 800,
    boxShadow: "0 0 16px rgba(249,115,22,.6)"
  },
  tab: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,.9)",
    border: "1px solid rgba(148,163,184,.7)",
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: 600
  },
  tabMuted: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,.8)",
    border: "1px dashed rgba(148,163,184,.6)",
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: 500
  },

  /* Cards */
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,.65)",
    background:
      "radial-gradient(600px 260px at 50% -40px, rgba(251,191,36,.24), transparent 60%), linear-gradient(180deg, rgba(15,23,42,.96), rgba(15,23,42,1))",
    boxShadow:
      "0 12px 35px rgba(0,0,0,.7), 0 0 0 1px rgba(15,23,42,.9) inset",
    padding: 16,
    minHeight: 240,
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden"
  },
  cardFeatured: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    borderRadius: 20,
    border: "1px solid rgba(251,191,36,.85)",
    background:
      "radial-gradient(800px 320px at 10% -40px, rgba(236,72,153,.4), transparent 60%), radial-gradient(900px 420px at 90% 120%, rgba(251,191,36,.35), transparent 70%), linear-gradient(180deg, #020617, #020617)",
    boxShadow:
      "0 18px 55px rgba(0,0,0,.85), 0 0 0 1px rgba(55,65,81,.9) inset, 0 0 40px rgba(251,191,36,.35)",
    padding: 18,
    minHeight: 260,
    position: "relative",
    overflow: "hidden"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  cardTitle: { margin: 0, letterSpacing: 0.2 },
  cardSubtitle: {
    fontSize: 12,
    color: "#e5e7eb",
    opacity: 0.9,
    marginTop: 2
  },
  cardDesc: {
    fontSize: 13,
    color: "#cbd5f5",
    margin: "2px 0 4px"
  },
  pillNew: {
    background: "rgba(56,189,248,.22)",
    color: "#e0f2fe",
    border: "1px solid rgba(56,189,248,.7)",
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800
  },
  pillHot: {
    background: "rgba(239,68,68,.16)",
    color: "#fecaca",
    border: "1px solid rgba(248,113,113,.85)",
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800
  },
  pillJackpot: {
    background: "linear-gradient(135deg,#f97316,#facc15)",
    color: "#1f1303",
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    boxShadow: "0 0 12px rgba(251,191,36,.8)"
  },
  pillTheme: {
    background: "rgba(59,130,246,.15)",
    color: "#bfdbfe",
    border: "1px solid rgba(59,130,246,.85)",
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800
  },
  pillNeon: {
    background: "rgba(6,182,212,.2)",
    color: "#a5f3fc",
    border: "1px solid rgba(6,182,212,.9)",
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800
  },
  pillTigrinho: {
    background: "linear-gradient(135deg,#f97316,#facc15)",
    color: "#1f1303",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    boxShadow:
      "0 0 14px rgba(251,191,36,.85), 0 0 18px rgba(236,72,153,.65)"
  },
  cardRibbon: {
    position: "absolute",
    left: -40,
    top: 16,
    padding: "4px 48px",
    fontSize: 11,
    textTransform: "uppercase",
    background:
      "linear-gradient(135deg,rgba(56,189,248,.9),rgba(37,99,235,.95))",
    color: "#e0f2fe",
    transform: "rotate(-35deg)",
    boxShadow: "0 0 22px rgba(56,189,248,.7)",
    pointerEvents: "none"
  },
  cardRibbonGreen: {
    position: "absolute",
    right: -38,
    top: 20,
    padding: "4px 46px",
    fontSize: 11,
    textTransform: "uppercase",
    background:
      "linear-gradient(135deg,rgba(22,163,74,.9),rgba(34,197,94,.95))",
    color: "#ecfdf5",
    transform: "rotate(32deg)",
    boxShadow: "0 0 22px rgba(22,163,74,.8)",
    pointerEvents: "none"
  },
  cardRibbonPurple: {
    position: "absolute",
    left: -38,
    bottom: 14,
    padding: "4px 46px",
    fontSize: 11,
    textTransform: "uppercase",
    background:
      "linear-gradient(135deg,rgba(147,51,234,.85),rgba(59,130,246,.9))",
    color: "#faf5ff",
    transform: "rotate(-30deg)",
    boxShadow: "0 0 22px rgba(147,51,234,.8)",
    pointerEvents: "none"
  },
  cardRibbonTigrinho: {
    position: "absolute",
    left: -40,
    bottom: 10,
    padding: "4px 60px",
    fontSize: 11,
    textTransform: "uppercase",
    background:
      "linear-gradient(135deg,rgba(248,250,252,.95),rgba(251,191,36,.95))",
    color: "#111827",
    transform: "rotate(-28deg)",
    boxShadow: "0 0 26px rgba(251,191,36,.7)",
    pointerEvents: "none"
  },

  /* Destaque Tigrinho */
  tigrinhoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
    marginBottom: 4,
    flexWrap: "wrap"
  },
  tigrinhoBadge: {
    fontSize: 11,
    padding: "4px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,.85)",
    border: "1px solid rgba(251,191,36,.8)",
    color: "#fef9c3"
  },
  tigrinhoChipsWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 0
  },
  tigrinhoChip: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background:
      "conic-gradient(from 0deg,#facc15,#f97316,#fb923c,#facc15)",
    boxShadow: "0 0 18px rgba(251,191,36,.7)"
  },
  tigrinhoEmoji: {
    fontSize: 26,
    filter: "drop-shadow(0 0 18px rgba(248,250,252,.4))"
  },

  /* Área das mini-animações */
  animBox: {
    position: "relative",
    height: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  /* Coin 3D */
  coinCore: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 30% 30%, #fff8, transparent 55%), linear-gradient(180deg, #ffe8a8, #f97316)",
    border: "2px solid rgba(251,191,36,.9)",
    boxShadow:
      "0 0 0 1px rgba(0,0,0,.4) inset, 0 10px 28px rgba(245,158,11,.35), 0 0 22px rgba(245,158,11,.25)",
    animation: "spinY 1s linear infinite"
  },
  coinRim: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: "50%",
    border: "1px dashed rgba(252,211,77,.65)",
    animation: "pulse 1.6s ease-in-out infinite"
  },
  sparkle: {
    position: "absolute",
    width: 4,
    height: 26,
    borderRadius: 999,
    background:
      "linear-gradient(180deg, transparent, rgba(255,255,255,.95), transparent)",
    transform: "rotate(20deg)",
    animation: "shine 1.1s linear infinite",
    opacity: 0.9
  },
  chipGlow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(251,191,36,.4), transparent 65%)",
    filter: "blur(3px)",
    opacity: 0.8
  },

  /* Dice */
  diceCore: {
    width: 56,
    height: 56,
    display: "grid",
    placeItems: "center",
    fontSize: 30,
    borderRadius: 16,
    background: "linear-gradient(180deg, #22c55e, #16a34a)",
    color: "#fff",
    border: "1px solid rgba(22,163,74,.75)",
    boxShadow:
      "0 10px 26px rgba(22,163,74,.25), 0 0 0 1px rgba(0,0,0,.35) inset",
    animation: "bob 2s ease-in-out infinite"
  },
  chipGlowGreen: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(34,197,94,.4), transparent 65%)",
    filter: "blur(3px)",
    opacity: 0.9
  },

  /* Slots */
  slotReel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    animation: "reel 3s linear infinite"
  },
  slotCell: {
    width: 46,
    height: 46,
    display: "grid",
    placeItems: "center",
    fontSize: 24,
    background: "linear-gradient(180deg, #020617, #020617)",
    border: "1px solid rgba(248,250,252,.06)",
    borderRadius: 14,
    boxShadow: "0 8px 18px rgba(0,0,0,.45)"
  },
  reelShine: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,.14), transparent)",
    animation: "sweep 2.4s linear infinite",
    pointerEvents: "none"
  },

  /* Letreiro */
  tickerWrap: {
    position: "relative",
    overflow: "hidden",
    borderBottom: "1px solid rgba(56,189,248,.35)",
    background:
      "linear-gradient(90deg, #020617, #0f172a, #020617, #0f172a)",
    boxShadow: "0 1px 0 rgba(15,23,42,.9) inset"
  },
  tickerTrack: {
    display: "flex",
    gap: 32,
    padding: "6px 0",
    whiteSpace: "nowrap",
    animation: "marquee 18s linear infinite"
  },
  tickerItem: {
    color: "#7dd3fc",
    fontWeight: 800,
    letterSpacing: 0.4,
    textShadow: "0 0 10px rgba(56,189,248,.4)",
    textTransform: "uppercase",
    fontSize: 11
  }
};

/* ---------- Grid responsivo / botões globais do card ---------- */
const cssGlobal = `
.wrap { max-width:1200px; margin:0 auto; padding:0 16px; }
.games-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; margin-top:10px; }
@media (max-width: 980px){
  .games-grid { grid-template-columns: 1fr; }
}

/* Destaque ocupa a linha inteira em desktop */
@media (min-width: 981px){
  .game-card--featured {
    grid-column: 1 / span 3;
  }
}

/* Botões */
.btn {
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:10px 14px;
  border-radius:999px;
  background:linear-gradient(135deg,#38bdf8,#2563eb);
  color:#02131a;
  font-weight:800;
  text-decoration:none;
  border:1px solid rgba(56,189,248,.8);
  box-shadow:0 10px 32px rgba(56,189,248,.25), 0 0 0 1px rgba(8,47,73,.45) inset;
  text-transform:uppercase;
  letter-spacing:0.3px;
  transition: transform .09s ease, box-shadow .09s ease, filter .09s ease;
}
.btn.sm { padding:9px 13px; font-size:12px; }
.btn:hover {
  transform: translateY(-1px) scale(1.03);
  filter: brightness(1.05);
  box-shadow:0 16px 40px rgba(56,189,248,.35), 0 0 0 1px rgba(8,47,73,.75) inset;
}

/* Cards animados */
.game-card {
  cursor:pointer;
  position:relative;
  overflow:hidden;
}
.game-card::before {
  content:"";
  position:absolute;
  inset:-40%;
  background:conic-gradient(from 220deg, transparent 0deg, rgba(56,189,248,.18) 80deg, rgba(236,72,153,.22) 140deg, transparent 200deg);
  opacity:0;
  transform:scale(0.9);
  transition:opacity .2s ease, transform .2s ease;
  pointer-events:none;
}
.game-card:hover::before {
  opacity:1;
  transform:scale(1.02);
}

/* keyframes */
@keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
@keyframes spinY { 0%{transform:rotateY(0)} 100%{transform:rotateY(360deg)} }
@keyframes pulse { 0%,100%{opacity:.45; transform:scale(.98)} 50%{opacity:.95; transform:scale(1.05)} }
@keyframes shine { 0%{transform:translateX(-60px) rotate(20deg)} 100%{transform:translateX(60px) rotate(20deg)} }
@keyframes bob { 0%,100%{ transform: translateY(0) rotate(0deg); } 50%{ transform: translateY(-8px) rotate(-6deg); } }
@keyframes reel { 0%{ transform: translateX(0); } 100%{ transform: translateX(-50%); } }
@keyframes sweep { 0%{ transform: translateX(-100%); } 100%{ transform: translateX(100%); } }
@keyframes fadeMsg { from{opacity:0; transform:translateY(4px)} to{opacity:1; transform:translateY(0)} }
@keyframes floatChip {
  0%,100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-14px) rotate(8deg); }
}
`;

