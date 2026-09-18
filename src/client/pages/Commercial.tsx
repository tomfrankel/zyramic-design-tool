import { useEffect, useState } from "react";
import { createCustomer, listCustomers, listQuotes } from "../lib/api";

export function CommercialPage() {
  const [customers, setCustomers] = useState<{ id: string; name: string; createdAt: string }[]>([]);
  const [quotes, setQuotes] = useState<Array<Record<string, unknown>>>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setCustomers(await listCustomers());
      setQuotes(await listQuotes());
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <>
      <div className="banner">Commercial zone — sales / engineering / admin only. No invented warranty or lead time. Customer lists start empty in this public draft.</div>
      {error ? <div className="wall">{error}</div> : null}
      <div className="grid-2">
        <section className="card">
          <h2>Customers</h2>
          <p className="muted">Runtime list only. Do not commit customer data.</p>
          <div className="field">
            <label>Add customer</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button className="primary" onClick={async () => {
            if (!name.trim()) return;
            await createCustomer(name.trim());
            setName("");
            refresh();
          }}>Save</button>
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Created</th></tr></thead>
            <tbody>
              {customers.length === 0 ? <tr><td colSpan={3}>No customers stored.</td></tr> : customers.map((c) => (
                <tr key={c.id}><td>{c.id}</td><td>{c.name}</td><td>{c.createdAt}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card">
          <h2>Past quotes / proposals</h2>
          <p className="muted">RFQ + selection persist together. Dropbox target: /Zyramic Setup Info/Proposal Software/Orders/{"{projectId}"}/</p>
          <table>
            <thead><tr><th>Project</th><th>Product</th><th>Dropbox stub</th></tr></thead>
            <tbody>
              {quotes.length === 0 ? <tr><td colSpan={3}>No stored proposals yet.</td></tr> : quotes.map((q) => (
                <tr key={String(q.id)}>
                  <td>{String(q.projectName)}<div className="muted">{String(q.projectId)}</div></td>
                  <td>{String(q.product)}</td>
                  <td>{String(q.dropboxPath)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
