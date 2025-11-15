// site/src/pages/site/Affiliates.jsx
import { useEffect, useState } from 'react';
import { referralsApi } from '../../lib/api';

export default function Affiliates() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const { data } = await referralsApi.me();
      setData(data);
    } catch (e) {
      setErr(e?.response?.data?.erro || 'Falha ao carregar.');
    } finally {
      setLoading(false);
    }
  }

  async function claim() {
    setClaiming(true);
    setErr('');
    try {
      await referralsApi.claimWeekly();
      await load();
      alert('Recompensa resgatada com sucesso!');
    } catch (e) {
      setErr(e?.response?.data?.erro || 'Não foi possível resgatar.');
    } finally {
      setClaiming(false);
    }
  }

  useEffect(() => { load(); }, []);

  const pts = (n)=> Number(n||0).toLocaleString('pt-BR');

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <h1>Indique & Ganhe</h1>
        <p>Ganhe pontos indicando amigos. No primeiro depósito do indicado (mínimo R$ 50,00) você recebe pontos extras.</p>

        {err && <div style={s.error}>{err}</div>}
        {loading ? 'Carregando…' : data && (
          <>
            <section style={s.card}>
              <div style={s.row}>
                <div>
                  <div style={s.title}>Pontos na semana</div>
                  <div style={s.big}>{pts(data.week_points)}</div>
                  <div style={s.muted}>Meta: {pts(data?.rules?.threshold_points || 1000)}</div>
                </div>
                <div>
                  <button
                    style={s.btn}
                    disabled={claiming}
                    onClick={claim}
                  >
                    {claiming ? 'Resgatando…' : 'Resgatar recompensa'}
                  </button>
                </div>
              </div>
            </section>

            <section style={s.card}>
              <div style={s.title}>Seu link de convite</div>
              <div style={s.row}>
                <input style={s.input} readOnly value={data.share_link || ''} />
                <button style={s.btnLight}
                  onClick={() => navigator.clipboard.writeText(data.share_link || '')}
                >
                  Copiar
                </button>
              </div>
              <div style={s.muted}>
                Código: <b>{data.referral_code}</b>
              </div>
            </section>

            <section style={s.card}>
              <div style={s.title}>Seus indicados</div>
              {(!data.referrals || data.referrals.length === 0) ? (
                <div className="mt-2">Você ainda não tem indicados.</div>
              ) : (
                <div style={{overflowX:'auto'}}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nome</th>
                        <th>Login</th>
                        <th>Entrou em</th>
                        <th>1º Depósito</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.referrals.map((r, i)=>(
                        <tr key={r.id || i}>
                          <td>{i+1}</td>
                          <td>{r.nome || '-'}</td>
                          <td>{r.login || '-'}</td>
                          <td>{r.joined_at ? new Date(r.joined_at).toLocaleString() : '-'}</td>
                          <td>{r.first_deposit_at ? new Date(r.first_deposit_at).toLocaleString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page:{ background:'#0c0f14', minHeight:'100vh', color:'#eaecef' },
  inner:{ maxWidth:900, margin:'0 auto', padding:'24px 16px', display:'grid', gap:16 },
  card:{ background:'#0e1422', border:'1px solid #1f2533', borderRadius:12, padding:16 },
  row:{ display:'flex', gap:12, alignItems:'center', justifyContent:'space-between', flexWrap:'wrap' },
  title:{ fontSize:14, opacity:.85, marginBottom:6, fontWeight:600 },
  big:{ fontSize:30, fontWeight:800 },
  muted:{ fontSize:12, opacity:.7, marginTop:4 },
  input:{ flex:'1 1 520px', minWidth:260, background:'#0c1220', border:'1px solid #253047', color:'#eaecef', borderRadius:8, padding:'10px 12px' },
  btn:{ background:'#10b981', color:'#0b0f14', border:0, borderRadius:8, padding:'10px 14px', fontWeight:700, cursor:'pointer' },
  btnLight:{ background:'#1f2937', color:'#eaecef', border:'1px solid #374151', borderRadius:8, padding:'10px 14px', cursor:'pointer' },
  table:{
    width:'100%', borderCollapse:'separate', borderSpacing:0, fontSize:14
  },
  error:{ background:'#2a0f10', border:'1px solid #7f1d1d', color:'#fecaca', borderRadius:8, padding:'8px 10px', marginBottom:10 },
};
