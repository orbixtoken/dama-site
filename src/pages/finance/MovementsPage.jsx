import { useEffect, useState } from "react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import BalanceHeader from "../../components/finance/BalanceHeader";
import { financeiroSiteApi } from "../../lib/api";

const PAGE_SIZE = 20;

// parser ultra-tolerante ao formato
function coerceListResponse(data) {
  if (!data) return { list: [], total: 0, page: 1, pageSize: PAGE_SIZE };

  // casos comuns
  if (Array.isArray(data.items)) {
    return {
      list: data.items,
      total: Number(data.total ?? data.items.length ?? 0),
      page: Number(data.page ?? 1),
      pageSize: Number(data.pageSize ?? PAGE_SIZE),
    };
  }
  if (Array.isArray(data.rows)) {
    return {
      list: data.rows,
      total: Number(data.total ?? data.rows.length ?? 0),
      page: Number(data.page ?? 1),
      pageSize: Number(data.pageSize ?? PAGE_SIZE),
    };
  }
  if (Array.isArray(data)) {
    return { list: data, total: data.length, page: 1, pageSize: PAGE_SIZE };
  }

  // alguns backends envolvem em {data:{items...}}
  if (data.data) return coerceListResponse(data.data);

  return { list: [], total: 0, page: 1, pageSize: PAGE_SIZE };
}

export default function MovementsPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load(p = 1) {
    setLoading(true);
    setErr("");
    try {
      const resp = await financeiroSiteApi.getTransactions({
        page: p,
        pageSize: PAGE_SIZE,
      });

      // log rápido pra depurar, se necessário
      console.info("[Movements] raw response:", resp?.data);

      const { list, total, page: serverPage } = coerceListResponse(resp?.data);
      setItems(list);
      setTotal(total);
      setPage(serverPage || p);
    } catch (e) {
      console.error("[Movements] load error:", e);
      setErr(e?.response?.data?.erro || "Falha ao carregar movimentos.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, []);

  const fmtMoney = (v) =>
    `R$ ${Number(v || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const fmtDateTime = (s) => {
    const d = s ? new Date(s) : null;
    return d && !isNaN(d) ? d.toLocaleString() : "-";
  };

  const lastPage = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));

  return (
    <>
      <SiteHeader />

      <section className="wrap" style={{ padding: "16px 0 28px" }}>
        <BalanceHeader />

        <div
          style={{
            background: "var(--panel,#101623)",
            border: "1px solid var(--line,#1f2637)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Histórico de movimentações</h2>

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

          {loading ? (
            <div style={{ opacity: 0.7 }}>Carregando…</div>
          ) : items.length === 0 ? (
            <div
              style={{
                border: "1px solid #253047",
                background: "#0c1220",
                borderRadius: 10,
                padding: 12,
                color: "var(--muted,#aab3c5)",
              }}
            >
              Nenhum movimento encontrado.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ width: "100%" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1f2637" }}>
                      <th className="px-3 py-2 text-left">Quando</th>
                      <th className="px-3 py-2 text-left">Tipo</th>
                      <th className="px-3 py-2 text-left">Descrição</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                      <th className="px-3 py-2 text-right">Antes</th>
                      <th className="px-3 py-2 text-right">Depois</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((m) => (
                      <tr key={m.id} style={{ borderTop: "1px solid #1f2637" }}>
                        <td className="px-3 py-2">
                          {fmtDateTime(m.created_at || m.criado_em)}
                        </td>
                        <td className="px-3 py-2">{m.tipo}</td>
                        <td className="px-3 py-2">{m.descricao || "-"}</td>
                        <td className="px-3 py-2 text-right">{fmtMoney(m.valor)}</td>
                        <td className="px-3 py-2 text-right">{fmtMoney(m.saldo_antes)}</td>
                        <td className="px-3 py-2 text-right">{fmtMoney(m.saldo_depois)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginTop: 12,
                }}
              >
                <button
                  className="btn ghost"
                  disabled={page <= 1}
                  onClick={() => load(page - 1)}
                >
                  ◀ Anterior
                </button>
                <div style={{ alignSelf: "center", opacity: 0.8 }}>
                  Página {page} de {lastPage}
                </div>
                <button
                  className="btn"
                  disabled={page >= lastPage}
                  onClick={() => load(page + 1)}
                >
                  Próxima ▶
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
