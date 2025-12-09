// site/src/pages/site/Affiliates.jsx
import { useEffect, useMemo, useState } from "react";
import { referralsApi } from "../../lib/api";

/* ---------- helper: base do site ---------- */
function getSiteBaseUrl() {
  const fromEnv = import.meta?.env?.VITE_SITE_BASE_URL;
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) return fromEnv.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return "https://dama-site.vercel.app";
}

/* ---------- Página ---------- */
export default function Affiliates() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimedOk, setClaimedOk] = useState(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const { data } = await referralsApi.me();
      setData(data);
    } catch (e) {
      setErr(e?.response?.data?.erro || "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  async function claim() {
    setClaiming(true);
    setErr("");
    setClaimedOk(false);
    try {
      await referralsApi.claimWeekly();
      await load();
      setClaimedOk(true);
      // mantive o alert para feedback imediato
      alert("Recompensa resgatada com sucesso!");
    } catch (e) {
      setErr(e?.response?.data?.erro || "Não foi possível resgatar.");
    } finally {
      setClaiming(false);
      setTimeout(() => setClaimedOk(false), 3500);
    }
  }

  useEffect(() => { load(); }, []);

  const pts = (n) => Number(n || 0).toLocaleString("pt-BR");

  /* ---------- link final de indicação ---------- */
  const inviteUrl = useMemo(() => {
    const base = getSiteBaseUrl();
    const code = data?.referral_code || data?.code || "";

    const raw = String(data?.share_link || "");
    const isHttp = /^https?:\/\//i.test(raw);
    const looksLocal = /localhost|127\.0\.0\.1|:\d{2,5}(\/|$)/i.test(raw);

    if (isHttp && !looksLocal && raw.includes(code)) {
      return raw.replace(/\/+$/, "");
    }
    return `${base}/?ref=${encodeURIComponent(code)}`;
  }, [data]);

  /* ---------- progresso ---------- */
  const threshold = Number(data?.rules?.threshold_points ?? 1000);
  const current = Number(data?.week_points ?? 0);
  const progress = Math.max(0, Math.min(100, Math.floor((current / (threshold || 1)) * 100)));

  const waShare = `https://wa.me/?text=${encodeURIComponent(
    `Vem jogar comigo no Tiger 67! Cadastre-se: ${inviteUrl}`
  )}`;
  const tgShare = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(
    "Vem jogar comigo no Tiger 67!"
  )}`;

  return (
    <div style={s.page}>
      {/* keyframes (uma vez) */}
      <style id="aff-keyframes">{keyframes}</style>

      <div style={s.hero}>
        <div className="wrap" style={s.heroInner}>
          <div>
            <div style={s.kicker}>Programa de Indicações</div>
            <h1 style={s.h1}>Indique &amp; Ganhe</h1>
            <p style={s.heroP}>
              Convide amigos e acumule pontos. No <b>primeiro depósito</b> do indicado (mínimo{" "}
              <b>R$ 50,00</b>) você recebe um bônus extra.
            </p>
            <div style={s.heroBadges}>
              <span style={s.badge}>🔔 Bônus semanal</span>
              <span style={s.badge}>💎 Recompensas exclusivas</span>
              <span style={s.badge}>⚡ Link rápido de convite</span>
            </div>
          </div>

          <div style={s.scoreCard}>
            <div style={s.scoreHeader}>Pontos na semana</div>
            <div style={s.scoreBig}>
              {loading ? "—" : pts(current)} <span style={s.scoreSmall}>/ {pts(threshold)}</span>
            </div>
            <div style={s.progressWrap} aria-label="Progresso de pontos">
              <div style={{ ...s.progressBar, width: `${progress}%` }} />
              <div style={s.progressGlow} />
            </div>
            <div style={s.progressHint}>
              {progress >= 100 ? "Meta atingida! 🎉" : `Faltam ${pts(Math.max(threshold - current, 0))} pts`}
            </div>

            <button style={s.btnShiny} disabled={claiming} onClick={claim}>
              {claiming ? "Resgatando…" : "Resgatar recompensa"}
            </button>

            {claimedOk && <div style={s.claimToast}>✅ Recompensa resgatada!</div>}
          </div>
        </div>
      </div>

      <div className="wrap" style={s.inner}>
        {err && <div style={s.error}>{err}</div>}

        {loading ? (
          <div style={s.loaderRow}>
            <div style={s.loader} /> Carregando…
          </div>
        ) : data ? (
          <>
            {/* Cartão de convite */}
            <section style={s.card}>
              <div style={s.cardTitleRow}>
                <h2 style={s.h2}>Seu link de convite</h2>
                <span style={s.tip}>Divulgue para ganhar pontos a cada indicação confirmada.</span>
              </div>

              <div style={s.inviteRow}>
                <input style={s.input} readOnly value={inviteUrl} />
                <button
                  style={s.btnLight}
                  onClick={() => navigator.clipboard.writeText(inviteUrl)}
                  title="Copiar link"
                >
                  Copiar
                </button>
                <a href={waShare} target="_blank" rel="noreferrer" style={s.btnWhats}>
                  WhatsApp
                </a>
                <a href={tgShare} target="_blank" rel="noreferrer" style={s.btnTele}>
                  Telegram
                </a>
              </div>

              <div style={s.muted}>
                Código pessoal: <b>{data.referral_code}</b>
              </div>
            </section>

            {/* Tabela de indicados */}
            <section style={s.card}>
              <div style={s.cardTitleRow}>
                <h2 style={s.h2}>Seus indicados</h2>
                <span style={s.pillInfo}>{(data.referrals?.length || 0)} total</span>
              </div>

              {!data.referrals || data.referrals.length === 0 ? (
                <div style={{ marginTop: 8, opacity: 0.85 }}>
                  Você ainda não tem indicados. Compartilhe seu link acima!
                </div>
              ) : (
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nome</th>
                        <th>Login</th>
                        <th>Entrou em</th>
                        <th>1º Depósito</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.referrals.map((r, i) => (
                        <tr key={r.id || i}>
                          <td>{i + 1}</td>
                          <td>{r.nome || "-"}</td>
                          <td>{r.login || "-"}</td>
                          <td>{r.joined_at ? new Date(r.joined_at).toLocaleString() : "-"}</td>
                          <td>{r.first_deposit_at ? new Date(r.first_deposit_at).toLocaleString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ----------------------------- estilos ----------------------------- */
const s = {
  page: { background: "#0c0f14", minHeight: "100vh", color: "#eaecef" },

  hero: {
    position: "relative",
    background:
      "radial-gradient(1200px 600px at 20% -20%, #1b2440 0%, rgba(6,12,20,0) 60%)," +
      "radial-gradient(1200px 600px at 85% -25%, #3e1f40 0%, rgba(6,12,20,0) 50%)," +
      "#070b14",
    borderBottom: "1px solid rgba(255,255,255,.06)",
    padding: "20px 0 26px",
    overflow: "hidden",
  },
  heroInner: {
    display: "grid",
    gridTemplateColumns: "1.2fr .9fr",
    gap: 18,
    alignItems: "center",
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#8bd4ff",
    textShadow: "0 0 8px rgba(56,189,248,.25)",
  },
  h1: { margin: "6px 0 6px", fontSize: 28, color: "#fff" },
  heroP: { margin: "4px 0 10px", color: "#cfe6ff", maxWidth: 640 },
  heroBadges: { display: "flex", gap: 8, flexWrap: "wrap" },
  badge: {
    background: "rgba(56,189,248,.12)",
    border: "1px solid rgba(56,189,248,.4)",
    color: "#bfe9ff",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
  },

  scoreCard: {
    background:
      "linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.015)), rgba(8,12,20,.85)",
    border: "1px solid rgba(255,220,130,.35)",
    boxShadow: "0 0 18px rgba(255,215,128,.06), inset 0 1px 0 rgba(255,255,255,.03)",
    borderRadius: 16,
    padding: 16,
    minWidth: 280,
    justifySelf: "end",
  },
  scoreHeader: { fontSize: 12, color: "#ffe6a8", opacity: 0.9, marginBottom: 2 },
  scoreBig: {
    fontSize: 32,
    fontWeight: 900,
    color: "#fff6cc",
    textShadow: "0 0 16px rgba(255,215,128,.25)",
  },
  scoreSmall: { fontSize: 14, opacity: 0.9, marginLeft: 6 },
  progressWrap: {
    position: "relative",
    height: 12,
    borderRadius: 999,
    background: "linear-gradient(180deg, #0f172a, #0b1222)",
    border: "1px solid rgba(255,255,255,.06)",
    margin: "8px 0 4px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    background: "linear-gradient(90deg, #ffd780, #f5b65c)",
    boxShadow: "0 10px 28px rgba(255,215,128,.25) inset",
    transition: "width .6s cubic-bezier(.2,.7,.2,1)",
  },
  progressGlow: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent)",
    animation: "aff-shine 2.8s ease-in-out infinite",
    pointerEvents: "none",
  },
  progressHint: { fontSize: 12, color: "#cbd5e1", opacity: 0.9, marginBottom: 8 },

  btnShiny: {
    width: "100%",
    background: "linear-gradient(180deg,#ffd780,#f5b65c)",
    color: "#2a1a05",
    border: "1px solid rgba(255,215,128,.65)",
    borderRadius: 12,
    padding: "12px 14px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 12px 40px rgba(255,215,128,.25), 0 0 0 1px rgba(255,215,128,.35) inset",
    animation: "aff-pulse 2.4s ease-in-out infinite",
  },
  claimToast: {
    marginTop: 8,
    background: "rgba(16,185,129,.15)",
    border: "1px solid rgba(16,185,129,.45)",
    color: "#d1fae5",
    borderRadius: 10,
    padding: "8px 10px",
    boxShadow: "0 0 24px rgba(16,185,129,.08) inset",
    fontSize: 13,
  },

  inner: { maxWidth: 1000, margin: "0 auto", padding: "20px 16px", display: "grid", gap: 16 },

  card: {
    background: "#0e1422",
    border: "1px solid #1f2533",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 1px 0 rgba(255,255,255,.03) inset",
  },
  cardTitleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  h2: { margin: 0, fontSize: 18, color: "#e7eeff" },
  tip: { fontSize: 12, color: "#b6c2d9" },
  pillInfo: {
    background: "rgba(56,189,248,.15)",
    color: "#86e1ff",
    border: "1px solid rgba(56,189,248,.45)",
    padding: "4px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
  },

  inviteRow: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 8 },
  input: {
    flex: "1 1 520px",
    minWidth: 260,
    background: "#0c1220",
    border: "1px solid #253047",
    color: "#eaecef",
    borderRadius: 10,
    padding: "12px 12px",
  },
  btnLight: {
    background: "#1f2937",
    color: "#eaecef",
    border: "1px solid #374151",
    borderRadius: 10,
    padding: "12px 14px",
    cursor: "pointer",
  },
  btnWhats: {
    background: "#22c55e",
    color: "#06240e",
    border: "1px solid rgba(34,197,94,.6)",
    borderRadius: 10,
    padding: "12px 14px",
    fontWeight: 800,
    textDecoration: "none",
  },
  btnTele: {
    background: "#38bdf8",
    color: "#02131f",
    border: "1px solid rgba(56,189,248,.6)",
    borderRadius: 10,
    padding: "12px 14px",
    fontWeight: 800,
    textDecoration: "none",
  },

  tableWrap: { overflowX: "auto", marginTop: 10 },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: 14,
  },
  loaderRow: { display: "flex", alignItems: "center", gap: 8, opacity: 0.9 },
  loader: {
    width: 16,
    height: 16,
    border: "2px solid rgba(255,255,255,.25)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  error: {
    background: "#2a0f10",
    border: "1px solid #7f1d1d",
    color: "#fecaca",
    borderRadius: 10,
    padding: "8px 10px",
    marginBottom: 10,
  },
};

/* ----------------------------- keyframes ----------------------------- */
const keyframes = `
@keyframes spin { to { transform: rotate(360deg) } }
@keyframes aff-pulse {
  0%,100% { transform: translateY(0); box-shadow: 0 12px 40px rgba(255,215,128,.25), 0 0 0 1px rgba(255,215,128,.35) inset; }
  50%     { transform: translateY(-1px); box-shadow: 0 18px 52px rgba(255,215,128,.35), 0 0 0 1px rgba(255,255,255,.06) inset; }
}
@keyframes aff-shine {
  0% { transform: translateX(-120%) }
  60% { transform: translateX(120%) }
  100% { transform: translateX(120%) }
}
`;

/* pequeno helper de layout */
if (typeof document !== "undefined" && !document.getElementById("aff-wrap-style")) {
  const el = document.createElement("style");
  el.id = "aff-wrap-style";
  el.textContent = `.wrap{max-width:1200px;margin:0 auto;padding:0 16px}`;
  document.head.appendChild(el);
}
