import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import BalanceHeader from "../../components/finance/BalanceHeader";
import MovementsList from "../../components/finance/MovementsList";
import { Link } from "react-router-dom";


export default function FinanceHome() {
  return (
    <>
      <SiteHeader />

      <section className="wrap" style={{ padding: "16px 0 28px" }}>
        <BalanceHeader />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={card}>
            <h3 style={title}>Depósito</h3>
            <p style={muted}>Adicione saldo à sua conta via PIX.</p>
            <Link
              className="btn"
              to="/financeiro/depositar"
              aria-label="Ir para página de depósito via PIX"
            >
              Depositar
            </Link>
          </div>

          <div style={card}>
            <h3 style={title}>Saque</h3>
            <p style={muted}>Solicite retirada para a sua chave PIX.</p>
            <Link
              className="btn ghost"
              to="/financeiro/sacar"
              aria-label="Ir para página de saque via PIX"
            >
              Sacar
            </Link>
          </div>

          <div style={card}>
            <h3 style={title}>Movimentações</h3>
            <p style={muted}>Veja seu histórico financeiro detalhado.</p>
            <Link
              className="btn ghost"
              to="/financeiro/movimentos"
              aria-label="Ver histórico de movimentações"
            >
              Ver histórico
            </Link>
          </div>
        </div>

        <h3 style={{ margin: "8px 0 10px", fontSize: 16 }}>
          Últimas movimentações
        </h3>
        <MovementsList limit={15} />
      </section>

      <SiteFooter />
    </>
  );
}

const card = {
  background: "var(--panel, #101623)",
  border: "1px solid var(--line, #1f2637)",
  borderRadius: 12,
  padding: 16,
};
const title = { margin: "0 0 6px", fontSize: 16 };
const muted = { margin: "0 0 10px", color: "var(--muted,#aab3c5)" };
