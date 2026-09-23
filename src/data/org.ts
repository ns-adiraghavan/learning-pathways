/**
 * Netscribes org taxonomy — Function → Division.
 * A "Division" is one of the ~18 teams people belong to; every division rolls
 * up to exactly one Function. Downloads, the leaderboard, reports and the
 * learner directory all read the org through here so the rollup stays correct.
 */

export const DIVISIONS = [
  "Sales",
  "Presales",
  "Marketing",
  "Business Development",
  "Data Tech",
  "Tech Solutions",
  "Data Analytics and Engineering",
  "Thought Leadership",
  "Info Services",
  "Research",
  "Finance",
  "HR",
  "Admin",
  "PMO",
  "Process Excellence",
  "COE",
  "IT Support",
  "Payroll",
] as const;

export type Division = (typeof DIVISIONS)[number];

export const FUNCTIONS = ["Sales", "Operations", "Support"] as const;
export type FunctionArea = (typeof FUNCTIONS)[number];

/** Which Function each Division rolls up to. */
export const DIVISION_TO_FUNCTION: Record<string, FunctionArea> = {
  // Sales
  Marketing: "Sales",
  Sales: "Sales",
  Presales: "Sales",
  "Business Development": "Sales",
  // Operations
  "Data Tech": "Operations",
  "Tech Solutions": "Operations",
  "Data Analytics and Engineering": "Operations",
  "Thought Leadership": "Operations",
  "Info Services": "Operations",
  Research: "Operations",
  // Support (everything else)
  Finance: "Support",
  HR: "Support",
  Admin: "Support",
  PMO: "Support",
  "Process Excellence": "Support",
  COE: "Support",
  "IT Support": "Support",
  Payroll: "Support",
};

/** Resolve a division to its Function; unknown divisions fall back to Support. */
export function functionForDivision(division: string): FunctionArea {
  return DIVISION_TO_FUNCTION[division] ?? "Support";
}

/** Divisions that belong to a given Function. */
export function divisionsForFunction(fn: FunctionArea): string[] {
  return DIVISIONS.filter((d) => DIVISION_TO_FUNCTION[d] === fn);
}

/**
 * Legal entity a person is employed under. Netscribes runs two: NDIPL and NAPL.
 * NAPL shares the same org structure (division → function, departments, etc.) but
 * is tracked separately so compliance can be sliced/audited per entity.
 */
export const ENTITIES = ["NDIPL", "NAPL"] as const;
export type OrgEntity = (typeof ENTITIES)[number];

/**
 * Active client/delivery projects people are staffed on. Used as a learner
 * attribute for reporting and enrollment targeting.
 */
export const PROJECTS = [
  "Tata 1mg Intelligence",
  "Flipkart Content Ops",
  "Myntra Catalogue",
  "TataCliq Insights",
  "Pharma Competitive Watch",
  "Internal / Bench",
] as const;
export type ProjectName = (typeof PROJECTS)[number];
