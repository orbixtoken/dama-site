// site/src/components/FinanceiroDepositar.jsx
import React, { useState } from "react";
import { financeApi, depositsApi } from "@/lib/api";

export default function FinanceiroDepositar() {
  const [valor, setValor] = useState("100,00");
  const [metodo, setMetodo] = useState("PIX");
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null); // resposta do depósito

  async function onGerar() {
    setLoading(true);
    setTicket(null);
    try {
      const res = await financeApi.deposit({ valor, metodo });
      setTicket(res?.data || null);
    } catch (e) {
      alert(e?.response?.data?.erro || e.message || "Falha ao solicitar depósito.");
    } finally {
      setLoading(false);
    }
  }

  function copiar(txt) {
    navigator.clipboard?.writeText(String(txt));
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="rounded-2xl bg-[#0f1525] p-6 border border-white/5">
        <h3 className="text-lg font-semibold mb-4">Depositar</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-white/70">Valor (R$)</label>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full mt-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none"
              placeholder="100,00"
            />
          </div>
          <div>
            <label className="text-sm text-white/70">Método</label>
            <select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
              className="w-full mt-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none"
            >
              <option value="PIX">PIX</option>
              {/* futuro: CARTAO, TED... */}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={onGerar}
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 font-medium"
            >
              {loading ? "Gerando..." : "Gerar depósito"}
            </button>
          </div>
        </div>
        <p className="text-xs text-white/50 mt-3">
          Após gerar, você verá as instruções PIX e um código de referência para colocar na
          <em> mensagem do PIX</em>.
        </p>
      </div>

      {/* Instruções retornadas pelo backend */}
      {ticket && (
        <div className="rounded-2xl bg-[#0f1525] p-6 border border-white/5">
          <h3 className="text-lg font-semibold mb-4">Instruções do PIX</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-white/70">Valor</div>
              <div className="text-2xl font-bold">
                R$ {Number(ticket?.deposito?.valor ?? 0).toFixed(2)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-white/70">Status</div>
              <div className="text-base">
                <span className="inline-flex items-center gap-2 rounded-full bg-yellow-500/15 text-yellow-300 px-3 py-1 text-sm">
                  {ticket?.deposito?.status || "pendente"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-white/70">Chave PIX</div>
              <div className="flex items-center gap-2">
                <code className="bg-black/30 border border-white/10 rounded-lg px-2 py-1">
                  {ticket?.pix_chave || "—"}
                </code>
                <button
                  onClick={() => copiar(ticket?.pix_chave)}
                  className="text-sm underline underline-offset-2"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-white/70">Código de referência</div>
              <div className="flex items-center gap-2">
                <code className="bg-black/30 border border-white/10 rounded-lg px-2 py-1">
                  {ticket?.codigo_ref || "—"}
                </code>
                <button
                  onClick={() => copiar(ticket?.codigo_ref)}
                  className="text-sm underline underline-offset-2"
                >
                  Copiar
                </button>
              </div>
              <p className="text-xs text-white/50">
                Coloque este código na <strong>mensagem do PIX</strong>. Isso ajuda o admin a
                identificar seu pagamento rapidamente.
              </p>
            </div>
          </div>

          {ticket?.mensagem && (
            <div className="mt-4 text-sm text-white/70">
              {ticket.mensagem}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/minha-area/depositos"
              className="rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-sm"
            >
              Ver meus depósitos
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
