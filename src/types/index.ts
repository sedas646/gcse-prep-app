export interface Question {
  id: string;
  topicId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'foundation' | 'intermediate' | 'higher' | 'further';
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  videoId: string;
  channel: string;
}

export interface Topic {
  id: string;
  unitId: string;
  name: string;
  description: string;
  explanation: string;
  keyPoints: string[];
  flashcards: Flashcard[];
  videos: YouTubeVideo[];
  questions: Question[];
  summerTerm?: boolean;
}

export interface Unit {
  id: string;
  subjectId: string;
  name: string;
  topics: Topic[];
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  examBoard: string;
  specification: string;
  units: Unit[];
  diagnosticQuestions: Question[];
}

export interface TopicProgress {
  topicId: string;
  questionsAttempted: number;
  questionsCorrect: number;
  masteryPercent: number;
  flashcardsReviewed: boolean;
  explanationRead: boolean;
  videoSummaries: Record<string, string>;
  lastAttempted: string;
}

export interface CheckpointResult {
  id: string;
  subjectId: string;
  date: string;
  score: number;
  totalQuestions: number;
  topicBreakdown: Record<string, { correct: number; total: number }>;
  timeTaken: number;
}

export interface DiagnosticResult {
  subjectId: string;
  date: string;
  score: number;
  totalQuestions: number;
  topicScores: Record<string, { correct: number; total: number }>;
  weakTopics: string[];
  strongTopics: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
}

export interface DailyChallenge {
  date: string;
  question: Question;
  answered: boolean;
  correct: boolean;
}

export interface UserState {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  topicProgress: Record<string, TopicProgress>;
  checkpointResults: CheckpointResult[];
  diagnosticResults: DiagnosticResult[];
  badges: Badge[];
  dailyChallenges: Record<string, DailyChallenge>;
  savedVideos: Record<string, YouTubeVideo[]>;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
}

export type MasteryLevel = 'not-started' | 'red' | 'amber' | 'green' | 'gold';

export function getMasteryLevel(percent: number): MasteryLevel {
  if (percent === 0) return 'not-started';
  if (percent < 40) return 'red';
  if (percent < 70) return 'amber';
  if (percent < 90) return 'green';
  return 'gold';
}

export function getMasteryColor(level: MasteryLevel): string {
  switch (level) {
    case 'not-started': return 'bg-gray-200 text-gray-500';
    case 'red': return 'bg-red-100 text-red-700 border-red-300';
    case 'amber': return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'green': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    case 'gold': return 'bg-yellow-100 text-yellow-700 border-yellow-400';
  }
}
