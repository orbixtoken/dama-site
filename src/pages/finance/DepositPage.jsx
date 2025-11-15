// site/src/pages/finance/DepositPage.jsx
import { useState } from "react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import BalanceHeader from "../../components/finance/BalanceHeader";
import { financeiroSiteApi } from "../../lib/api";
import QuickPixDeposits from "./QuickPixDeposits";

export default function DepositPage() {
  // formulário (valor livre)
  const [valor, setValor] = useState("");
  const [ref, setRef] = useState("");

  // feedback / ticket
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);

  const PIX_KEY_EMPRESA = "damabet6@gmail.com";

  const copy = async (txt) => {
    try {
      await navigator.clipboard.writeText(String(txt || ""));
      setMsg("Copiado para a área de transferência.");
      setTimeout(() => setMsg(""), 1500);
    } catch {
      window.prompt("Copie manualmente:", String(txt || ""));
    }
  };

  // normaliza "50,00" -> 50.00
  const toNumber = (v) => {
    const n = Number(String(v).replace(/[^\d,.-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setMsg("");
    setErr("");
    setLoading(true);

    try {
      const v = toNumber(valor);
      if (!Number.isFinite(v) || v <= 0) throw new Error("Informe um valor válido.");

      // 1) cria o depósito no backend (aparece no painel)
      const res = await financeiroSiteApi.createDeposit({
        valor: v,
        metodo: "PIX",
        referencia: ref || `Valor livre R$ ${v.toFixed(2)}`,
      });

      // 2) ticket normalizado + fallback de referencia
      const tRaw = res?.data || {};
      const codigo_ref =
        tRaw.codigo_ref ||
        tRaw.ref ||
        `REF-${Date.now().toString(36).slice(-6).toUpperCase()}`;

      const t = {
        ...tRaw,
        codigo_ref,
        pix_chave: PIX_KEY_EMPRESA, // garante exibir a chave correta
      };

      setTicket(t);
      setMsg(
        "Depósito criado! Faça o PIX usando a chave abaixo e, se possível, informe o código de referência na mensagem."
      );
      setValor("");
      setRef("");
    } catch (e2) {
      setErr(e2?.response?.data?.erro || e2?.message || "Falha ao criar depósito.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SiteHeader />

      <section className="wrap" style={{ padding: "16px 0 28px" }}>
        <BalanceHeader />

        {/* CARD — Depósito Rápido (valores pré-definidos) */}
        <div style={{ ...card, marginBottom: 16 }}>
          <h2 style={{ ...title, marginTop: 0 }}>Depositar</h2>
          <p style={muted}>
            Use um valor rápido ou crie um depósito com valor livre. Em ambos os casos,
            nós geramos um <strong>código de referência</strong> para você colocar na
            <em> mensagem do PIX</em>, agilizando a identificação.
          </p>

          {/* Banner explicativo fixo (sempre visível) */}
          <HowToPayBox />

          {!!msg && <div style={okBox}>{msg}</div>}
          {!!err && <div style={errBox}>{err}</div>}

          <QuickPixDeposits
            onTicket={(t) => {
              setTicket(t);
              setErr("");
              setMsg(t?.mensagem || "PIX gerado. Copie e pague no seu banco.");
              // rola até o resumo automaticamente para o usuário ver o código
              setTimeout(() => {
                document.getElementById("ticketResumo")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 60);
            }}
          />
        </div>

        {/* CARD — Valor livre (gera no backend) */}
        <div style={card}>
          <h3 style={title}>Depositar — valor livre</h3>

          {/* Ticket / Resumo */}
          {ticket && (
            <div id="ticketResumo" style={ticketBox}>
              <div style={{ display: "grid", gap: 12 }}>
                {ticket.codigo_ref && (
                  <div>
                    <div style={smallLbl}>Código de referência</div>

                    <div style={refRow}>
                      {/* Selo pulsante para chamar atenção */}
                      <span style={badgePulse} aria-hidden>REF</span>

                      <div style={monoBig}>
                        {ticket.codigo_ref}
                        <button
                          type="button"
                          onClick={() => copy(ticket.codigo_ref)}
                          className="btn"
                          style={{ marginLeft: 8, padding: "2px 8px" }}
                        >
                          Copiar
                        </button>
                      </div>
                    </div>

                    <div style={tipRef}>
                      <strong>Importante:</strong> ao pagar o PIX, escreva esse código na{" "}
                      <u>mensagem do PIX</u> (campo observação). Isso acelera a conferência
                      do seu pagamento.
                    </div>
                  </div>
                )}

                {ticket.brcode && (
                  <div>
                    <div style={smallLbl}>PIX Copia e Cola</div>
                    <div style={monoBig} title="Cole no seu app do banco">
                      {ticket.brcode.slice(0, 38)}…
                      <button
                        type="button"
                        onClick={() => copy(ticket.brcode)}
                        className="btn ghost"
                        style={{ marginLeft: 8, padding: "2px 8px" }}
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <div style={smallLbl}>Chave PIX da casa</div>
                  <div style={monoBig}>
                    {ticket.pix_chave || PIX_KEY_EMPRESA}
                    <button
                      type="button"
                      onClick={() => copy(ticket.pix_chave || PIX_KEY_EMPRESA)}
                      className="btn ghost"
                      style={{ marginLeft: 8, padding: "2px 8px" }}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>

              <ul style={{ margin: "12px 0 0 16px", color: "var(--muted,#aab3c5)" }}>
                <li>Abra seu banco e faça o pagamento via PIX.</li>
                <li>
                  Na <strong>mensagem do PIX</strong>, escreva o código de referência mostrado acima.
                </li>
                <li>Seu saldo será atualizado após a aprovação do depósito.</li>
              </ul>
            </div>
          )}

          {/* Formulário valor livre */}
          <form onSubmit={submit} style={{ display: "grid", gap: 10, maxWidth: 460, marginTop: 12 }}>
            <label style={label}>Valor (R$)</label>
            <input
              style={input}
              inputMode="decimal"
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ex.: 50,00"
              required
            />

            <label style={label}>Referência (opcional)</label>
            <input
              style={input}
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="Ex.: bônus, evento…"
            />

            <button className="btn" disabled={loading}>
              {loading ? "Gerando…" : "Gerar depósito (valor livre)"}
            </button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

/* ---------- Componente explicativo chamativo ---------- */
function HowToPayBox() {
  return (
    <div style={howtoBox}>
      <div style={howtoHeader}>
        <span style={howtoIcon} aria-hidden>💡</span>
        <b>Como pagar seu PIX e agilizar a aprovação</b>
      </div>
      <ol style={howtoList}>
        <li>
          Clique em um valor rápido ou gere um depósito com valor livre.
        </li>
        <li>
          Copie o <b>Pix Copia e Cola</b> ou a <b>chave PIX</b> e pague no seu banco.
        </li>
        <li>
          <b>Fundamental:</b> coloque o <b>código de referência</b> no campo{" "}
          <u>mensagem/observação</u> do PIX. Ex.: <code>REF-AB12CD</code>.
        </li>
        <li>
          Seu saldo será creditado assim que o pagamento for confirmado.
        </li>
      </ol>
      <div style={howtoFooter}>
        <span style={tag18}>+18</span> Jogue com responsabilidade.
      </div>
    </div>
  );
}

/* estilos inline */
const card = {
  background: "var(--panel,#101623)",
  border: "1px solid var(--line,#1f2637)",
  borderRadius: 12,
  padding: 16,
};
const title = { margin: "0 0 8px", fontSize: 16 };
const muted = { margin: "0 0 12px", color: "var(--muted,#aab3c5)" };
const label = { fontSize: 13, opacity: 0.85 };
const input = {
  background: "#0c1220",
  border: "1px solid #253047",
  color: "#eaecef",
  borderRadius: 8,
  padding: "10px 12px",
};
const okBox = {
  background: "#0f2a1d",
  border: "1px solid #166534",
  color: "#bbf7d0",
  borderRadius: 8,
  padding: "8px 10px",
  marginBottom: 10,
};
const errBox = {
  background: "#2a0f10",
  border: "1px solid #7f1d1d",
  color: "#fecaca",
  borderRadius: 8,
  padding: "8px 10px",
  marginBottom: 10,
};
const ticketBox = {
  border: "1px solid #253047",
  background: "#0c1220",
  borderRadius: 10,
  padding: 12,
};
const smallLbl = { fontSize: 12, opacity: 0.7, marginBottom: 4 };
const monoBig = {
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
  fontSize: 14,
  display: "inline-flex",
  alignItems: "center",
  wordBreak: "break-all",
};

/* Destaques do código de referência */
const refRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};
const badgePulse = {
  display: "inline-block",
  fontSize: 11,
  fontWeight: 800,
  color: "#052e1b",
  background: "#34d399",
  padding: "2px 6px",
  borderRadius: 999,
  boxShadow: "0 0 0 0 rgba(52,211,153,.8)",
  animation: "refPulse 1.6s ease-in-out infinite",
};
/* não temos CSS global aqui, então criamos uma regra inline-inject via style tag no head */
(function injectPulseOnce() {
  if (typeof document === "undefined") return;
  if (document.getElementById("ref-pulse-style")) return;
  const css = `
  @keyframes refPulse {
    0% { box-shadow: 0 0 0 0 rgba(52,211,153,.65); }
    70% { box-shadow: 0 0 0 12px rgba(52,211,153,0); }
    100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
  }`;
  const el = document.createElement("style");
  el.id = "ref-pulse-style";
  el.textContent = css;
  document.head.appendChild(el);
})();

const tipRef = {
  marginTop: 6,
  background: "rgba(52,211,153,.08)",
  border: "1px solid rgba(52,211,153,.35)",
  color: "#c7f9e5",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
};

/* Caixa didática (como pagar) */
const howtoBox = {
  margin: "10px 0 12px",
  borderRadius: 12,
  padding: 12,
  border: "1px solid rgba(59,130,246,.35)",
  background:
    "linear-gradient(180deg, rgba(30,58,138,.45), rgba(14,23,42,.7))",
  color: "#e6f0ff",
};
const howtoHeader = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 8,
  fontSize: 14,
};
const howtoIcon = {
  fontSize: 18,
  filter: "drop-shadow(0 0 6px rgba(59,130,246,.35))",
};
const howtoList = {
  margin: "0 0 8px 18px",
  padding: 0,
  lineHeight: 1.6,
  fontSize: 14,
};
const howtoFooter = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  opacity: 0.9,
  fontSize: 12,
};
const tag18 = {
  display: "inline-block",
  background: "#0f172a",
  border: "1px solid #334155",
  color: "#93c5fd",
  padding: "1px 6px",
  borderRadius: 6,
  fontWeight: 700,
};
