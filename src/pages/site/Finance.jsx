// src/pages/site/Finance.jsx
import { useEffect, useState, useCallback } from "react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { financeApi } from "../../lib/api";
import BalanceCard from "../../components/finance/BalanceCard";
import DepositForm from "../../components/finance/DepositForm";
import WithdrawForm from "../../components/finance/WithdrawForm";
import StatementTable from "../../components/finance/StatementTable";

const palette = {
  bg: "#0c111b",
  card: "#101827",
  cardBorder: "#22304b",
  text: "#e5e7eb",
  textMut: "#a7b0c0",
  tab: "#121a2a",
  tabActive: "#1c2b4a",
  accent: "#6d28d9",
  accent2: "#2563eb",
  dangerBg: "#2a0f10",
  dangerBorder: "#7f1d1d",
  dangerText: "#fecaca",
};

export default function Finance() {
  const [tab, setTab] = useState("saldo");
  const [saldo, setSaldo] = useState({ saldo_disponivel: 0, saldo_bloqueado: 0 });
  const [movimentos, setMovimentos] = useState([]); // 👈 novo
  const [loadingSaldo, setLoadingSaldo] = useState(false);
  const [erro, setErro] = useState("");

  const loadResumo = useCallback(async () => {
    try {
      setErro("");
      setLoadingSaldo(true);
      const { data } = await financeApi.getResumo(); // 👈 novo endpoint
      setSaldo({
        saldo_disponivel: Number(data?.saldo_disponivel || 0),
        saldo_bloqueado: Number(data?.saldo_bloqueado || 0),
      });
      setMovimentos(Array.isArray(data?.movimentos) ? data.movimentos : []);
    } catch (e) {
      // Falha leve (ex.: primeira vez, sem movimentos)
      console.error("Erro ao carregar resumo financeiro:", e);
      setErro(e?.response?.data?.erro || "Falha ao carregar dados financeiros.");
      setMovimentos([]);
    } finally {
      setLoadingSaldo(false);
    }
  }, []);

  useEffect(() => {
    loadResumo();
  }, [loadResumo]);

  const afterMoneyChange = () => {
    setTab("saldo");
    loadResumo();
  };

  const goSaldo = () => {
    setTab("saldo");
    loadResumo();
  };

  return (
    <>
      <SiteHeader />
      <div style={styles.page}>
        <div style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerGlow} />
            <h2 style={{ margin: 0, position: "relative", zIndex: 1 }}>
              Financeiro
            </h2>
            <p style={{ margin: 0, opacity: 0.75, position: "relative", zIndex: 1 }}>
              Deposite, saque e acompanhe seus movimentos.
            </p>
          </div>

          {/* Tabs */}
          <div style={styles.tabs}>
            <TabButton active={tab === "saldo"} onClick={goSaldo}>Saldo</TabButton>
            <TabButton active={tab === "deposito"} onClick={() => setTab("deposito")}>Depositar</TabButton>
            <TabButton active={tab === "saque"} onClick={() => setTab("saque")}>Sacar</TabButton>
            <TabButton active={tab === "extrato"} onClick={() => setTab("extrato")}>Extrato</TabButton>
          </div>

          {erro && <div style={styles.errorBox}>{erro}</div>}

          {/* Conteúdo */}
          <div style={styles.cardsGrid}>
            {tab === "saldo" && (
              <div style={styles.card}>
                <BalanceCard
                  saldoDisponivel={saldo.saldo_disponivel}
                  saldoBloqueado={saldo.saldo_bloqueado}
                  loading={loadingSaldo}
                  onRefresh={loadResumo}
                />
              </div>
            )}

            {tab === "deposito" && (
              <div style={styles.card}>
                <CardTitle>Depositar</CardTitle>
                <DepositForm onSuccess={afterMoneyChange} />
              </div>
            )}

            {tab === "saque" && (
              <div style={styles.card}>
                <CardTitle>Sacar</CardTitle>
                <WithdrawForm
                  key={String(saldo.saldo_disponivel)}
                  saldoDisponivel={saldo.saldo_disponivel}
                  onSuccess={afterMoneyChange}
                />
              </div>
            )}

            {tab === "extrato" && (
              <div style={styles.cardFull}>
                <CardTitle>Extrato</CardTitle>
                {movimentos.length === 0 ? (
                  <div style={{ opacity: 0.7, fontSize: 14 }}>
                    Nenhum movimento encontrado.
                  </div>
                ) : (
                  <StatementTable movimentos={movimentos} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}

/* ---------- Subcomponentes ---------- */
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.tabBtn,
        background: active ? palette.tabActive : palette.tab,
        borderColor: active ? palette.accent2 : palette.cardBorder,
        color: active ? "#fff" : palette.text,
      }}
    >
      {children}
    </button>
  );
}

function CardTitle({ children }) {
  return (
    <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: `radial-gradient(600px circle at 0% 0%, ${palette.accent}55, transparent 50%)`,
          boxShadow: `0 0 0 2px ${palette.accent}33`,
        }}
      />
      <h3 style={{ margin: 0 }}>{children}</h3>
    </div>
  );
}

/* ---------- Estilos ---------- */
const styles = {
  page: {
    minHeight: "65vh",
    background: palette.bg,
    padding: "24px 16px",
    display: "grid",
    placeItems: "start center",
  },
  container: {
    width: "100%",
    maxWidth: 1000,
    color: palette.text,
  },
  header: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    padding: "22px 18px",
    marginBottom: 14,
    border: `1px solid ${palette.cardBorder}`,
    background:
      "linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(109,40,217,0.10) 60%, rgba(16,24,39,0.8) 100%)",
  },
  headerGlow: {
    position: "absolute",
    inset: -2,
    background:
      "radial-gradient(800px circle at 10% -20%, rgba(37,99,235,0.25), transparent 40%), radial-gradient(700px circle at 110% 20%, rgba(109,40,217,0.25), transparent 45%)",
    pointerEvents: "none",
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  tabBtn: {
    border: `1px solid ${palette.cardBorder}`,
    borderRadius: 10,
    padding: "9px 14px",
    cursor: "pointer",
    transition: "transform .1s ease, border-color .2s ease, background .2s ease",
  },
  errorBox: {
    background: palette.dangerBg,
    border: `1px solid ${palette.dangerBorder}`,
    color: palette.dangerText,
    borderRadius: 10,
    padding: "10px 12px",
    marginBottom: 12,
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
  },
  card: {
    background: palette.card,
    border: `1px solid ${palette.cardBorder}`,
    borderRadius: 14,
    padding: 16,
  },
  cardFull: {
    background: palette.card,
    border: `1px solid ${palette.cardBorder}`,
    borderRadius: 14,
    padding: 16,
    gridColumn: "1 / -1",
  },
};
