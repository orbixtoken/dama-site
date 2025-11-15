import { useEffect, useState } from "react";
import { financeiroSiteApi } from "../../lib/api";

export default function MovementsList({ limit = 50 }) {
  const [rows, setRows] = useState([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErro("");
      try {
        const r = await financeiroSiteApi.movimentos({ limit });
        if (!alive) return;
        const data = r?.data?.data || r?.data || [];
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setErro("Falha ao carregar movimentos.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [limit]);

  if (loading) {
    return <div style={boxStyle}>Carregando movimentos…</div>;
  }
  if (erro) {
    return <div style={{ ...boxStyle, color: "#fca5a5" }}>{erro}</div>;
  }
  if (rows.length === 0) {
    return <div style={boxStyle}>Nenhum movimento encontrado.</div>;
  }

  return (
    <div style={boxStyle}>
      <div style={headerRow}>
        <div>Data</div>
        <div>Tipo</div>
        <div>Valor</div>
        <div>Descrição</div>
        <div>Saldo</div>
      </div>
      {rows.map((m, i) => (
        <div key={i} style={itemRow}>
          <div>{formatDate(m.criado_em)}</div>
          <div>{m.tipo}</div>
          <div>R$ {Number(m.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          <div style={{ opacity: .9 }}>{m.descricao || "-"}</div>
          <div style={{ opacity: .8 }}>
            {m.saldo_antes != null && m.saldo_depois != null
              ? `R$ ${Number(m.saldo_antes).toLocaleString("pt-BR")} → R$ ${Number(m.saldo_depois).toLocaleString("pt-BR")}`
              : "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

const boxStyle = {
  background: "var(--panel, #101623)",
  border: "1px solid var(--line, #1f2637)",
  borderRadius: 12,
  padding: 12,
};

const headerRow = {
  display: "grid",
  gridTemplateColumns: "140px 110px 140px 1fr 210px",
  gap: 10,
  padding: "8px 6px",
  borderBottom: "1px solid #1f2637",
  fontSize: 13,
  opacity: 0.8,
};

const itemRow = {
  display: "grid",
  gridTemplateColumns: "140px 110px 140px 1fr 210px",
  gap: 10,
  padding: "10px 6px",
  borderBottom: "1px solid #161d2b",
  fontSize: 14,
};

function formatDate(d) {
  try {
    const dt = new Date(d);
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(dt);
  } catch {
    return d || "-";
  }
}
