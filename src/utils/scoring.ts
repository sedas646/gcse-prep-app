import type { Question } from '../types';

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  topicBreakdown: Record<string, { correct: number; total: number }>;
  timeTaken: number;
}

export function scoreQuiz(
  questions: Question[],
  answers: Record<string, number>,
  startTime: number
): QuizResult {
  let correct = 0;
  const topicBreakdown: Record<string, { correct: number; total: number }> = {};

  for (const q of questions) {
    if (!topicBreakdown[q.topicId]) {
      topicBreakdown[q.topicId] = { correct: 0, total: 0 };
    }
    topicBreakdown[q.topicId].total++;

    if (answers[q.id] === q.correctAnswer) {
      correct++;
      topicBreakdown[q.topicId].correct++;
    }
  }

  return {
    totalQuestions: questions.length,
    correctAnswers: correct,
    percentage: Math.round((correct / questions.length) * 100),
    topicBreakdown,
    timeTaken: Date.now() - startTime,
  };
}

export function identifyWeakTopics(
  topicBreakdown: Record<string, { correct: number; total: number }>,
  threshold = 0.6
): string[] {
  return Object.entries(topicBreakdown)
    .filter(([, { correct, total }]) => correct / total < threshold)
    .map(([topicId]) => topicId);
}

export function identifyStrongTopics(
  topicBreakdown: Record<string, { correct: number; total: number }>,
  threshold = 0.8
): string[] {
  return Object.entries(topicBreakdown)
    .filter(([, { correct, total }]) => correct / total >= threshold)
    .map(([topicId]) => topicId);
}
