const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const { isSupportedWorkflow } = require("./playbooks");
const { resolveWorkflowStep } = require("./playbookEngine");
const { buildDraftNotePrompt } = require("./draftPrompt");
const { ASSIGNED_NODES_SYSTEM_PROMPT } = require("./assignedNodesDraftPrompt");
const { evaluateAssignedDraftGuidelines } = require("./assignedNodesGuidelines");
const { extractCarePlanFromSource } = require("./carePlanSourceExtractor");
const { runMorningShiftSync } = require("./morningShiftSync");
const { runTherapSync, syncClientFromTherap } = require("./therapSync");
const { createTherapMockRouter } = require("./integrations/therapMockRoutes");
const { getTherapConfig } = require("./integrations/therapHttpClient");
const {
  dbPath,
  getAssignmentsByClient,
  getRowPromptCategories,
  getRowPromptTemplates,
  getWorkspaceState,
  getClientShiftSchedule,
  saveClientShiftSchedule,
  getClientCarePlanData,
  getClientWorkflowContexts,
  saveClientCarePlanData,
  getTodayShiftDate,
  saveAssignment,
  saveWorkspaceState,
} = require("./storage");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const port = Number(process.env.PORT || process.env.DOCUWRAITE_API_PORT || 8787);
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/therap-mock", createTherapMockRouter());

