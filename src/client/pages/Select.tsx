import { Link } from "react-router-dom";
import { getRole } from "../lib/api";
import { canSeePricing } from "../../shared/roles";

export function SelectPage() {
  const role = getRole();
  return (
    <>
      <div className="banner">
        PRELIMINARY draft. Palisade and Swing MBR modules only. Alper Özkan Sep 18 Arges/Ahmet Iraq quote is the acceptance baseline. Not a complete-system designer and not a final customer/field issue.
      </div>
      <section className="hero">
        <div>
          <h2>Select a module family</h2>
          <p className="muted">
            Sizing is customer-eligible. Pricing, customer lists, sell margin, and past quotes stay in the commercial zone.
            Later public path: zyramic.com/proposal with the same /proposal and /select routes.
          </p>
          <div className="grid-2" style={{ marginTop: "1rem" }}>
            <Link className="product-card" to="/proposal/palisade">
              <h3>Palisade</h3>
              <p className="muted">Polymer flat-sheet MBR modules with on-board scour. V29 engineering basis: input, sizing, module selection, scour air, CIP boundary, summary, assumptions.</p>
            </Link>
            <Link className="product-card" to="/proposal/swing">
              <h3>Swing MBR</h3>
              <p className="muted">Swing MBR module selection. Default Alper 12 LMH + 2-wide pack; industry 0.34 m³/m²/d remains an alternate mode.</p>
            </Link>
          </div>
        </div>
        <div className="card">
          <h3>Role wall</h3>
          <p>Signed in as <strong>{role}</strong>.</p>
          <p className="muted">Customer: selection and sizing only. No prices, customer lists, or past quotes.</p>
          {role && canSeePricing(role) ? (
            <p><Link to="/proposal/commercial">Open commercial zone →</Link></p>
          ) : (
            <p className="muted">Commercial navigation is hidden for this role and blocked on the API.</p>
          )}
        </div>
      </section>
    </>
  );
}
