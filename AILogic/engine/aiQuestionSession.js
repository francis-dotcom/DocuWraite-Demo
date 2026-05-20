function getAnswerValue(answers = {}, questionId = "") {
  return answers[questionId];
}

function includesSelection(answerValue, targetValue) {
  if (Array.isArray(answerValue)) {
    return answerValue.includes(targetValue);
  }
  return answerValue === targetValue;
}

function isAnswered(answerValue) {
  if (Array.isArray(answerValue)) {
    return answerValue.length > 0;
  }
  return answerValue !== undefined && answerValue !== null && String(answerValue).trim() !== "";
}

function shouldAskQuestion(question = {}, answers = {}) {
  if (question.requiredWhen) {
    const parentValue = getAnswerValue(answers, question.requiredWhen.questionId);
    return parentValue === question.requiredWhen.equals;
  }

  if (question.requiredWhenIncludes) {
    const parentValue = getAnswerValue(answers, question.requiredWhenIncludes.questionId);
    return includesSelection(parentValue, question.requiredWhenIncludes.value);
  }

  return true;
}

function buildFollowUpQuestion(parentQuestion = {}, followUpRule = {}) {
  return {
    id: `${parentQuestion.id}__followup__${String(followUpRule.ask || "detail")}`,
    type: "free_text",
    required: true,
    sourceQuestionId: parentQuestion.id,
    followUpRule,
    label: followUpRule.ask || "Provide additional detail.",
  };
}

function getPendingFollowUp(question = {}, answers = {}) {
  const followUpRules = Array.isArray(question.followUpRules) ? question.followUpRules : [];
  if (!followUpRules.length) {
    return null;
  }

  const answerValue = getAnswerValue(answers, question.id);
  if (!isAnswered(answerValue)) {
    return null;
  }

  for (const rule of followUpRules) {
    const shouldTrigger =
      (rule.when && answerValue === rule.when) ||
      (rule.whenIncludes && includesSelection(answerValue, rule.whenIncludes));
    if (!shouldTrigger) {
      continue;
    }

    const followUpQuestion = buildFollowUpQuestion(question, rule);
    if (!isAnswered(getAnswerValue(answers, followUpQuestion.id))) {
      return followUpQuestion;
    }
  }

  return null;
}

function getNextAiQuestion(logic, answers = {}) {
  const sequence = logic?.rules?.sequence || [];
  const questionsById = logic?.rules?.questionsById || {};

  for (const questionId of sequence) {
    const question = questionsById[questionId];
    if (!question || !shouldAskQuestion(question, answers)) {
      continue;
    }

    const questionAnswer = getAnswerValue(answers, question.id);
    if (!isAnswered(questionAnswer)) {
      if (!question.required) {
        continue;
      }
      return question;
    }

    const pendingFollowUp = getPendingFollowUp(question, answers);
    if (pendingFollowUp) {
      return pendingFollowUp;
    }
  }

  return null;
}

function isAiQuestionSessionComplete(logic, answers = {}) {
  return !getNextAiQuestion(logic, answers);
}

module.exports = {
  getNextAiQuestion,
  isAiQuestionSessionComplete,
};
