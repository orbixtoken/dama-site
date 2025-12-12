// site/src/pages/finance/QuickPixDeposits.jsx
import { useState } from "react";
import { financeiroSiteApi } from "../../lib/api";

/**
 * Botões de atalho para depósitos R$10/R$20/R$30/R$50
 * 1) Cria o depósito no backend (aparece no painel).
 * 2) Entrega BR Code real e chave PIX da empresa para o cliente pagar.
 * 3) Devolve um "ticket" pelo onTicket(t) com codigo_ref e demais infos.
 */
export default function QuickPixDeposits({ onTicket }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");

  // Chave PIX da empresa para valor livre e para exibir no resumo
  const PIX_KEY_EMPRESA = "**********";

  // BR Codes (PIX Copia e Cola) fixos — fornecidos nas imagens
  const FIXED = [
    {
      label: "R$ 10",
      amount: 10,
      brcode:
        "PIX AQUI",
    },
    {
      label: "R$ 20",
      amount: 20,
      brcode:
        "PIX AQUI",
    },
    {
      label: "R$ 30",
      amount: 30,
      brcode:
        "PIX AQUI",
    },
    {
      label: "R$ 50",
      amount: 50,
      brcode:
        "PIX AQUI",
    },
  ];

  const copy = async (txt) => {
    try {
      await navigator.clipboard.writeText(String(txt || ""));
      setCopied("Copiado!");
      setTimeout(() => setCopied(""), 1200);
    } catch {
      window.prompt("Copie manualmente:", String(txt || ""));
    }
  };

  // Cria o depósito no backend e devolve ticket unificado
  const criarDeposito = async (valor, referenciaHint) => {
    // chama o backend para registrar (para aparecer no painel)
    const res = await financeiroSiteApi.createDeposit({
      valor,
      metodo: "PIX",
      referencia: referenciaHint || `PIX-${valor.toFixed(2)}`,
    });
    const t = res?.data || {};
    // fallback de referência caso o backend não retorne
    const codigo_ref =
      t.codigo_ref ||
      t.ref ||
      `REF-${Date.now().toString(36).slice(-6).toUpperCase()}`;

    return { ...t, codigo_ref };
  };

  const onAtalho = async (it) => {
    if (loading) return;
    setLoading(true);
    try {
      // 1) registra no backend
      const ticket = await criarDeposito(it.amount, `Atalho R$ ${it.amount}`);

      // 2) injeta BR CODE + CHAVE reais para o usuário pagar
      const enriched = {
        ...ticket,
        brcode: it.brcode,
        pix_chave: PIX_KEY_EMPRESA,
        mensagem:
          ticket.mensagem ||
          "Pix Copia e Cola gerado. Cole o código no seu banco. Se possível, inclua o código de referência na mensagem do PIX.",
        deposito: { valor: it.amount },
      };

      if (typeof onTicket === "function") onTicket(enriched);
      // por conveniência: copiar o brcode já de cara
      await copy(it.brcode);
    } catch (e) {
      const msg = e?.response?.data?.erro || e?.message || "Falha ao criar depósito.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const onCopyKeyLivre = async () => {
    await copy(PIX_KEY_EMPRESA);
    if (typeof onTicket === "function") {
      onTicket({
        codigo_ref: `REF-${Date.now().toString(36).slice(-6).toUpperCase()}`,
        pix_chave: PIX_KEY_EMPRESA,
        brcode: null,
        mensagem:
          "Use a chave PIX da empresa (valor livre). Escreva o seu código de referência na mensagem do PIX para agilizar a conferência.",
      });
    }
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {/* Botões de valores fixos */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {FIXED.map((it) => (
          <button
            key={it.amount}
            type="button"
            onClick={() => onAtalho(it)}
            disabled={loading}
            style={chip}
            title="Gerar depósito e copiar Pix Copia e Cola"
          >
            {loading ? "Gerando..." : it.label}
          </button>
        ))}
      </div>

      {/* PIX livre (chave e-mail) */}
      <div
        style={{
          marginTop: 8,
          border: "1px dashed #2a3650",
          background:
            "linear-gradient(180deg, rgba(44,56,92,.25), rgba(16,24,40,.5))",
          borderRadius: 10,
          padding: 12,
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>
          PIX livre (qualquer valor)
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <code style={code}> {PIX_KEY_EMPRESA} </code>
          <button type="button" onClick={onCopyKeyLivre} className="btn ghost">
            Copiar chave
          </button>
        </div>
        <ul style={{ margin: "8px 0 0 16px", color: "var(--muted,#aab3c5)" }}>
          <li>Abra seu banco e escolha PIX &rarr; “Pagar com chave”.</li>
          <li>Use a chave acima e informe o valor que deseja depositar.</li>
          <li>
            <strong>Dica:</strong> escreva o <strong>código de referência</strong> na
            mensagem do PIX (ex.: <code>REF-AB12CD</code>).
          </li>
        </ul>
      </div>

      {!!copied && <div style={copiedBox}>{copied}</div>}
    </div>
  );
}

const chip = {
  border: "1px solid rgba(120,140,255,.25)",
  background:
    "linear-gradient(180deg, rgba(46,64,120,.55), rgba(20,28,48,.85))",
  color: "#eaf2ff",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 13,
  cursor: "pointer",
  boxShadow: "0 0 10px rgba(110,90,255,.15) inset",
};

const code = {
  background: "#0c1220",
  border: "1px solid #253047",
  color: "#bfe3ff",
  padding: "6px 8px",
  borderRadius: 6,
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
  fontSize: 13,
};

const copiedBox = {
  marginTop: 8,
  background: "rgba(16,185,129,.12)",
  border: "1px solid rgba(16,185,129,.45)",
  color: "#d1fae5",
  borderRadius: 8,
  padding: "6px 8px",
};
