// src/pages/site/DepositForm.jsx
import { useState } from "react";
import { financeApi } from "../../lib/api";

/** Converte string "100,50" | "100.50" → número 100.5 com segurança */
function parseMoney(value) {
  if (typeof value !== "string") return Number(value) || 0;
  const norm = value.replace(/\s/g, "").replace(",", ".");
  const n = Number(norm);
  return Number.isFinite(n) ? n : 0;
}

export default function DepositForm({ onSuccess }) {
  const [valor, setValor] = useState("");
  const [metodo, setMetodo] = useState("PIX");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErro("");
    setOk("");

    const v = parseMoney(valor);
    if (!v || v < 1) {
      setErro("Informe um valor válido (mínimo R$ 1,00).");
      return;
    }

    try {
      setLoading(true);

      // ✅ usa o endpoint padronizado do api.js
      const { data } = await financeApi.createDeposit({
        valor: v,
        metodo, // "PIX" por enquanto; depois podemos suportar outros
      });

      setOk(data?.mensagem || "Depósito iniciado com sucesso.");

      // Se o backend retornar algum dado extra (ex.: QR Code, url), trate aqui:
      // if (data?.qr_code_url) window.open(data.qr_code_url, "_blank", "noopener");

      setValor("");
      onSuccess?.();
    } catch (e2) {
      setErro(e2?.response?.data?.erro || "Falha ao iniciar depósito.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={s.form} aria-busy={loading}>
      <div style={s.row}>
        <div style={s.col}>
          <label style={s.label} htmlFor="dep-valor">Valor (R$)</label>
          <input
            id="dep-valor"
            style={s.input}
            inputMode="decimal"
            type="text"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="100,00"
            required
          />
        </div>

        <div style={s.col}>
          <label style={s.label} htmlFor="dep-metodo">Método</label>
          <select
            id="dep-metodo"
            style={s.input}
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
          >
            <option value="PIX">PIX</option>
            {/* futuros métodos: <option value="CARTAO">Cartão</option> etc. */}
          </select>
        </div>
      </div>

      {erro && <div style={s.error} role="alert">{erro}</div>}
      {ok && <div style={s.ok}>{ok}</div>}

      <button disabled={loading} style={s.btn} type="submit">
        {loading ? "Enviando..." : "Gerar depósito"}
      </button>
    </form>
  );
}

const s = {
  form: { marginTop: 6 },
  row: {
    display: "grid",
    gap: 10,
    gridTemplateColumns: "1fr 1fr",
  },
  col: { display: "flex", flexDirection: "column" },
  label: { fontSize: 12, opacity: 0.85, marginBottom: 6 },
  input: {
    background: "#0b1220",
    color: "#eaecef",
    border: "1px solid #1b2231",
    borderRadius: 8,
    padding: "10px 12px",
  },
  btn: {
    marginTop: 10,
    background: "#10b981",
    color: "#0b0f14",
    border: 0,
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  error: {
    background: "#2a0f10",
    border: "1px solid #7f1d1d",
    color: "#fecaca",
    borderRadius: 8,
    padding: "8px 10px",
    marginTop: 10,
  },
  ok: {
    background: "#112917",
    border: "1px solid #14532d",
    color: "#bbf7d0",
    borderRadius: 8,
    padding: "8px 10px",
    marginTop: 10,
  },
};

/* Responsividade simples (opcional): empilha os campos no mobile */
const media = window.matchMedia?.("(max-width: 640px)");
if (media && media.matches) {
  s.row.gridTemplateColumns = "1fr";
}
