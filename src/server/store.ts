import fs from "node:fs";
import path from "node:path";
import { newId } from "../shared/id.js";

export interface CustomerRecord {
  id: string;
  name: string;
  createdAt: string;
}

export interface QuoteRecord {
  id: string;
  projectId: string;
  product: "palisade" | "swing";
  projectName: string;
  createdAt: string;
  createdByRole: string;
  rfq: Record<string, unknown>;
  selection: Record<string, unknown>;
  includePricing: boolean;
  dropboxPath: string;
  hubspot: Record<string, unknown>;
}

interface DbShape {
  customers: CustomerRecord[];
  quotes: QuoteRecord[];
}

const dataDir = process.env.DATA_DIR || path.resolve("data");
const dbPath = path.join(dataDir, "store.json");

function empty(): DbShape {
  return { customers: [], quotes: [] };
}

function readDb(): DbShape {
  try {
    if (!fs.existsSync(dbPath)) return empty();
    return JSON.parse(fs.readFileSync(dbPath, "utf8")) as DbShape;
  } catch {
    return empty();
  }
}

function writeDb(db: DbShape) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

export const store = {
  listCustomers() {
    return readDb().customers;
  },
  createCustomer(name: string) {
    const db = readDb();
    const rec: CustomerRecord = { id: newId("CUST"), name, createdAt: new Date().toISOString() };
    db.customers.push(rec);
    writeDb(db);
    return rec;
  },
  listQuotes() {
    return readDb().quotes;
  },
  getQuote(id: string) {
    return readDb().quotes.find((q) => q.id === id || q.projectId === id) ?? null;
  },
  saveQuote(record: Omit<QuoteRecord, "id" | "createdAt"> & { id?: string }) {
    const db = readDb();
    const existing = record.id ? db.quotes.find((q) => q.id === record.id) : null;
    if (existing) {
      Object.assign(existing, record);
      writeDb(db);
      return existing;
    }
    const rec: QuoteRecord = {
      ...record,
      id: record.id || newId("Q"),
      createdAt: new Date().toISOString()
    };
    db.quotes.push(rec);
    writeDb(db);
    return rec;
  }
};
