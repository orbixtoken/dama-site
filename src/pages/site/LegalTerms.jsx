// src/pages/site/LegalTerms.jsx
export default function LegalTerms() {
  return (
    <div style={s.page}>
      <div style={s.inner}>
        <h1>Termos de Uso</h1>
        <p>Bem-vindo(a) à Dama Bet. Ao utilizar nossos serviços, você concorda com estes termos…</p>
        <ul>
          <li>Idade mínima e responsabilidade do usuário;</li>
          <li>Regras de bônus e requisitos de aposta;</li>
          <li>Política contra fraude e uso indevido;</li>
          <li>Limites, autoexclusão e jogo responsável.</li>
        </ul>
      </div>
    </div>
  );
}
const s={page:{background:'#0c0f14',minHeight:'100vh',color:'#eaecef'},inner:{maxWidth:900,margin:'0 auto',padding:'24px 16px'}};
