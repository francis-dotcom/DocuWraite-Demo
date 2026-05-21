function shuffleArray(items = []) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function buildValidationQuizQuestions(session, helpers = {}) {
  const {
    getWorkflowEyebrow = () => "",
    assistanceScoreOptions = [],
  } = helpers;

  const questions = [];
  const timeBlocks = session.timeBlocks || [];
  const rows = session.rows || [];
  const supportChoices = assistanceScoreOptions.filter((item) => item !== "Refused" && item !== "Not needed");
  const styleOptions = ["Technical", "Clinical summary", "Supervisor handoff", "Concise narrative", "Family-safe summary"];
  const summaryText = String(session.shiftSummary || "").trim();
  const finalStyle = String(session.caseNoteAttestation?.style || "").trim();

  const scoredBlocks = timeBlocks.filter(
    (block) => String(block.comment || "").trim() && String(block.score || "").trim()
  );
  const notedRows = rows.filter(
    (row) => String(row.comment || "").trim() && String(row.description || "").trim()
  );

  scoredBlocks.forEach((block) => {
    const distractors = shuffleArray(
      [...new Set(scoredBlocks.map((entry) => String(entry.score || "").trim()).filter(Boolean).concat(supportChoices))]
        .filter((item) => item && item !== block.score)
    ).slice(0, 3);
    questions.push({
      id: `quiz-block-${block.id}`,
      source: "Time block note",
      prompt: `For the ${block.label} block, what support level or status was documented?`,
      noteExcerpt: String(block.comment || "").trim(),
      correctAnswer: String(block.score || "").trim(),
      choices: shuffleArray([String(block.score || "").trim(), ...distractors]).slice(0, 4),
    });
  });

  notedRows.forEach((row) => {
    const rowLabel = getWorkflowEyebrow(String(row.baseWorkflowId || row.workflowId || "").trim());
    const rowScore = String(row.score || "").trim();
    if (rowScore) {
      const distractors = shuffleArray(
        [...new Set(notedRows.map((entry) => String(entry.score || "").trim()).filter(Boolean).concat(supportChoices))]
          .filter((item) => item && item !== rowScore)
      ).slice(0, 3);
      questions.push({
        id: `quiz-row-score-${row.id}`,
        source: "Row note",
        prompt: "What support level or status was documented for this row note?",
        noteExcerpt: String(row.comment || "").trim(),
        correctAnswer: rowScore,
        choices: shuffleArray([rowScore, ...distractors]).slice(0, 4),
      });
      return;
    }

    const workflowChoices = shuffleArray(
      [
        ...new Set(
          notedRows
            .map((entry) => getWorkflowEyebrow(String(entry.baseWorkflowId || entry.workflowId || "").trim()))
            .filter(Boolean)
            .concat(["ADL", "Behavior Support", "Meal Support", "Medication", "Communication"])
        ),
      ].filter((item) => item && item !== rowLabel)
    ).slice(0, 3);
    if (rowLabel) {
      questions.push({
        id: `quiz-row-${row.id}`,
        source: "Row note",
        prompt: "Which workflow area does this row note belong to?",
        noteExcerpt: String(row.comment || "").trim(),
        correctAnswer: rowLabel,
        choices: shuffleArray([rowLabel, ...workflowChoices]).slice(0, 4),
      });
    }
  });

  if (summaryText && finalStyle) {
    const styleChoices = shuffleArray(styleOptions.filter((item) => item !== finalStyle)).slice(0, 3);
    questions.push({
      id: "quiz-summary-style",
      source: "Final summary",
      prompt: "What final note style was selected for this case note?",
      noteExcerpt: summaryText,
      correctAnswer: finalStyle,
      choices: shuffleArray([finalStyle, ...styleChoices]).slice(0, 4),
    });
  }

  return questions;
}
