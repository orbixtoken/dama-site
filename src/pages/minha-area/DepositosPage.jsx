// site/src/pages/minha-area/DepositosPage.jsx
import React, { useEffect, useState } from "react";
import { depositsApi } from "@/lib/api";

export default function DepositosPage() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("pendente");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await depositsApi.list({ status, limit: 50 });
      setItems(data?.rows || data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Meus depósitos</h2>
      <div className="flex gap-2 mb-4">
        <select value={status} onChange={(e)=>setStatus(e.target.value)}
          className="rounded-lg bg-black/30 border border-white/10 px-3 py-2">
          <option value="">todos</option>
          <option value="pendente">pendente</option>
          <option value="aprovado">aprovado</option>
          <option value="creditado">creditado</option>
          <option value="recusado">recusado</option>
        </select>
        <button onClick={load} className="rounded-lg bg-white/10 px-3 py-2">Atualizar</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-3 py-2">Criado</th>
              <th className="px-3 py-2">Valor</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ref</th>
              <th className="px-3 py-2">Método</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-3" colSpan={5}>Carregando…</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-3 py-3" colSpan={5}>Nenhum depósito encontrado.</td></tr>
            ) : items.map((d) => (
              <tr key={d.id} className="border-t border-white/10">
                <td className="px-3 py-2">{new Date(d.created_at || d.criado_em).toLocaleString()}</td>
                <td className="px-3 py-2">R$ {Number(d.valor).toFixed(2)}</td>
                <td className="px-3 py-2">{d.status}</td>
                <td className="px-3 py-2"><code>{d.codigo_ref}</code></td>
                <td className="px-3 py-2">{d.metodo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
