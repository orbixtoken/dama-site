import { useEffect, useState } from "react";
import { financeApi } from "../../lib/api";

export default function StatementTable() {
  const [rows, setRows] = useState([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        setErro("");
        setLoading(true);
        const { data } = await financeApi.statement({ page, pageSize });
        setRows(data?.items || []);
        setTotal(Number(data?.total || 0));
      } catch (e) {
        setErro(e?.response?.data?.erro || "Falha ao carregar extrato.");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, pageSize]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={s.box}>
      {erro && <div style={s.error}>{erro}</div>}
      <div style={{ overflowX: "auto" }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Valor (R$)</th>
              <th>Descrição</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ opacity: .8 }}>Carregando…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} style={{ opacity: .8 }}>Sem movimentações.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.criado_em)}</td>
                  <td>{r.tipo}</td>
                  <td>{r.status}</td>
                  <td style={{ textAlign: "right" }}>{Number(r.valor || 0).toFixed(2)}</td>
                  <td>{r.descricao || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={s.pagination}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={s.pbtn}>◀</button>
        <span style={{ opacity: .9 }}>Página {page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} style={s.pbtn}>▶</button>
      </div>
    </div>
  );
}

function formatDate(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleString();
  } catch {
    return d || "-";
  }
}

const s = {
  box: { background: "#0b1220", border: "1px solid #1b2231", borderRadius: 10, padding: 12 },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    color: "#eaecef",
  },
  error: { background: "#2a0f10", border: "1px solid #7f1d1d", color: "#fecaca", borderRadius: 8, padding: "8px 10px", marginBottom: 10 },
  pagination: { display: "flex", gap: 10, alignItems: "center", justifyContent: "center", marginTop: 12 },
  pbtn: { background: "#111827", color: "#cbd5e1", border: "1px solid #253047", borderRadius: 8, padding: "6px 10px", cursor: "pointer" },
};
