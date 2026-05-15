const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const { isSupportedWorkflow } = require("./playbooks");
const { resolveWorkflowStep } = require("./playbookEngine");
const { buildDraftNotePrompt } = require("./draftPrompt");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const port = Number(process.env.DOCUWRAITE_API_PORT || 8787);
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    aiConfigured: Boolean(openai),
  });
});

async function generateDraftStep({ answers, fieldContext, patientName, workflowId, meta }) {
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 320,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You write concise DSP documentation notes. Output only JSON with keys stepKey, question, kind, and draftNote.",
      },
      {
        role: "user",
        content: buildDraftNotePrompt({
          answers,
          fieldContext,
          patientName,
          workflowId,
          workflowMeta: meta,
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
    noteQuality: meta?.noteQuality || "compliant",
    auditTrail: meta?.auditTrail || [],
  };
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
  console.log(`DocuWraite API listening on http://localhost:${port}`);
});
