const fs = require("fs");
const path = require("path");

const REQUIRED_LAYERS = [
  "layer1_categoryMetadata",
  "layer2_questionRules",
  "layer3_noteGenerationContext",
];

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadAiLogic(logicFilePath) {
  const resolvedPath = path.resolve(logicFilePath);
  ensure(fs.existsSync(resolvedPath), `AI logic file not found: ${resolvedPath}`);

  const raw = fs.readFileSync(resolvedPath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse AI logic JSON at ${resolvedPath}: ${error.message}`);
  }

  REQUIRED_LAYERS.forEach((layer) => ensure(parsed[layer], `Missing required layer "${layer}" in ${resolvedPath}`));

  const rules = parsed.layer2_questionRules || {};
  const sequence = Array.isArray(rules.sequence) ? rules.sequence : [];
  const questions = Array.isArray(rules.questions) ? rules.questions : [];
  ensure(sequence.length > 0, `Missing question sequence in ${resolvedPath}`);
  ensure(questions.length > 0, `Missing question definitions in ${resolvedPath}`);

  const questionsById = Object.fromEntries(questions.map((question) => [question.id, question]));
  sequence.forEach((questionId) =>
    ensure(questionsById[questionId], `Question sequence references unknown id "${questionId}" in ${resolvedPath}`)
  );

  return {
    path: resolvedPath,
    raw: parsed,
    meta: parsed.layer1_categoryMetadata,
    rules: {
      ...rules,
      questions,
      questionsById,
    },
    noteContext: parsed.layer3_noteGenerationContext,
  };
}

module.exports = {
  loadAiLogic,
};
