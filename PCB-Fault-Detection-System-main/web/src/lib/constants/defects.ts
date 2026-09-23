export const DEFECT_LABELS: Record<string, string> = {
  open: "Open Circuit",
  short: "Short Circuit",
  mousebite: "Mouse Bite",
  spur: "Spur",
  copper: "Copper",
  pinhole: "Missing Hole",
};

export const DEFECT_COLORS: Record<string, string> = {
  open: "#EF4444",      // Red
  short: "#F97316",     // Orange-red
  mousebite: "#F59E0B", // Amber
  spur: "#8B5CF6",      // Purple
  copper: "#10B981",    // Emerald
  pinhole: "#06B6D4",   // Cyan
};

export const SEVERITY_RULES = {
  criticalClasses: ["open", "short"],
  highConfThreshold: 0.60,
};

export function getDefectLabel(defectClass: string): string {
  const normalized = defectClass.toLowerCase().trim();
  return DEFECT_LABELS[normalized] || defectClass;
}

export function getSeverityBadgeClass(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "bg-rose-500/10 text-rose-400 border border-rose-500/30";
    case "moderate":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
    case "minor":
      return "bg-sky-500/10 text-sky-400 border border-sky-500/30";
    default:
      return "bg-slate-500/10 text-slate-400 border border-slate-500/30";
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status?.toUpperCase()) {
    case "PASS":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
    case "FAIL":
      return "bg-rose-500/10 text-rose-400 border border-rose-500/30";
    case "PENDING":
    case "REVIEW":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
    default:
      return "bg-slate-500/10 text-slate-400 border border-slate-500/30";
  }
}
