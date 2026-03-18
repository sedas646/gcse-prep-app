import { useState } from 'react';
import type { Flashcard } from '../types';
import { useApp } from '../context/AppContext';
import { XP_REWARDS } from '../utils/xp';

interface Props {
  flashcards: Flashcard[];
  topicId: string;
}

export default function Flashcards({ flashcards, topicId }: Props) {
  const { state, dispatch } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(new Set<number>());

  const progress = state.topicProgress[topicId];
  const alreadyReviewed = progress?.flashcardsReviewed || false;

  const handleFlip = () => setFlipped(!flipped);

  const handleNext = () => {
    const newReviewed = new Set(reviewed);
    newReviewed.add(currentIndex);
    setReviewed(newReviewed);
    setFlipped(false);

    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (!alreadyReviewed && newReviewed.size === flashcards.length) {
      dispatch({ type: 'SET_TOPIC_PROGRESS', topicId, progress: { flashcardsReviewed: true } });
      dispatch({ type: 'ADD_XP', amount: XP_REWARDS.FLASHCARD_REVIEW });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setFlipped(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (flashcards.length === 0) {
    return <div className="text-center text-slate-400 py-12">No flashcards available for this topic yet.</div>;
  }

  const card = flashcards[currentIndex];
  const allDone = reviewed.size === flashcards.length || alreadyReviewed;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-500">
          Card {currentIndex + 1} of {flashcards.length}
        </p>
        {alreadyReviewed && <span className="text-sm text-emerald-600">✅ Set completed</span>}
      </div>

      {/* Progress dots */}
      <div className="flex gap-1 justify-center">
        {flashcards.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === currentIndex
                ? 'bg-indigo-500'
                : reviewed.has(i) || alreadyReviewed
                ? 'bg-emerald-400'
                : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Flashcard */}
      <div className="flashcard h-64 cursor-pointer" onClick={handleFlip}>
        <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
          <div className="flashcard-front bg-white border-2 border-slate-200 shadow-sm">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-2">Question</p>
              <p className="text-lg font-medium text-slate-700">{card.front}</p>
              <p className="text-xs text-slate-400 mt-4">Click to reveal answer</p>
            </div>
          </div>
          <div className="flashcard-back bg-indigo-50 border-2 border-indigo-200">
            <div className="text-center">
              <p className="text-xs text-indigo-400 mb-2">Answer</p>
              <p className="text-lg font-medium text-indigo-800">{card.back}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium disabled:opacity-30 hover:bg-slate-50"
        >
          ← Previous
        </button>
        <button
          onClick={handleNext}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          {currentIndex === flashcards.length - 1 ? (allDone ? 'Done ✓' : 'Complete Set') : 'Next →'}
        </button>
      </div>

      {allDone && !alreadyReviewed && (
        <p className="text-center text-sm text-emerald-600 font-medium">
          🎉 All cards reviewed! +{XP_REWARDS.FLASHCARD_REVIEW} XP
        </p>
      )}
    </div>
  );
}
