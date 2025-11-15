export default function BalanceCard({ saldoDisponivel = 0, saldoBloqueado = 0, loading, onRefresh }) {
  return (
    <div style={s.row}>
      <div style={s.box}>
        <div style={s.label}>Saldo disponível</div>
        <div style={s.value}>
          {loading ? "Carregando..." : `R$ ${saldoDisponivel.toFixed(2)}`}
        </div>
      </div>
      <div style={s.box}>
        <div style={s.label}>Saldo bloqueado</div>
        <div style={s.valueMuted}>
          {loading ? "Carregando..." : `R$ ${saldoBloqueado.toFixed(2)}`}
        </div>
      </div>
      <div style={s.actions}>
        <button onClick={onRefresh} style={s.btn} disabled={loading}>
          {loading ? "Atualizando..." : "Recarregar"}
        </button>
      </div>
    </div>
  );
}

const s = {
  row: { display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "center" },
  box: { background: "#0b1220", border: "1px solid #1b2231", borderRadius: 10, padding: 12 },
  label: { fontSize: 12, color: "#9aa3b4", marginBottom: 6 },
  value: { fontSize: 22, fontWeight: 800, color: "#a7f3d0" },
  valueMuted: { fontSize: 22, fontWeight: 800, color: "#cbd5e1", opacity: 0.9 },
  actions: { display: "flex", justifyContent: "flex-end" },
  btn: { background: "#2563eb", color: "#fff", border: 0, borderRadius: 8, padding: "10px 14px", cursor: "pointer" },
};
