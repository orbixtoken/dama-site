// site/src/pages/finance/WithdrawPage.jsx
import { useEffect, useState } from "react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import BalanceHeader from "../../components/finance/BalanceHeader";
import { financeiroSiteApi } from "../../lib/api";

export default function WithdrawPage() {
  const [valor, setValor] = useState("");
  const [pix, setPix] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [saldo, setSaldo] = useState({ saldo_disponivel: 0, saldo_bloqueado: 0 });

  // ---------- helpers ----------
  const normalizeValor = (v) => {
    const n = Number(String(v).replace(/[^\d,.-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  };
  const isPixOk = (k) => {
    const s = String(k || "").trim();
    return s.length >= 5 && s.length <= 120;
  };
  const fmtBRL = (v) =>
    `R$ ${Number(v || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  async function loadSaldo() {
    try {
      const { data } = await financeiroSiteApi.getBalance();
      setSaldo({
        saldo_disponivel: Number(data?.saldo_disponivel || 0),
        saldo_bloqueado: Number(data?.saldo_bloqueado || 0),
      });
    } catch {
      // silencioso
    }
  }

  useEffect(() => {
    loadSaldo();
    const onFocus = () => loadSaldo();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // ---------- submit ----------
  const sacar = async (e) => {
    e.preventDefault();
    if (loading) return;

    setMsg("");
    setErr("");
    setLoading(true);

    try {
      const v = normalizeValor(valor);
      if (!Number.isFinite(v) || v <= 0) throw new Error("Informe um valor válido.");
      if (!isPixOk(pix)) throw new Error("Informe uma chave PIX válida.");

      // IMPORTANTE: enviar como pix_chave (não 'chave_pix')
      const res = await financeiroSiteApi.withdraw({
        valor: v,
        pix_chave: String(pix).trim(),
      });

      setMsg(res?.data?.mensagem || "Solicitação de saque enviada.");
      setValor("");
      setPix("");
      await loadSaldo();
    } catch (e2) {
      setErr(e2?.response?.data?.erro || e2?.message || "Erro ao solicitar saque.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SiteHeader />

      <section className="wrap" style={{ padding: "16px 0 28px" }}>
        {/* Cabeçalho com saldo resumido */}
        <BalanceHeader />

        <div
          style={{
            background: "var(--panel,#101623)",
            border: "1px solid var(--line,#1f2637)",
            borderRadius: 12,
            padding: 16,
            maxWidth: 680,
            margin: "0 auto",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Solicitar saque</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <InfoBox label="Disponível" value={fmtBRL(saldo.saldo_disponivel)} />
            <InfoBox label="Bloqueado" value={fmtBRL(saldo.saldo_bloqueado)} />
            <InfoBox
              label="Total"
              value={fmtBRL((saldo.saldo_disponivel || 0) + (saldo.saldo_bloqueado || 0))}
            />
          </div>

          {!!msg && (
            <div
              style={{
                background: "#0f2a1d",
                border: "1px solid #166534",
                color: "#bbf7d0",
                borderRadius: 8,
                padding: "8px 10px",
                marginBottom: 10,
              }}
            >
              {msg}
            </div>
          )}

          {!!err && (
            <div
              style={{
                background: "#2a0f10",
                border: "1px solid #7f1d1d",
                color: "#fecaca",
                borderRadius: 8,
                padding: "8px 10px",
                marginBottom: 10,
              }}
            >
              {err}
            </div>
          )}

          <form onSubmit={sacar} style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <label style={{ fontSize: 13, opacity: 0.85 }}>Valor (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Ex: 20"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              style={inputStyle}
            />

            <label style={{ fontSize: 13, opacity: 0.85 }}>Chave PIX</label>
            <input
              type="text"
              placeholder="e-mail, telefone +55..., CPF, CNPJ ou UUID"
              value={pix}
              onChange={(e) => setPix(e.target.value)}
              style={inputStyle}
            />

            <button className="btn" disabled={loading}>
              {loading ? "Enviando..." : "Solicitar saque"}
            </button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

/* ---------- componentes/estilos auxiliares ---------- */
function InfoBox({ label, value }) {
  return (
    <div
      style={{
        background: "#0c1220",
        border: "1px solid #253047",
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const inputStyle = {
  background: "#0c1220",
  border: "1px solid #253047",
  color: "#eaecef",
  borderRadius: 8,
  padding: "10px 12px",
};
