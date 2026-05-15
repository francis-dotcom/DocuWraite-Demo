export const docuWraiteApiBaseUrl =
  process.env.EXPO_PUBLIC_DOCUWRAITE_API_URL || "http://localhost:8787";

export const docuWraiteUseRuleBasedFallback =
  (process.env.EXPO_PUBLIC_DOCUWRAITE_RULE_FALLBACK || "false").toLowerCase() === "true";
