import type { LandingRole } from "@/components/landing/RoleRow";

export const ROLE_CATEGORY_KEYS: ReadonlySet<string> = new Set([
  "swe",
  "pm",
  "dsml",
  "quant",
  "hardware",
]);
export const LEVEL_KEYS: ReadonlySet<string> = new Set(["internship", "newGrad"]);
export const LOCATION_KEYS: ReadonlySet<string> = new Set([
  "remote",
  "usa",
  "intl",
]);
export const FRESH_KEYS: ReadonlySet<string> = new Set(["fresh24h", "freshWeek"]);

export function ageHours(
  datePosted: string | null,
  now: Date = new Date(),
): number | null {
  if (!datePosted) return null;
  const d = new Date(datePosted);
  if (Number.isNaN(d.getTime())) return null;
  return (now.getTime() - d.getTime()) / 36e5;
}

export function matchesCategory(
  role: LandingRole,
  categories: Set<string>,
): boolean {
  if (categories.size === 0) return true;
  return !!role.category && categories.has(role.category);
}

export function matchesLevel(role: LandingRole, levels: Set<string>): boolean {
  if (levels.size === 0) return true;
  const tagsLc = role.tags.map((t) => t.toLowerCase());
  const titleLc = role.role.toLowerCase();
  for (const level of levels) {
    if (
      level === "internship" &&
      (tagsLc.includes("internship") || titleLc.includes("intern"))
    ) {
      return true;
    }
    if (
      level === "newGrad" &&
      (tagsLc.includes("new-grad") || titleLc.includes("new grad"))
    ) {
      return true;
    }
  }
  return false;
}

const US_STATE_ABBREV =
  /\b(ny|ca|tx|wa|ma|il|pa|ga|fl|co|az|oh|mi|nc|va|or|mn|nj|md|ct|dc)\b/;

export function matchesLocation(
  role: LandingRole,
  locations: Set<string>,
): boolean {
  if (locations.size === 0) return true;
  const locationLc = (role.location ?? "").toLowerCase();
  const tagsLc = role.tags.map((t) => t.toLowerCase());
  const isRemote = tagsLc.includes("remote") || locationLc.includes("remote");
  const isUsa =
    /\busa\b|\bunited states\b|\bu\.?s\.?\b/.test(locationLc) ||
    US_STATE_ABBREV.test(locationLc);
  const isIntl = !isUsa && locationLc.length > 0 && !isRemote;
  for (const loc of locations) {
    if (loc === "remote" && isRemote) return true;
    if (loc === "usa" && isUsa) return true;
    if (loc === "intl" && isIntl) return true;
  }
  return false;
}

export function matchesFresh(
  role: LandingRole,
  fresh: Set<string>,
  now: Date = new Date(),
): boolean {
  if (fresh.size === 0) return true;
  const hours = ageHours(role.datePosted, now);
  if (hours === null) return false;
  if (fresh.has("fresh24h") && hours <= 24) return true;
  if (fresh.has("freshWeek") && hours <= 24 * 7) return true;
  return false;
}

export function matchesFilters(
  role: LandingRole,
  filters: Set<string>,
  now: Date = new Date(),
): boolean {
  if (filters.size === 0) return true;
  const cats = new Set<string>();
  const levels = new Set<string>();
  const locs = new Set<string>();
  const fresh = new Set<string>();
  for (const f of filters) {
    if (ROLE_CATEGORY_KEYS.has(f)) cats.add(f);
    else if (LEVEL_KEYS.has(f)) levels.add(f);
    else if (LOCATION_KEYS.has(f)) locs.add(f);
    else if (FRESH_KEYS.has(f)) fresh.add(f);
  }
  return (
    matchesCategory(role, cats) &&
    matchesLevel(role, levels) &&
    matchesLocation(role, locs) &&
    matchesFresh(role, fresh, now)
  );
}
