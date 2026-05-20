/**
 * Enterprise documentation platform — modular layers.
 * Schedule → Workflow → Category → Depth → Branching → Assignment → DSP Runtime
 * Cross-system overlays, escalation, and AI review sit beside (not inside) workflows.
 */

export * from "./scheduleLayer.js";
export * from "./workflowEngine.js";
export * from "./categorySystem.js";
export * from "./depthSystem.js";
export * from "./branchingEngine.js";
export * from "./assignmentEngine.js";
export * from "./filteringArchitecture.js";
export * from "./crossSystemEngine.js";
export * from "./escalationEngine.js";
export * from "./smartSelectAssistant.js";
export * from "./dspRuntimePack.js";
export * from "./aiReviewLayer.js";

export const PLATFORM_LAYERS = [
  { id: "schedule", name: "Schedule Layer", module: "./scheduleLayer.js" },
  { id: "workflow", name: "Workflow Engine", module: "./workflowEngine.js" },
  { id: "category", name: "Category System", module: "./categorySystem.js" },
  { id: "depth", name: "Depth System", module: "./depthSystem.js" },
  { id: "branching", name: "Branching Engine", module: "./branchingEngine.js" },
  { id: "assignment", name: "Assignment Engine", module: "./assignmentEngine.js" },
  { id: "dsp-runtime", name: "DSP Runtime Pack", module: "./dspRuntimePack.js" },
  { id: "cross-system", name: "Cross-System Intelligence", module: "./crossSystemEngine.js" },
  { id: "smart-select", name: "Smart Select Assistant", module: "./smartSelectAssistant.js" },
  { id: "escalation", name: "Escalation Engine", module: "./escalationEngine.js" },
  { id: "ai-review", name: "AI Review Layer", module: "./aiReviewLayer.js" },
  { id: "filtering", name: "Filtering Architecture", module: "./filteringArchitecture.js" },
];
