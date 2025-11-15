// src/components/SiteFooter.jsx
export default function SiteFooter() {
  return (
    <footer style={s.wrap}>
      <div style={s.inner}>
        <div style={{opacity:.85}}>© {new Date().getFullYear()} Dama Bet — todos os direitos reservados.</div>
        <nav style={s.nav}>
          <a href="/termos" style={s.a}>Termos</a>
          <a href="/privacidade" style={s.a}>Privacidade</a>
          <a href="/contato" style={s.a}>Contato</a>
        </nav>
      </div>
    </footer>
  );
}

const s = {
  wrap: { borderTop: "1px solid #1f2533", background:"#0c0f14", marginTop: 40 },
  inner: { maxWidth: 1200, margin: "0 auto", padding: "16px", display:"flex", alignItems:"center", justifyContent:"space-between", color:"#cbd5e1" },
  nav: { display:"flex", gap:12 },
  a: { color:"#cbd5e1", textDecoration:"none" }
};
