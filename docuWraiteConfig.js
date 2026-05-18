export const docuWraiteApiBaseUrl =
  process.env.EXPO_PUBLIC_DOCUWRAITE_API_URL || "http://localhost:8787";

export const docuWraiteUseRuleBasedFallback =
  (process.env.EXPO_PUBLIC_DOCUWRAITE_RULE_FALLBACK || "false").toLowerCase() === "true";

/** Web-only browser zoom on load (1 = normal). Netlify default is 0.85 via netlify.toml. */
export const docuWraiteWebInitialScale = Number(
  process.env.EXPO_PUBLIC_WEB_INITIAL_SCALE || "1"
);
