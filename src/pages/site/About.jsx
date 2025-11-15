// src/pages/site/About.jsx
export default function About() {
  return (
    <div style={s.page}>
      <div style={s.inner}>
        <h1>Sobre a Dama Bet</h1>
        <p>Elegância no jogo aplicada à tecnologia de entretenimento…</p>
      </div>
    </div>
  );
}
const s={page:{background:'#0c0f14',minHeight:'100vh',color:'#eaecef'},inner:{maxWidth:900,margin:'0 auto',padding:'24px 16px'}};
