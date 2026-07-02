export const MICRO_LEARNING_BADGE_THRESHOLD = 1;

export function summariseMicroLearningModule(module = {}) {
  return normaliseMicroLearningModule(module);
}

export function scoreMicroLearningModule(module = {}, answers = {}) {
  const safeModule = normaliseMicroLearningModule(module);
  const questionResults = safeModule.questions.map((question) => {
    const selectedIndex = normaliseAnswerIndex(answers[question.id]);
    const isCorrect = selectedIndex === question.correctIndex;
    const pointsAwarded = isCorrect ? question.points : 0;

    return {
      questionId: question.id,
      selectedIndex,
      correctIndex: question.correctIndex,
      isCorrect,
      pointsAwarded,
      explanation: question.explanation,
      prompt: question.prompt
    };
  });

  const score = questionResults.reduce((total, result) => total + result.pointsAwarded, 0);
  const maxScore = safeModule.questions.reduce((total, question) => total + question.points, 0);
  const correctAnswers = questionResults.filter((result) => result.isCorrect).length;
  const badgeEarned = maxScore > 0 && score >= maxScore * MICRO_LEARNING_BADGE_THRESHOLD;

  return {
    moduleId: safeModule.id,
    title: safeModule.title,
    score,
    maxScore,
    pointsEarned: score,
    correctAnswers,
    totalQuestions: safeModule.questionCount,
    badgeEarned,
    badgeLabel: badgeEarned ? `${safeModule.title} badge` : '',
    questionResults
  };
}

function normaliseMicroLearningModule(module = {}) {
  const questions = Array.isArray(module.questions)
    ? module.questions.map((question, index) => normaliseQuestion(question, index)).filter(Boolean)
    : [];

  return {
    id: safeText(module.id, 'unknown-module'),
    title: safeText(module.title, 'Untitled module'),
    ward: safeText(module.ward, 'Unknown ward'),
    trust: safeText(module.trust, 'Unknown trust'),
    professions: uniqueStrings(Array.isArray(module.professions) ? module.professions : []),
    topic: safeText(module.topic, 'general learning'),
    format: normaliseFormat(module.format),
    questions,
    questionCount: questions.length
  };
}

function normaliseQuestion(question = {}, index = 0) {
  if (!question || typeof question !== 'object' || Array.isArray(question)) {
    return null;
  }

  const options = Array.isArray(question.options)
    ? question.options.map((option) => safeText(option, '')).filter(Boolean)
    : [];
  const correctIndex = Number.isInteger(question.correctIndex) ? question.correctIndex : 0;
  const points = Number.isFinite(Number(question.points)) && Number(question.points) > 0
    ? Number(question.points)
    : 1;

  return {
    id: safeText(question.id, `question-${index + 1}`),
    prompt: safeText(question.prompt, 'Untitled question'),
    options,
    correctIndex: options.length > 0 ? clamp(correctIndex, 0, options.length - 1) : 0,
    points,
    explanation: safeText(question.explanation, '')
  };
}

function normaliseAnswerIndex(answer) {
  const numeric = Number(answer);
  return Number.isInteger(numeric) ? numeric : -1;
}

function normaliseFormat(value) {
  const text = safeText(value, 'micro').toLowerCase();
  return text === 'course' ? 'course' : 'micro';
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => safeText(value, '')).filter(Boolean))];
}

function safeText(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const text = value.trim();
  return text || fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
