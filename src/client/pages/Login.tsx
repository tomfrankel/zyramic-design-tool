import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES, type Role } from "../../shared/roles";
import { login } from "../lib/api";

export function LoginPage() {
  const [role, setRole] = useState<Role>("engineering");
  const [key, setKey] = useState("engineering");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  return (
    <div className="login-wrap">
      <form
        className="login-card"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await login(role, key);
            navigate("/select");
          } catch (err) {
            setError(String(err instanceof Error ? err.message : err));
          }
        }}
      >
        <img src="/brand/zyramic-logo.png" alt="Zyramic" />
        <h2>Proposal Software</h2>
        <p className="muted">Draft role wall. Customer stays in sizing. Sales, engineering, and admin can open the commercial zone.</p>
        <div className="field">
          <label>Role</label>
          <select
            value={role}
            onChange={(e) => {
              const next = e.target.value as Role;
              setRole(next);
              setKey(next);
            }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Demo key (same as role name in this draft)</label>
          <input value={key} onChange={(e) => setKey(e.target.value)} />
        </div>
        {error ? <p className="banner">{error}</p> : null}
        <button className="primary" type="submit">Enter workspace</button>
      </form>
    </div>
  );
}
