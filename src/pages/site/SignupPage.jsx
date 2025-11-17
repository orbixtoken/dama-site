// site/src/pages/site/SignupPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../lib/api";

export default function SignupPage() {
  const nav = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [okEmail, setOkEmail] = useState(null); // true | false | null
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [justCreated, setJustCreated] = useState(false);

  // NOVO: ver/ocultar senha
  const [showPass, setShowPass] = useState(false);

  const isEmailFormatOk = /\S+@\S+\.\S+/.test(email.trim());

  useEffect(() => {
    setOkEmail(null);
    if (!email || !isEmailFormatOk) return;
    const t = setTimeout(async () => {
      try {
        const r = await authApi.checkEmail(email.trim());
        setOkEmail(!!r?.data?.available);
      } catch {
        setOkEmail(null);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [email, isEmailFormatOk]);

  async function submit(e) {
    e.preventDefault();
    if (loading) return;
    setErr("");
    setLoading(true);
    try {
      await authApi.signup({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
      });
      setNome(""); setEmail(""); setSenha("");
      setJustCreated(true);
      nav("/login", {
        replace: true,
        state: { signupOk: true, signupEmail: email.trim().toLowerCase() },
      });
    } catch (e2) {
      const msg =
        e2?.response?.data?.erro ||
        e2?.response?.data?.message ||
        "Falha ao criar conta.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrap}>
      <form onSubmit={submit} style={card}>
        <h1 style={{ marginTop: 0 }}>Criar conta</h1>
        {err && <div style={error}>{err}</div>}
        {justCreated && <div style={okBox}>Conta criada! Redirecionando…</div>}

        <label style={label}>Nome</label>
        <input
          style={input}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome completo"
          required
        />

        <label style={label}>E-mail</label>
        <input
          style={input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          required
        />
        {isEmailFormatOk && okEmail === true && (
          <div style={hintOk}>E-mail disponível ✅</div>
        )}
        {isEmailFormatOk && okEmail === false && (
          <div style={hintBad}>Este e-mail já está cadastrado.</div>
        )}

        <label style={label}>Senha</label>
        <input
          style={input}
          type={showPass ? "text" : "password"}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          minLength={6}
          required
        />
        <label style={seePassRow}>
          <input
            type="checkbox"
            checked={showPass}
            onChange={(e) => setShowPass(e.target.checked)}
          />
          <span>Mostrar senha</span>
        </label>

        <button
          style={btn}
          disabled={
            loading ||
            !nome.trim() ||
            !isEmailFormatOk ||
            !senha ||
            okEmail === false
          }
        >
          {loading ? "Criando…" : "Criar conta"}
        </button>

        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
          Já tem conta? <Link to="/login">Entrar</Link>
        </div>
      </form>
    </div>
  );
}

/* estilos */
const wrap = {
  minHeight: "60vh",
  display: "grid",
  placeItems: "center",
  padding: 24,
};
const card = {
  width: "100%",
  maxWidth: 420,
  background: "#101624",
  border: "1px solid #1f2533",
  borderRadius: 12,
  padding: 16,
  color: "#eaecef",
};
const input = {
  width: "100%",
  background: "#0c1220",
  border: "1px solid #253047",
  color: "#eaecef",
  borderRadius: 8,
  padding: "10px 12px",
  marginBottom: 10,
};
const label = { fontSize: 13, margin: "8px 0 6px", opacity: 0.85 };
const seePassRow = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  opacity: 0.9,
  marginTop: -6,
  marginBottom: 10,
};
const btn = {
  width: "100%",
  background: "#10b981",
  color: "#0b0f14",
  border: 0,
  borderRadius: 8,
  padding: "10px 12px",
  cursor: "pointer",
  marginTop: 6,
  fontWeight: 700,
};
const error = {
  background: "#2a0f10",
  border: "1px solid #7f1d1d",
  color: "#fecaca",
  borderRadius: 8,
  padding: "8px 10px",
  marginBottom: 10,
};
const okBox = {
  background: "#0f2a20",
  border: "1px solid #065f46", // <-- corrigido
  color: "#a7f3d0",
  borderRadius: 8,
  padding: "8px 10px",
  marginBottom: 10,
};
const hintOk = { fontSize: 12, color: "#a7f3d0", marginTop: -6, marginBottom: 6 };
const hintBad = { fontSize: 12, color: "#fca5a5", marginTop: -6, marginBottom: 6 };
