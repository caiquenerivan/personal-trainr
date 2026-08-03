export const PLAN_STUDENT_LIMITS: Record<"FREE" | "PRO" | "UNLIMITED", number | null> = {
  FREE: 3,
  PRO: 20,
  UNLIMITED: null,
};

export const PLAN_PRICES: Record<"PRO" | "UNLIMITED", number> = {
  PRO: 39.9,
  UNLIMITED: 89.9,
};
