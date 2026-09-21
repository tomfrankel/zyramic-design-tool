export const ROLES = ["customer", "sales", "engineering", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const ZONES = ["sizing", "commercial"] as const;
export type Zone = (typeof ZONES)[number];

export function canAccessZone(role: Role, zone: Zone): boolean {
  if (zone === "sizing") return true;
  return role === "sales" || role === "engineering" || role === "admin";
}

export function canSeePricing(role: Role): boolean {
  return canAccessZone(role, "commercial");
}

export function canManageCustomers(role: Role): boolean {
  return role === "sales" || role === "admin";
}

export function canSeeEngineeringDetail(role: Role): boolean {
  return role === "engineering" || role === "admin" || role === "sales";
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
