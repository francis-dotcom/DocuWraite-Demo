const { AI_LOGIC_REGISTRY } = require("./aiLogicResolver");

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
  const entry = AI_LOGIC_REGISTRY[logicFilePath];
  ensure(entry, `AI logic file not found: ${logicFilePath}`);

  const parsed = entry.raw;
  REQUIRED_LAYERS.forEach((layer) => ensure(parsed[layer], `Missing required layer "${layer}" in ${entry.source}`));

  const rules = parsed.layer2_questionRules || {};
  const sequence = Array.isArray(rules.sequence) ? rules.sequence : [];
  const questions = Array.isArray(rules.questions) ? rules.questions : [];
  ensure(sequence.length > 0, `Missing question sequence in ${entry.source}`);
  ensure(questions.length > 0, `Missing question definitions in ${entry.source}`);

  const questionsById = Object.fromEntries(questions.map((question) => [question.id, question]));
  sequence.forEach((questionId) =>
    ensure(questionsById[questionId], `Question sequence references unknown id "${questionId}" in ${entry.source}`)
  );

  return {
    path: entry.key,
    source: entry.source,
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