app.post("/api/assignments", async (req, res) => {
  try {
    const data = req.body || {};
    const saved = saveAssignment({
      clientId: data.clientId,
      target: data.target,
      assigned: data.assigned || [],
      assignedNodeConfig: data.assignedNodeConfig || null,
      updatedAt: data.updatedAt || new Date().toISOString(),
    });
    res.json({ ok: true, assignment: saved, dbPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/assignments/:clientId", (req, res) => {
  try {
    res.json({
      ok: true,
      assignments: getAssignmentsByClient(req.params.clientId),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/workspace-state/:clientId", async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const shiftDate = req.query.shiftDate || getTodayShiftDate();
    let therapSyncResult = null;

    if (String(req.query.syncTherap || "").toLowerCase() === "true") {
      therapSyncResult = await syncClientFromTherap(clientId, {
        shiftDate,
        syncShiftSchedule: true,
        syncCarePlan: String(req.query.syncCarePlan || "").toLowerCase() === "true",
      });
    }

    const clientShift = getClientShiftSchedule(clientId, shiftDate);
    const clientCarePlan = getClientCarePlanData(clientId);
    const clientWorkflowContexts = getClientWorkflowContexts(clientId);

    res.json({
      ok: true,
      state: getWorkspaceState(clientId),
      clientShift,
      clientCarePlan,
      clientWorkflowContexts,
      therapSync: therapSyncResult,
      shiftDate,
      dbPath,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/clients/:clientId/shift-schedule", (req, res) => {
  try {
    const clientId = req.params.clientId;
    const shiftDate = req.query.shiftDate || getTodayShiftDate();
    const clientShift = getClientShiftSchedule(clientId, shiftDate);

    if (!clientShift) {
      res.status(404).json({ error: `No shift schedule found for client ${clientId}` });
      return;
    }

    res.json({
      ok: true,
      clientShift,
      shiftDate,
      dbPath,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/clients/:clientId/shift-schedule", (req, res) => {
  try {
    const clientId = req.params.clientId;
    const shiftDate = req.body?.shiftDate || req.query.shiftDate || getTodayShiftDate();
    const saved = saveClientShiftSchedule({
      clientId,
      shiftDate,
      schedule: req.body?.schedule || {},
      intelligenceOptions: req.body?.intelligenceOptions || null,
    });

    res.json({
      ok: true,
      clientShift: saved,
      shiftDate,
      dbPath,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/clients/:clientId/care-plan", (req, res) => {
  try {
    const clientId = req.params.clientId;
    const clientCarePlan = getClientCarePlanData(clientId);

    if (!clientCarePlan) {
      res.status(404).json({ error: `No care plan data found for client ${clientId}` });
      return;
    }

    res.json({
      ok: true,
      clientCarePlan,
      dbPath,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/clients/:clientId/care-plan/extract-source", (req, res) => {
  try {
    const clientId = req.params.clientId;
    const currentCarePlan = getClientCarePlanData(clientId);
    const extraction = extractCarePlanFromSource({
      fallbackProfile: currentCarePlan?.intelligenceOptions?.editorContent || {},
    });

    res.json({
      ok: true,
      clientId,
      extraction,
      dbPath,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Care plan source extraction failed." });
  }
});

app.put("/api/clients/:clientId/care-plan", (req, res) => {
  try {
    const clientId = req.params.clientId;
    const saved = saveClientCarePlanData({
      clientId,
      riskCards: req.body?.riskCards || [],
      actionPlans: req.body?.actionPlans || [],
      intelligenceOptions: req.body?.intelligenceOptions || null,
    });

    res.json({
      ok: true,
      clientCarePlan: saved,
      dbPath,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/sync/morning-shift", (req, res) => {
  try {
    const shiftDate = req.body?.shiftDate || req.query.shiftDate || getTodayShiftDate();
    const clientIds = Array.isArray(req.body?.clientIds) ? req.body.clientIds : undefined;
    const result = runMorningShiftSync({ shiftDate, clientIds });

    res.json({
      ok: result.ok,
      ...result,
      dbPath,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/sync/therap", async (req, res) => {
  try {
    const shiftDate = req.body?.shiftDate || req.query.shiftDate || getTodayShiftDate();
    const clientIds = Array.isArray(req.body?.clientIds) ? req.body.clientIds : undefined;
    const syncShiftSchedule = req.body?.syncShiftSchedule !== false;
    const syncCarePlan = req.body?.syncCarePlan !== false;
    const mode = req.body?.mode || null;

    const result = await runTherapSync({
      shiftDate,
      clientIds,
      syncShiftSchedule,
      syncCarePlan,
      mode,
    });

    res.json({
      ok: result.ok,
      ...result,
      dbPath,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/row-prompts/categories", (_req, res) => {
  try {
    res.json({
      ok: true,
      categories: getRowPromptCategories(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/row-prompts/:categoryKey", (req, res) => {
  try {
    res.json({
      ok: true,
      prompts: getRowPromptTemplates(req.params.categoryKey),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/workspace-state/:clientId", (req, res) => {
  try {
    const data = req.body || {};
    const savedState = saveWorkspaceState({
      clientId: req.params.clientId,
      timeBlocks: data.timeBlocks || [],
      rows: data.rows || [],
      documentationSession: data.documentationSession || null,
      selectedLibrary: data.selectedLibrary || null,
      selectedNoteType: data.selectedNoteType || "all",
      selectedDepth: data.selectedDepth || null,
      includeMode: data.includeMode || null,
      selectedBranchKey: data.selectedBranchKey || null,
      selectedTargetType: data.selectedTargetType || null,
      selectedTargetId: data.selectedTargetId || null,
      checkedNodes: data.checkedNodes || {},
      includeInFinalMap: data.includeInFinalMap || {},
      choiceSelections: data.choiceSelections || {},
      stagedAssignments: data.stagedAssignments || [],
      finalizedAssignments: data.finalizedAssignments || [],
      collapsedSections: data.collapsedSections || null,
      updatedAt: data.updatedAt || new Date().toISOString(),
    });
    res.json({ ok: true, state: savedState, dbPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    aiConfigured: Boolean(openai),
    dbPath,
  });
});

async function generateDraftStep({
  answers,
  fieldContext,
  patientName,
  workflowId,
  meta,
  draftContextToggles = null,
  enabledDraftSections = null,
}) {
  const systemContent =
    workflowId === "assigned-nodes"
      ? ASSIGNED_NODES_SYSTEM_PROMPT
      : "You write concise DSP documentation notes. Output only JSON with keys stepKey, question, kind, and draftNote.";

  const includesCarePlan =
    Array.isArray(enabledDraftSections) &&
    enabledDraftSections.some((entry) => entry.includeCarePlanExcerpt);

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: workflowId === "assigned-nodes" ? 0 : 0.2,
    max_tokens: workflowId === "assigned-nodes" ? (includesCarePlan ? 520 : 400) : 320,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: systemContent,
      },
      {
        role: "user",
        content: buildDraftNotePrompt({
          answers,
          fieldContext,
          patientName,
          workflowId,
          workflowMeta: meta,
          draftContextToggles: draftContextToggles || {},
          enabledDraftSections,
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  const step = content ? JSON.parse(content) : null;
  if (!step?.draftNote) {
    return null;
  }

  return {
    stepKey: "draft",
    kind: "draft",
    question: "Generated documentation",
    draftNote: step.draftNote,
    followUpQuestion: String(step.followUpQuestion || "").trim(),
    prioritizedFacts: Array.isArray(step.prioritizedFacts) ? step.prioritizedFacts : [],
    usedSectionKeys: Array.isArray(step.usedSectionKeys) ? step.usedSectionKeys : [],
    noteQuality: meta?.noteQuality || "compliant",
    auditTrail: meta?.auditTrail || [],
  };
}

async function respondWithAssignedNodesDraft(request, response) {
  const {
    answers = {},
    fieldContext = {},
    patientName = "Mary Bet",
    currentNote = "",
    draftContextToggles = {},
    enabledDraftSections = [],
  } = request.body || {};

  if (!openai) {
    response.status(503).json({
      error: "OPENAI_API_KEY is not configured on the DocuWraite server.",
    });
    return;
  }

  const draftStep = await generateDraftStep({
    answers,
    fieldContext: { ...fieldContext, currentNote },
    patientName,
    workflowId: "assigned-nodes",
    meta: { noteQuality: "compliant", auditTrail: [] },
    draftContextToggles,
    enabledDraftSections,
  });

  if (!draftStep?.draftNote) {
    response.status(502).json({ error: "OpenAI did not return a draft note." });
    return;
  }

  const guidelineReview = evaluateAssignedDraftGuidelines({
    draftNote: draftStep.draftNote,
    fieldContext,
  });

  response.json({
    step: draftStep,
    meta: {
      noteQuality: draftStep.noteQuality || "compliant",
      auditTrail: draftStep.auditTrail || [],
      usedSections: draftStep.usedSectionKeys?.length
        ? draftStep.usedSectionKeys
        : Array.isArray(enabledDraftSections)
          ? enabledDraftSections.map((entry) => entry.key)
          : [],
      prioritizedFacts: draftStep.prioritizedFacts || [],
      followUpQuestion: draftStep.followUpQuestion || "",
      guidelineReview,
      guidelineWarning: guidelineReview.warning || "",
    },
  });
}

app.post("/api/docuwraite/workflow-step", async (request, response) => {
  const {
    workflowId,
    answers = {},
    fieldContext = {},
    stepIndex = 0,
    patientName = "Mary Bet",
    currentNote = "",
    forcedStepKey = null,
  } = request.body || {};

  if (workflowId === "assigned-nodes") {
    try {
      await respondWithAssignedNodesDraft(request, response);
    } catch (error) {
      response.status(500).json({
        error: error?.message || "DocuWraite could not generate the assigned-node draft.",
      });
    }
    return;
  }

  if (!isSupportedWorkflow(workflowId)) {
    response.status(400).json({ error: `Unsupported workflow: ${workflowId || "unknown"}` });
    return;
  }

  try {
    const { step, meta } = resolveWorkflowStep(
      workflowId,
      answers,
      { ...fieldContext, currentNote },
      stepIndex,
      patientName,
      forcedStepKey || null
    );

    if (!step?.question && step?.kind !== "draft") {
      response.status(502).json({ error: "DocuWraite could not resolve the next workflow step." });
      return;
    }

    if (step.stepKey !== "draft") {
      response.json({ step, meta });
      return;
    }

    if (meta?.draftBlocked) {
      response.json({ step, meta });
      return;
    }

    if (!openai) {
      response.status(503).json({
        error: "OPENAI_API_KEY is not configured on the DocuWraite server.",
      });
      return;
    }

    const draftStep = await generateDraftStep({
      answers,
      fieldContext: { ...fieldContext, currentNote },
      patientName,
      workflowId,
      meta,
    });
    response.json({
      step: draftStep || step,
      meta: {
        ...meta,
        noteQuality: draftStep?.noteQuality || meta?.noteQuality,
        auditTrail: draftStep?.auditTrail || meta?.auditTrail,
      },
    });
  } catch (error) {
    response.status(500).json({
      error: error?.message || "DocuWraite could not generate the next workflow step.",
    });
  }
});

app.listen(port, () => {
  const therap = getTherapConfig();
  console.log(`DocuWraite API listening on http://localhost:${port}`);
  console.log(`Therap mock feed: http://localhost:${port}/therap-mock (shift-feed, care-plan)`);
  console.log(
    `Therap sync mode: ${therap.mode}${therap.isConfigured ? ` → ${therap.baseUrl}` : " (demo provider until THERAP_API_BASE_URL is set)"}`
  );
});
