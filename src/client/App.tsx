import type { ReactNode } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { canAccessZone, canSeePricing } from "../shared/roles";
import { getRole, logout } from "./lib/api";
import { CommercialPage } from "./pages/Commercial";
import { LoginPage } from "./pages/Login";
import { PalisadePage } from "./pages/Palisade";
import { SelectPage } from "./pages/Select";
import { SwingPage } from "./pages/Swing";

function Shell({ children }: { children: ReactNode }) {
  const role = getRole();
  const navigate = useNavigate();
  const loc = useLocation();
  const commercial = loc.pathname.startsWith("/proposal/commercial");
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img src="/brand/logo-header.png" alt="Zyramic" />
          <div>
            <h1>Proposal Software</h1>
            <p>Draft workspace · Palisade + Swing MBR modules</p>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/select">Select</NavLink>
          <NavLink to="/proposal/palisade">Palisade</NavLink>
          <NavLink to="/proposal/swing">Swing MBR</NavLink>
          {role && canSeePricing(role) ? <NavLink to="/proposal/commercial">Commercial</NavLink> : null}
        </nav>
        <div className="role-box">
          <span className={`zone-pill ${commercial ? "commercial" : ""}`}>{commercial ? "Commercial zone" : "Sizing zone"}</span>
          <span className="role-pill">{role}</span>
          <button className="ghost" onClick={async () => { await logout(); navigate("/"); }}>
            Sign out
          </button>
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}

function Guard({ zone, children }: { zone: "sizing" | "commercial"; children: ReactNode }) {
  const role = getRole();
  if (!role) return <Navigate to="/" replace />;
  if (!canAccessZone(role, zone)) {
    return (
      <Shell>
        <div className="wall">
          <h2>Commercial zone is walled</h2>
          <p>Customer sessions can use selection and sizing only. Pricing, customer lists, and past quotes stay with sales, engineering, and admin.</p>
        </div>
      </Shell>
    );
  }
  return <Shell>{children}</Shell>;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={getRole() ? <Navigate to="/select" replace /> : <LoginPage />} />
      <Route path="/select" element={<Guard zone="sizing"><SelectPage /></Guard>} />
      <Route path="/proposal" element={<Navigate to="/select" replace />} />
      <Route path="/proposal/palisade" element={<Guard zone="sizing"><PalisadePage /></Guard>} />
      <Route path="/proposal/swing" element={<Guard zone="sizing"><SwingPage /></Guard>} />
      <Route path="/proposal/commercial" element={<Guard zone="commercial"><CommercialPage /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
