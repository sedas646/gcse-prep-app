export const XP_REWARDS = {
  EXPLANATION_READ: 10,
  FLASHCARD_REVIEW: 15,
  PRACTICE_COMPLETE: 20,
  CHECKPOINT_PASS: 100,
  CHECKPOINT_FAIL: 25,
  DAILY_CHALLENGE: 25,
  DAILY_CHALLENGE_CORRECT: 25,
  VIDEO_SUMMARY: 15,
  DIAGNOSTIC_COMPLETE: 50,
} as const;

export const XP_PER_LEVEL = 500;

export function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpForCurrentLevel(xp: number): number {
  return xp % XP_PER_LEVEL;
}

export function xpToNextLevel(xp: number): number {
  return XP_PER_LEVEL - xpForCurrentLevel(xp);
}

export function levelProgress(xp: number): number {
  return (xpForCurrentLevel(xp) / XP_PER_LEVEL) * 100;
}
