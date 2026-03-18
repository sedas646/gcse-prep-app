import type { UserState } from '../types';

const STORAGE_KEY = 'aceprep-gcse-state';

export function getDefaultState(): UserState {
  return {
    xp: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    topicProgress: {},
    checkpointResults: [],
    diagnosticResults: [],
    badges: getDefaultBadges(),
    dailyChallenges: {},
    savedVideos: {},
    totalQuestionsAnswered: 0,
    totalCorrectAnswers: 0,
  };
}

export function loadState(): UserState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...getDefaultState(), ...JSON.parse(saved) };
    }
  } catch { /* ignore */ }
  return getDefaultState();
}

export function saveState(state: UserState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function getDefaultBadges() {
  return [
    { id: 'first-steps', name: 'First Steps', description: 'Complete your first topic', icon: '👣', earned: false },
    { id: 'quiz-whiz', name: 'Quiz Whiz', description: 'Answer 50 questions correctly', icon: '🧠', earned: false },
    { id: 'streak-3', name: 'On a Roll', description: '3-day streak', icon: '🔥', earned: false },
    { id: 'streak-7', name: 'Streak Star', description: '7-day streak', icon: '⭐', earned: false },
    { id: 'streak-30', name: 'Daily Devotion', description: '30-day streak', icon: '💎', earned: false },
    { id: 'checkpoint-90', name: 'Checkpoint Champion', description: 'Score 90%+ on a checkpoint', icon: '🏆', earned: false },
    { id: 'subject-master', name: 'Subject Master', description: '100% mastery in any subject', icon: '👑', earned: false },
    { id: 'science-triple', name: 'Science Triple Threat', description: 'Complete all three sciences', icon: '🔬', earned: false },
    { id: 'daily-10', name: 'Challenge Accepted', description: 'Complete 10 daily challenges', icon: '🎯', earned: false },
    { id: 'xp-1000', name: 'XP Hunter', description: 'Earn 1000 XP', icon: '💰', earned: false },
    { id: 'xp-5000', name: 'XP Master', description: 'Earn 5000 XP', icon: '🌟', earned: false },
    { id: 'perfect-quiz', name: 'Perfect Score', description: 'Get 100% on any quiz', icon: '💯', earned: false },
    { id: 'flashcard-fan', name: 'Flashcard Fan', description: 'Review 100 flashcards', icon: '📇', earned: false },
    { id: 'video-scholar', name: 'Video Scholar', description: 'Write 10 video summaries', icon: '🎬', earned: false },
    { id: 'all-diagnostics', name: 'Fully Diagnosed', description: 'Complete all 6 diagnostic tests', icon: '🩺', earned: false },
    { id: 'level-10', name: 'Level 10', description: 'Reach level 10', icon: '🎖️', earned: false },
    { id: 'level-25', name: 'Level 25', description: 'Reach level 25', icon: '🏅', earned: false },
  ];
}
