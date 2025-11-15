// site/src/lib/api.js
import axios from "axios";

/** Base da API (via proxy/Vite ou URL absoluta). */
export const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");
/** URL do painel/app (caso precise redirecionar). */
export const PANEL_URL = import.meta.env.VITE_PANEL_URL || "/area";

/** Fallback de chave PIX vindo do .env (para quando o backend não retornar nada) */
const FALLBACK_PIX_KEY = String(import.meta.env.VITE_PIX_CHAVE || "").trim() || null;

/* ------------------------------------------------------------------ */
/* Helpers de autenticação                                            */
/* ------------------------------------------------------------------ */
export function findJwtRec(obj = null) {
  if (!obj) {
    const fromLs = {
      access_token: localStorage.getItem("access_token"),
      accessToken: localStorage.getItem("accessToken"),
      token: localStorage.getItem("token"),
    };
    return findJwtRec(fromLs);
  }
  if (typeof obj !== "object" || obj === null) return null;

  const jwtLike = (s) =>
    typeof s === "string" &&
    /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(s.trim?.());

  const direct =
    obj.access_token ||
    obj.accessToken ||
    obj.token ||
    obj.jwt ||
    obj?.data?.access_token ||
    obj?.data?.token ||
    obj?.auth?.token ||
    obj?.result?.token;

  if (jwtLike(direct)) return direct;

  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (jwtLike(v)) return v;
    if (v && typeof v === "object") {
      const nested = findJwtRec(v);
      if (nested) return nested;
    }
  }
  return null;
}

