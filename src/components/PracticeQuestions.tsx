import { useState } from 'react';
import type { Question } from '../types';
import { useApp } from '../context/AppContext';
import { XP_REWARDS } from '../utils/xp';

interface Props {
  questions: Question[];
  topicId: string;
  subjectColor: string;
  /** Number of questions per practice set. If pool is smaller, all questions are used. Defaults to 10. */
  setSize?: number;
}

// Fisher-Yates shuffle (returns new array, doesn't mutate)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick a balanced subset: shuffle then try to take a mix of difficulties
function pickSet(pool: Question[], size: number): Question[] {
  if (pool.length <= size) return shuffle(pool);

  const byDifficulty: Record<string, Question[]> = {
    foundation: shuffle(pool.filter(q => q.difficulty === 'foundation')),
    intermediate: shuffle(pool.filter(q => q.difficulty === 'intermediate')),
    higher: shuffle(pool.filter(q => q.difficulty === 'higher')),
    further: shuffle(pool.filter(q => q.difficulty === 'further')),
  };

  // Aim for an even mix; fall back to whatever is available
  const targets: Record<string, number> = {
    foundation: Math.ceil(size * 0.3),
    intermediate: Math.ceil(size * 0.3),
    higher: Math.ceil(size * 0.3),
    further: Math.ceil(size * 0.1),
  };

  const picked: Question[] = [];
  for (const diff of ['foundation', 'intermediate', 'higher', 'further']) {
    const take = byDifficulty[diff].splice(0, targets[diff]);
    picked.push(...take);
  }

  // Top up with leftovers if we're short
  const leftover = shuffle(pool.filter(q => !picked.includes(q)));
  while (picked.length < size && leftover.length) picked.push(leftover.shift()!);

  return shuffle(picked).slice(0, size);
}

export default function PracticeQuestions({ questions, topicId, subjectColor, setSize = 10 }: Props) {
  const { dispatch } = useApp();
  const poolSize = questions.length;
  const renewable = poolSize > setSize;

  const [activeSet, setActiveSet] = useState<Question[]>(() => pickSet(questions, setSize));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [completed, setCompleted] = useState(false);
  const [setsCompleted, setSetsCompleted] = useState(0);

  if (poolSize === 0) {
    return <div className="text-center text-slate-400 py-12">No practice questions available yet.</div>;
  }

  const question = activeSet[currentIndex];
  const totalCorrect = Object.values(results).filter(Boolean).length;

  const handleAnswer = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    const correct = answerIndex === question.correctAnswer;
    setResults(prev => ({ ...prev, [currentIndex]: correct }));

    dispatch({ type: 'ANSWER_QUESTION', correct });
    dispatch({
      type: 'SET_TOPIC_PROGRESS',
      topicId,
      progress: {
        questionsAttempted: (Object.keys(results).length + 1),
        questionsCorrect: totalCorrect + (correct ? 1 : 0),
      },
    });
  };

  const handleNext = () => {
    if (currentIndex < activeSet.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setCompleted(true);
      dispatch({ type: 'ADD_XP', amount: XP_REWARDS.PRACTICE_COMPLETE });
    }
  };

  const startNewSet = () => {
    setActiveSet(pickSet(questions, setSize));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setResults({});
    setCompleted(false);
    setSetsCompleted(prev => prev + 1);
  };

  if (completed) {
    const percent = Math.round((totalCorrect / activeSet.length) * 100);
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="text-5xl mb-4">{percent >= 90 ? '🌟' : percent >= 70 ? '👏' : percent >= 50 ? '👍' : '💪'}</div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Practice Set Complete!</h3>
        <p className="text-4xl font-bold mb-2" style={{ color: percent >= 70 ? '#22c55e' : '#ef4444' }}>
          {percent}%
        </p>
        <p className="text-slate-500 mb-1">{totalCorrect} out of {activeSet.length} correct</p>
        <p className="text-sm text-emerald-600 mb-2">+{XP_REWARDS.PRACTICE_COMPLETE} XP earned</p>
        {setsCompleted > 0 && (
          <p className="text-xs text-slate-400 mb-4">Sets completed this session: {setsCompleted + 1}</p>
        )}

        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {activeSet.map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                results[i] ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {results[i] ? '✓' : '✗'}
            </div>
          ))}
        </div>

        {renewable ? (
          <div className="space-y-2">
            <button
              onClick={startNewSet}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              🎲 New Practice Set ({setSize} fresh questions)
            </button>
            <p className="text-xs text-slate-400">{poolSize} questions available — randomly drawn each round</p>
          </div>
        ) : (
          <button
            onClick={startNewSet}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  const difficultyColors: Record<string, string> = {
    foundation: 'bg-green-100 text-green-700',
    intermediate: 'bg-blue-100 text-blue-700',
    higher: 'bg-purple-100 text-purple-700',
    further: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Question {currentIndex + 1} of {activeSet.length}
          {renewable && <span className="ml-2 text-xs text-indigo-500">(set {setsCompleted + 1} • {poolSize} in pool)</span>}
        </p>
        <span className={`text-xs px-2 py-1 rounded-full ${difficultyColors[question.difficulty]}`}>
          {question.difficulty}
        </span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{
            width: `${((currentIndex + (showExplanation ? 1 : 0)) / activeSet.length) * 100}%`,
            backgroundColor: subjectColor,
          }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <p className="text-lg font-medium text-slate-800 mb-6">{question.question}</p>

        <div className="space-y-2">
          {question.options.map((option, i) => {
            let btnClass = 'w-full p-4 rounded-lg text-left text-sm font-medium transition-all border-2 ';

            if (showExplanation) {
              if (i === question.correctAnswer) {
                btnClass += 'bg-emerald-50 border-emerald-400 text-emerald-800';
              } else if (i === selectedAnswer) {
                btnClass += 'bg-red-50 border-red-400 text-red-800';
              } else {
                btnClass += 'bg-slate-50 border-slate-200 text-slate-400';
              }
            } else {
              btnClass += 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer text-slate-700';
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={showExplanation}
                className={btnClass}
              >
                <span className="inline-flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                  {showExplanation && i === question.correctAnswer && <span className="ml-auto">✓</span>}
                  {showExplanation && i === selectedAnswer && i !== question.correctAnswer && <span className="ml-auto">✗</span>}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className={`mt-4 p-4 rounded-lg ${
            selectedAnswer === question.correctAnswer
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-amber-50 border border-amber-200'
          }`}>
            <p className="text-sm font-semibold mb-1">
              {selectedAnswer === question.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
            </p>
            <p className="text-sm text-slate-700">{question.explanation}</p>
          </div>
        )}

        {showExplanation && (
          <button
            onClick={handleNext}
            className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            {currentIndex === activeSet.length - 1 ? 'See Results' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  );
}
