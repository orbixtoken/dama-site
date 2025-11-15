import { useState } from "react";
import { financeApi } from "../../lib/api";

function isPixValida(chave) {
  const c = String(chave || "").trim();
  if (!c) return false;

  // aceita: email, telefone BR (+55 ou só dígitos), CPF, CNPJ, EVP (aleatória)
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(c);
  const digits = c.replace(/\D/g, "");
  const tel = /^\+?55\d{10,11}$/.test(c.startsWith("+") ? c : `+55${digits}`); // tolerante
  const cpf = /^\d{11}$/.test(digits);
  const cnpj = /^\d{14}$/.test(digits);
  const evp = /^[a-f0-9-]{32,36}$/i.test(c);
  return email || tel || cpf || cnpj || evp;
}

export default function WithdrawForm({ saldoDisponivel = 0, onSuccess }) {
  const [valor, setValor] = useState("");
  const [pixChave, setPixChave] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    setOkMsg("");

    const v = Number(String(valor).replace(",", "."));
    const pix = String(pixChave || "").trim();

    if (!Number.isFinite(v) || v <= 0) {
      setErro("Informe um valor válido.");
      return;
    }
    if (v > Number(saldoDisponivel || 0)) {
      setErro("Saldo insuficiente.");
      return;
    }
    if (!isPixValida(pix)) {
      setErro("Chave PIX inválida.");
      return;
    }

    try {
      setLoading(true);
      // 🔴 IMPORTANTE: o backend espera exatamente { valor, pix_chave }
      await financeApi.createWithdraw({ valor: v, pix_chave: pix });
      setOkMsg("Solicitação de saque enviada! O valor foi bloqueado até aprovação.");
      setValor("");
      setPixChave("");
      onSuccess?.();
    } catch (err) {
      setErro(err?.response?.data?.erro || err?.message || "Falha ao solicitar saque.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={styles.form}>
      {erro && <div style={styles.error}>{erro}</div>}
      {okMsg && <div style={styles.ok}>{okMsg}</div>}

      <div style={styles.row}>
        <label style={styles.label}>Valor</label>
        <input
          style={styles.input}
          inputMode="decimal"
          placeholder="Ex: 50,00"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <div style={styles.hint}>Saldo disponível: {Number(saldoDisponivel).toFixed(2)}</div>
      </div>

      <div style={styles.row}>
        <label style={styles.label}>Chave PIX</label>
        <input
          style={styles.input}
          placeholder="Email, celular, CPF/CNPJ ou chave aleatória"
          value={pixChave}
          onChange={(e) => setPixChave(e.target.value)}
        />
        <div style={styles.hint}>Essa chave será exibida para o admin aprovar/pagar.</div>
      </div>

      <button type="submit" disabled={loading} style={styles.btn}>
        {loading ? "Enviando..." : "Solicitar saque"}
      </button>
    </form>
  );
}

const styles = {
  form: { display: "grid", gap: 12 },
  row: { display: "grid", gap: 6 },
  label: { fontSize: 14, opacity: 0.9 },
  input: {
    padding: "10px 12px",
    background: "#0b1220",
    border: "1px solid #202b44",
    borderRadius: 10,
    color: "#e6ebff",
    outline: "none",
  },
  hint: { fontSize: 12, color: "#9fb3ff" },
  btn: {
    background: "linear-gradient(90deg, #06b6d4, #3b82f6)",
    border: "none",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },
  error: {
    background: "#2a0f10",
    border: "1px solid #7f1d1d",
    color: "#fecaca",
    borderRadius: 8,
    padding: "8px 10px",
  },
  ok: {
    background: "#0f2a1a",
    border: "1px solid #14532d",
    color: "#bbf7d0",
    borderRadius: 8,
    padding: "8px 10px",
  },
};
