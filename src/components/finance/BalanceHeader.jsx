// site/src/components/finance/BalanceHeader.jsx
import { useEffect, useState } from "react";
import { financeiroSiteApi } from "../../lib/api";

export default function BalanceHeader() {
  const [loading, setLoading] = useState(true);
  const [saldo, setSaldo] = useState({
    saldo_disponivel: 0,
    saldo_bloqueado: 0,
  });

  async function load() {
    setLoading(true);
    try {
      const { data } = await financeiroSiteApi.getBalance(); // lê /api/saldo (com fallback)
      setSaldo({
        saldo_disponivel: Number(data?.saldo_disponivel || 0),
        saldo_bloqueado: Number(data?.saldo_bloqueado || 0),
      });
    } catch {
      // opcional: exibir um toast/erro
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // quando voltar para a aba, recarrega o saldo
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const total = saldo.saldo_disponivel + saldo.saldo_bloqueado;

  return (
    <div
      style={{
        background: "var(--panel,#101623)",
        border: "1px solid var(--line,#1f2637)",
        borderRadius: 12,
        padding: 16,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        marginBottom: 16,
      }}
    >
      <Block
        title="Saldo disponível"
        value={loading ? null : saldo.saldo_disponivel}
      />
      <Block
        title="Bloqueado"
        value={loading ? null : saldo.saldo_bloqueado}
      />
      <Block title="Total" value={loading ? null : total} />
    </div>
  );
}

function Block({ title, value }) {
  const fmt =
    value == null
      ? "—"
      : `R$ ${Number(value).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  return (
    <div>
      <div style={{ color: "var(--muted,#aab3c5)", fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>{fmt}</div>
    </div>
  );
}
