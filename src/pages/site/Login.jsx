// src/pages/site/Login.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom";
import { authApi } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const { loginOk, isAuth } = useAuth();

  const [form, setForm] = useState({ usuario: "", senha: "" });
  const [show, setShow] = useState(false);
  const [erro, setErro] = useState("");
  const [okMsg, setOkMsg] = useState(""); // mensagem verde (ex.: conta criada)
  const [loading, setLoading] = useState(false);
  const userInputRef = useRef(null);

  // Se veio de uma rota protegida, após login voltamos para lá;
  // se veio do signup, iremos para /area (o Signup manda state.signupOk).
  const redirectTo =
    location.state?.from?.pathname && !location.state?.signupOk
      ? location.state.from.pathname
      : "/area";

  // Se já está autenticado, não mostra o formulário.
  if (isAuth) {
    return <Navigate to={redirectTo} replace />;
  }

  // Mensagem pós-cadastro + preenchimento do e-mail (se veio do signup)
  useEffect(() => {
    if (location.state?.signupOk) {
      const email = location.state?.signupEmail;
      setOkMsg(
        email
          ? `Conta criada para ${email}. Faça login para continuar.`
          : "Conta criada com sucesso. Faça login para continuar."
      );
      if (email) setForm((f) => ({ ...f, usuario: String(email) }));
      // limpa o state para não reaparecer ao voltar
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    userInputRef.current?.focus();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErro("");
    setLoading(true);

    const usuarioRaw = String(form.usuario || "").trim();
    const usuario =
      usuarioRaw.includes("@") ? usuarioRaw.toLowerCase() : usuarioRaw;
    const senha = String(form.senha || "");

    try {
      const { data } = await authApi.login(usuario, senha);
      loginOk(data);
      nav(redirectTo, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.erro ||
        err?.response?.data?.message ||
        "Falha ao entrar.";
      setErro(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <div
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "70vh",
          padding: 16,
        }}
      >
        <form
          onSubmit={submit}
          style={{
            width: "100%",
            maxWidth: 520,
            background: "#0f141f",
            border: "1px solid #1b2231",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Entrar</h2>

          {okMsg && (
            <div
              role="status"
              style={{
                background: "#0f2a20",
                border: "1px solid #065f46",
                color: "#a7f3d0",
                padding: 10,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              {okMsg}
            </div>
          )}

          {erro && (
            <div
              role="alert"
              style={{
                background: "#3b1f1f",
                border: "1px solid #5b2a2a",
                color: "#fecaca",
                padding: 10,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              {erro}
            </div>
          )}

          <div style={{ display: "grid", gap: 10 }}>
            <label htmlFor="usuario" style={{ fontSize: 12, opacity: 0.8 }}>
              Usuário ou e-mail
            </label>
            <input
              id="usuario"
              ref={userInputRef}
              value={form.usuario}
              onChange={(e) =>
                setForm((f) => ({ ...f, usuario: e.target.value }))
              }
              style={{
                background: "#0b1220",
                color: "#eaecef",
                border: "1px solid #1b2231",
                borderRadius: 8,
                padding: "10px 12px",
              }}
              placeholder="seu@email.com"
              autoComplete="username"
              required
            />

            <label htmlFor="senha" style={{ fontSize: 12, opacity: 0.8 }}>
              Senha
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="senha"
                type={show ? "text" : "password"}
                value={form.senha}
                onChange={(e) =>
                  setForm((f) => ({ ...f, senha: e.target.value }))
                }
                style={{
                  width: "100%",
                  background: "#0b1220",
                  color: "#eaecef",
                  border: "1px solid #1b2231", // <<< CORRIGIDO
                  borderRadius: 8,
                  padding: "10px 38px 10px 12px",
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                style={{
                  position: "absolute",
                  right: 6,
                  top: 6,
                  border: "1px solid #1b2231",
                  background: "#0b1220",
                  color: "#eaecef",
                  borderRadius: 6,
                  padding: "6px 8px",
                  cursor: "pointer",
                }}
              >
                {show ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                background: loading ? "#1e429f" : "#2563eb",
                color: "#fff",
                border: 0,
                borderRadius: 8,
                padding: "10px 14px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <div style={{ textAlign: "center", marginTop: 8, fontSize: 14 }}>
              Não tem conta? <Link to="/signup">Criar conta</Link>
            </div>
          </div>
        </form>
      </div>
      <SiteFooter />
    </>
  );
}
