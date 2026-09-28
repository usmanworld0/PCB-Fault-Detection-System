export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0 to 4
  level: "Weak" | "Fair" | "Good" | "Strong";
  colorClass: string;
  progressPercent: number;
  requirements: PasswordRequirement[];
  errorMessage?: string;
}

/**
 * Validates password against enterprise strong password requirements:
 * 1. At least 8 characters long
 * 2. At least one uppercase letter (A-Z)
 * 3. At least one lowercase letter (a-z)
 * 4. At least one numeric digit (0-9)
 * 5. At least one special character (!@#$%^&* etc.)
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const p = password || "";

  const reqLength = p.length >= 8;
  const reqUpper = /[A-Z]/.test(p);
  const reqLower = /[a-z]/.test(p);
  const reqNumber = /[0-9]/.test(p);
  const reqSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p);

  const requirements: PasswordRequirement[] = [
    { id: "length", label: "At least 8 characters", met: reqLength },
    { id: "upper", label: "At least one uppercase letter (A-Z)", met: reqUpper },
    { id: "lower", label: "At least one lowercase letter (a-z)", met: reqLower },
    { id: "number", label: "At least one number (0-9)", met: reqNumber },
    { id: "special", label: "At least one special character (!@#$...)", met: reqSpecial },
  ];

  const metCount = requirements.filter((r) => r.met).length;

  let score = 0;
  let level: "Weak" | "Fair" | "Good" | "Strong" = "Weak";
  let colorClass = "bg-rose-500 text-rose-600";
  let progressPercent = 0;

  if (p.length === 0) {
    score = 0;
    progressPercent = 0;
    level = "Weak";
  } else if (metCount <= 2) {
    score = 1;
    progressPercent = 25;
    level = "Weak";
    colorClass = "bg-rose-500 text-rose-600";
  } else if (metCount === 3) {
    score = 2;
    progressPercent = 50;
    level = "Fair";
    colorClass = "bg-amber-500 text-amber-600";
  } else if (metCount === 4) {
    score = 3;
    progressPercent = 75;
    level = "Good";
    colorClass = "bg-sky-500 text-sky-600";
  } else {
    score = 4;
    progressPercent = 100;
    level = "Strong";
    colorClass = "bg-emerald-500 text-emerald-600";
  }

  const isValid = metCount === 5;

  let errorMessage: string | undefined = undefined;
  if (!isValid && p.length > 0) {
    const missing = requirements.filter((r) => !r.met).map((r) => r.label.toLowerCase());
    errorMessage = `Password must include: ${missing.join(", ")}.`;
  }

  return {
    isValid,
    score,
    level,
    colorClass,
    progressPercent,
    requirements,
    errorMessage,
  };
}