export function findUserRec(obj = null) {
  if (!obj) {
    try {
      const raw =
        localStorage.getItem("usuario") ||
        localStorage.getItem("user") ||
        localStorage.getItem("profile");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  if (typeof obj !== "object" || obj === null) return null;
  const candidates = ["usuario", "user", "profile", "account", "data"];
  for (const k of candidates) {
    const v = obj[k];
    if (v && typeof v === "object") {
      if ("id" in v && ("usuario" in v || "email" in v || "username" in v)) {
        return v;
      }
    }
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === "object") {
      const nested = findUserRec(v);
      if (nested) return nested;
    }
  }
  return null;
}

const decodeJwt = (t) => {
  try {
    const [, payload] = t.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

export function setAuth({ accessToken, refreshToken, usuario }) {
  if (accessToken) {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("access_token", accessToken);
    const decoded = decodeJwt(accessToken);
    if (decoded?.exp) localStorage.setItem("token_exp_unix", String(decoded.exp));
  }
  if (refreshToken) {
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("refreshToken", refreshToken);
  }
  if (usuario) {
    localStorage.setItem("usuario", JSON.stringify(usuario));
  }
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("usuario");
  localStorage.removeItem("token_exp_unix");
}

/* ------------------------------------------------------------------ */
/* Axios base + interceptors                                          */
/* ------------------------------------------------------------------ */
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  timeout: 20000,
  timeoutErrorMessage: "Tempo de resposta excedido",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((cfg) => {
  const t =
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    "";
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let refreshing = null;

async function doRefresh() {
  if (!refreshing) {
    const refresh_token =
      localStorage.getItem("refresh_token") || localStorage.getItem("refreshToken");
    refreshing = (async () => {
      if (!refresh_token) throw new Error("No refresh token");
      const res = await axios.post(
        `${API_BASE}/auth/refresh`,
        { refresh_token },
        { timeout: 15000 }
      );
      const accessToken =
        findJwtRec(res.data) || res.data?.access_token || res.data?.token;
      const usuario = findUserRec(res.data);
      setAuth({ accessToken, refreshToken: refresh_token, usuario });
      return accessToken;
    })().finally(() => {
      setTimeout(() => (refreshing = null), 0);
    });
  }
  return refreshing;
}

function broadcastApiError(err) {
  try {
    const payload = {
      status: err?.response?.status ?? null,
      url: err?.config?.url ?? null,
      method: err?.config?.method ?? null,
      data: err?.response?.data ?? null,
      message:
        err?.response?.data?.erro ||
        err?.message ||
        "Falha na solicitação.",
    };
    localStorage.setItem("api_last_error", JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("api:error", { detail: payload }));
    console.error("[API ERROR]", payload);
  } catch (e) {}
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err?.config;
    const status = err?.response?.status;
    if (status === 401 && !original?._retry) {
      try {
        original._retry = true;
        await doRefresh();
        const t =
          localStorage.getItem("access_token") ||
          localStorage.getItem("accessToken") ||
          localStorage.getItem("token") ||
          "";
        if (t) original.headers = { ...(original.headers || {}), Authorization: `Bearer ${t}` };
        return api.request(original);
      } catch (_) {
        clearAuth();
      }
    }
    if ([403, 419, 498].includes(status)) clearAuth();
    broadcastApiError(err);
    return Promise.reject(err);
  }
);

/* ------------------------------------------------------------------ */
/* Utils                                                              */
/* ------------------------------------------------------------------ */
function normalizeValor(v) {
  const n = Number(String(v).replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}
function normalizePixKey(k) {
  return String(k ?? "").trim();
}

/* ------------------------------------------------------------------ */
/* Helper com fallback de rotas                                       */
/* ------------------------------------------------------------------ */
async function requestWithFallback(method, paths, config = {}) {
  let lastError;
  for (const p of paths) {
    try {
      if (method === "get")    return await api.get(p, config);
      if (method === "post")   return await api.post(p, config?.data ?? config);
      if (method === "put")    return await api.put(p, config?.data ?? config);
      if (method === "delete") return await api.delete(p, config);
      throw new Error(`Método não suportado: ${method}`);
    } catch (e) {
      lastError = e;
      const status = e?.response?.status;
      if (![404, 405].includes(status)) break;
    }
  }
  throw lastError;
}

/* ------------------------------------------------------------------ */
/* Auth / User                                                        */
/* ------------------------------------------------------------------ */
export const authApi = {
  login(usuario, senha) {
    // login já está padronizado para { usuario, senha }
    return api.post("/auth/login", { usuario, senha });
  },

  logout() {
    const rt = localStorage.getItem("refresh_token") || localStorage.getItem("refreshToken");
    return api.post("/auth/logout", { refresh_token: rt }).finally(() => clearAuth());
  },

  refresh() {
    const rt = localStorage.getItem("refresh_token") || localStorage.getItem("refreshToken");
    return api.post("/auth/refresh", { refresh_token: rt });
  },

  /** Criação de conta pública
   * Backend espera { usuario, senha, nome? }
   * Vamos usar o e-mail digitado como "usuario".
   */
  signup({ nome, email, senha }) {
    const usuario = String(email || "").trim().toLowerCase();
    return api.post("/auth/signup", { usuario, senha, nome });
  },

  /* -------- Checagem de e-mail/login -------- */
  checkEmail(email) {
    const e = encodeURIComponent(String(email || "").trim());
    return requestWithFallback(
      "get",
      [
        `/auth/check-email?email=${e}`,          // rota oficial (usa 'email' mas grava em usuario)
        `/usuarios/check-email?email=${e}`,      // fallback antigo
      ]
    );
  },
};

export const userApi = {
  me() {
    return api.get("/usuarios/me");
  },
};

/* ------------------------------------------------------------------ */
/* Financeiro (Site)                                                  */
/* ------------------------------------------------------------------ */
export const financeApi = {
  /* --- Saldo --- */
  saldo() {
    return requestWithFallback("get", ["/saldo", "/financeiro/saldo"]);
  },
  getBalance() {
    return this.saldo();
  },

  /* --- Extrato / Movimentos --- */
  async movimentos(params = {}) {
    try {
      // rota preferencial
      return await api.get("/financeiro/movimentos", { params });
    } catch {
      // fallback legado
      return api.get("/movimentos", { params });
    }
  },
  getTransactions(params = {}) {
    return this.movimentos(params);
  },

  /* --- Depósito --- */
  async deposit({ valor, metodo = "PIX", referencia = "" }) {
    const payload = { valor: normalizeValor(valor), metodo, referencia };
    if (!Number.isFinite(payload.valor) || payload.valor <= 0) {
      const err = { response: { data: { erro: "Valor inválido." } } };
      broadcastApiError(err);
      return Promise.reject(err);
    }
    try {
      const res = await requestWithFallback(
        "post",
        ["/depositos", "/financeiro/deposito"],
        payload
      );
      const d = res?.data || {};
      const ticket = {
        codigo_ref: d.codigo_ref || d.ref || d.codigo || null,
        pix_chave: normalizePixKey(
          d.pix_chave || d.chave_pix || d.pix || FALLBACK_PIX_KEY
        ),
        mensagem: d.mensagem || d.message || null,
        deposito: d.deposito || d.data || null,
        brcode: d.brcode || d.emv || null,
        qrcode_url: d.qrcode_url || d.qr || null,
      };
      return { ...res, data: ticket };
    } catch (e) {
      const msg = e?.response?.data?.erro || "Falha ao solicitar depósito.";
      const err = { ...e, message: msg };
      broadcastApiError(err);
      throw err;
    }
  },
  createDeposit(payload) {
    return this.deposit(payload);
  },

  /* --- Saque --- */
  async withdraw({ valor, pix_chave = "" }) {
    const payload = {
      valor: normalizeValor(valor),
      pix_chave: normalizePixKey(pix_chave),
    };
    if (!Number.isFinite(payload.valor) || payload.valor <= 0) {
      const err = { response: { data: { erro: "Valor inválido." } } };
      broadcastApiError(err);
      return Promise.reject(err);
    }
    if (!payload.pix_chave || payload.pix_chave.length < 5 || payload.pix_chave.length > 120) {
      const err = { response: { data: { erro: "Chave PIX inválida." } } };
      broadcastApiError(err);
      return Promise.reject(err);
    }
    try {
      const res = await api.post("/saques", payload);
      return res;
    } catch (e) {
      const msg = e?.response?.data?.erro || "Falha ao solicitar saque.";
      const err = { ...e, message: msg };
      broadcastApiError(err);
      throw err;
    }
  },
  createWithdraw(payload) {
    return this.withdraw(payload);
  },
};

/* ------------------------------------------------------------------ */
/* Depósitos (listar/consultar)                                       */
/* ------------------------------------------------------------------ */
export const depositsApi = {
  list(params = {}) {
    return api
      .get("/depositos/meus", { params })
      .catch(() => api.get("/depositos", { params }))
      .catch(() => api.get("/financeiro/depositos", { params }));
  },
  get(id) {
    return api
      .get(`/depositos/${id}`)
      .catch(() => api.get(`/financeiro/depositos/${id}`));
  },
  qr(id) {
    return api
      .get(`/depositos/${id}/qr`)
      .catch(() => api.get(`/financeiro/depositos/${id}/qr`));
  },
};

/* ------------------------------------------------------------------ */
/* Indicações / Afiliados (Site)                                      */
/* ------------------------------------------------------------------ */
export const referralsApi = {
  me() {
    return requestWithFallback(
      "get",
      [
        "/referrals/me",
        "/referrals/summary",
        "/indicacoes/me",
        "/indicacoes/summary",
        "/afiliados/me",
      ]
    );
  },

  events(params = {}) {
    return requestWithFallback(
      "get",
      [
        "/referrals/history",
        "/referrals/events",
        "/indicacoes/eventos",
        "/afiliados/eventos",
      ],
      { params }
    );
  },

  claimWeekly() {
    return requestWithFallback(
      "post",
      [
        "/referrals/claim-weekly",
        "/referrals/claim-week",
        "/indicacoes/claim-week",
        "/afiliados/claim-week",
      ],
      {}
    );
  },
};

/* ------------------------------------------------------------------ */
/* Jogos (Cassino) — endpoints diretos                                */
/* ------------------------------------------------------------------ */
export const casinoApi = {
  coinflipPlay(stake, bet) {
    return api.post("/cassino/coinflip/play", { stake, bet });
  },
  dicePlay(stake, target) {
    return api.post("/cassino/dice/play", { stake, target });
  },
  hiloPlay(stake, choice) {
    return api.post("/cassino/hilo/play", { stake, choice });
  },
  scratchPlay(stake) {
    return api.post("/cassino/scratch/play", { stake });
  },
  slotsCommonPlay(stake) {
    return api.post("/cassino/slots/common/play", { stake });
  },
  slotsPremiumPlay(stake) {
    return api.post("/cassino/slots/premium/play", { stake });
  },

  minhasCoinflip() {
    return api.get("/cassino/coinflip/minhas");
  },
  minhasDice() {
    return api.get("/cassino/dice/minhas");
  },
  minhasHiLo() {
    return api.get("/cassino/hilo/minhas");
  },
  minhasScratch() {
    return api.get("/cassino/scratch/minhas");
  },
  minhasSlotsCommon() {
    return api.get("/cassino/slots/common/minhas");
  },
  minhasSlotsPremium() {
    return api.get("/cassino/slots/premium/minhas");
  },
};

/* ------------------------------------------------------------------ */
/* Slots Common — helper com interface explícita (play/my)            */
/* ------------------------------------------------------------------ */
export const slotsCommonApi = {
  play(stake) {
    const s = Number(stake);
    return api.post("/cassino/slots/common/play", { stake: s });
  },
  my() {
    return api.get("/cassino/slots/common/minhas");
  },
};

/* ------------------------------------------------------------------ */
/* Alias/namespace de cassino com support a slots.common              */
/* ------------------------------------------------------------------ */
export const cassinoApi = {
  ...casinoApi,
  slots: {
    common: slotsCommonApi,
  },
};

/** Alias PT-BR para backward-compat de imports antigos */
export const financeiroSiteApi = financeApi;

export default api;
