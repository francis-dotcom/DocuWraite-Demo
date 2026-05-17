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

export async function fetchAssignedNodesDraft({
  answers,
  fieldContext,
  patientName,
  currentNote = "",
  draftContextToggles = {},
  enabledDraftSections = [],
}) {
  const response = await fetch(`${docuWraiteApiBaseUrl}/api/docuwraite/workflow-step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workflowId: "assigned-nodes",
      answers,
      fieldContext,
      stepIndex: 0,
      patientName,
      currentNote,
      forcedStepKey: "draft",
      draftContextToggles,
      enabledDraftSections,
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
