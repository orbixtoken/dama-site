// site/src/hooks/useAuth.js
import { useCallback, useEffect, useState } from "react";
import {
  setAuth,
  clearAuth,
  findJwtRec,
  findUserRec,
} from "../lib/api";

export function useAuth() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(() => findUserRec());
  const [token, setToken] = useState(() => {
    const t =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      findJwtRec();
    return t || null;
  });

  useEffect(() => {
    setReady(true);
  }, []);

  const loginOk = useCallback((payload) => {
    // aceita variações: { accessToken, refreshToken, usuario } ou { data: {...} }
    const p = payload?.data || payload || {};
    const access =
      p.accessToken || p.access_token || p.token || findJwtRec(p) || null;
    const refresh = p.refreshToken || p.refresh_token || null;
    const userObj = p.usuario || p.user || findUserRec(p) || null;

    setAuth({ accessToken: access, refreshToken: refresh, usuario: userObj });
    setUser(userObj);
    setToken(access);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setToken(null);
  }, []);

  return { ready, user, token, isAuth: !!token, loginOk, logout };
}

export default useAuth;
