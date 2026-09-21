import type { Request, Response, NextFunction } from "express";
import { canAccessZone, isRole, type Role, type Zone } from "../shared/roles.js";

export interface AuthedRequest extends Request {
  role?: Role;
}

const COOKIE = "zy_role";

export function demoKeys(): Record<Role, string> {
  return {
    customer: process.env.DEMO_CUSTOMER_KEY || "customer",
    sales: process.env.DEMO_SALES_KEY || "sales",
    engineering: process.env.DEMO_ENGINEERING_KEY || "engineering",
    admin: process.env.DEMO_ADMIN_KEY || "admin"
  };
}

export function parseRole(req: Request): Role | null {
  const header = req.header("x-zyramic-role");
  if (isRole(header)) return header;
  const cookie = String(req.headers.cookie || "")
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${COOKIE}=`));
  const value = cookie?.split("=")[1];
  return isRole(value) ? value : null;
}

export function requireRole(req: AuthedRequest, res: Response, next: NextFunction) {
  const role = parseRole(req);
  if (!role) {
    res.status(401).json({ error: "Sign in required", zone: "auth" });
    return;
  }
  req.role = role;
  next();
}

export function requireZone(zone: Zone) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const role = req.role;
    if (!role || !canAccessZone(role, zone)) {
      res.status(403).json({
        error: "Commercial zone is walled to sales, engineering, and admin.",
        zone,
        role: role ?? null
      });
      return;
    }
    next();
  };
}

export function setRoleCookie(res: Response, role: Role) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${role}; Path=/; SameSite=Lax; HttpOnly=false`
  );
}
