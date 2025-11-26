// site src/App.jsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

import LandingPage from "./pages/site/LandingPage.jsx";
import LegalTerms from "./pages/site/LegalTerms.jsx";
import Privacy from "./pages/site/Privacy.jsx";
import Contact from "./pages/site/Contact.jsx";
import About from "./pages/site/About.jsx";
import Affiliates from "./pages/site/Affiliates.jsx";
import Login from "./pages/site/Login.jsx";
import Signup from "./pages/site/SignupPage.jsx";
import Area from "./pages/site/Area.jsx";

// --- FINANCE (NOVO layout em múltiplas páginas)
import FinanceHome from "./pages/finance/FinanceHome.jsx";
import DepositPage from "./pages/finance/DepositPage.jsx";
import WithdrawPage from "./pages/finance/WithdrawPage.jsx";
import MovementsPage from "./pages/finance/MovementsPage.jsx";

import GamesHub from "./pages/site/GamesHub.jsx";
import CoinFlip from "./pages/games/CoinFlip.jsx";
import Dice from "./pages/games/Dice.jsx";
import Slots from "./pages/games/Slots.jsx";
import SlotsDesert from "./pages/games/SlotsDesert";
import SlotsFloresta from "./pages/games/SlotsFloresta";
import SlotsNeon from "./pages/games/SlotsNeon";
import SlotsTigrinho from "./pages/games/SlotsTigrinho";


import RequireAuth from "./components/RequireAuth.jsx";

/** Sobe a página e navega para #hash quando trocar de rota */
function ScrollAndHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (hash) {
      const id = hash.replace("#", "");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollAndHash />

      <Routes>
        {/* públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* compat com antigo /register */}
        <Route path="/register" element={<Navigate to="/signup" replace />} />

        {/* área do cliente (protegida) */}
        <Route
          path="/area"
          element={
            <RequireAuth>
              <Area />
            </RequireAuth>
          }
        />

        {/* FINANCEIRO — páginas separadas (protegidas) */}
        <Route
          path="/financeiro"
          element={
            <RequireAuth>
              <FinanceHome />
            </RequireAuth>
          }
        />
        <Route
          path="/financeiro/depositar"
          element={
            <RequireAuth>
              <DepositPage />
            </RequireAuth>
          }
        />
        <Route
          path="/financeiro/sacar"
          element={
            <RequireAuth>
              <WithdrawPage />
            </RequireAuth>
          }
        />
        <Route
          path="/financeiro/movimentos"
          element={
            <RequireAuth>
              <MovementsPage />
            </RequireAuth>
          }
        />

        {/* jogos (protegidos) */}
        <Route
          path="/jogos"
          element={
            <RequireAuth>
              <GamesHub />
            </RequireAuth>
          }
        />
        <Route
          path="/jogos/coin-flip"
          element={
            <RequireAuth>
              <CoinFlip />
            </RequireAuth>
          }
        />
        <Route
          path="/jogos/dice"
          element={
            <RequireAuth>
              <Dice />
            </RequireAuth>
          }
        />
        <Route
          path="/jogos/slots"
          element={
            <RequireAuth>
              <Slots />
            </RequireAuth>
          }
        />
<Route path="/jogos/slots-desert" element={<SlotsDesert />} />
<Route path="/jogos/slots-floresta" element={<SlotsFloresta />} />
<Route path="/jogos/slots-neon" element={<SlotsNeon />} />
<Route path="/jogos/slots-tigrinho" element={<SlotsTigrinho />} />

        {/* institucionais */}
        <Route path="/termos" element={<LegalTerms />} />
        <Route path="/privacidade" element={<Privacy />} />
        <Route path="/contato" element={<Contact />} />
        <Route path="/sobre" element={<About />} />
        <Route path="/afiliados" element={<Affiliates />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
