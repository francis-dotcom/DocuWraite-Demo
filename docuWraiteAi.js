import { docuWraiteApiBaseUrl } from "./docuWraiteConfig";

export async function fetchDocuWraiteWorkflowStep({
  workflowId,
  answers,
  fieldContext,
  stepIndex,
  patientName,
  currentNote = "",
  forcedStepKey = null,
}) {
  const response = await fetch(`${docuWraiteApiBaseUrl}/api/docuwraite/workflow-step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workflowId,
      answers,
      fieldContext,
      stepIndex,
      patientName,
      currentNote,
      forcedStepKey,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "DocuWraite could not reach the AI service.");
  }

  return {
    step: payload.step,
    meta: payload.meta || null,
  };
}
