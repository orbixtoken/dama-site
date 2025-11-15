// src/pages/site/Contact.jsx
export default function Contact() {
  return (
    <div style={s.page}>
      <div style={s.inner}>
        <h1>Contato</h1>
        <p>Quer falar com a gente? Envie um e-mail para damabet6@gmail.com e retornamos o quanto antes.</p>
      </div>
    </div>
  );
}
const s={page:{background:'#0c0f14',minHeight:'100vh',color:'#eaecef'},inner:{maxWidth:900,margin:'0 auto',padding:'24px 16px'}};
