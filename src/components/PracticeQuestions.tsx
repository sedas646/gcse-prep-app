import { useState } from 'react';
import type { Question } from '../types';
import { useApp } from '../context/AppContext';
import { XP_REWARDS } from '../utils/xp';

interface Props {
  questions: Question[];
  topicId: string;
  subjectColor: string;
}

export default function PracticeQuestions({ questions, topicId, subjectColor }: Props) {
  const { dispatch } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [completed, setCompleted] = useState(false);

  if (questions.length === 0) {
    return <div className="text-center text-slate-400 py-12">No practice questions available yet.</div>;
  }

  const question = questions[currentIndex];
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
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setCompleted(true);
      dispatch({ type: 'ADD_XP', amount: XP_REWARDS.PRACTICE_COMPLETE });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setResults({});
    setCompleted(false);
  };

  if (completed) {
    const percent = Math.round((totalCorrect / questions.length) * 100);
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="text-5xl mb-4">{percent >= 90 ? '🌟' : percent >= 70 ? '👏' : percent >= 50 ? '👍' : '💪'}</div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Practice Complete!</h3>
        <p className="text-4xl font-bold mb-2" style={{ color: percent >= 70 ? '#22c55e' : '#ef4444' }}>
          {percent}%
        </p>
        <p className="text-slate-500 mb-1">{totalCorrect} out of {questions.length} correct</p>
        <p className="text-sm text-emerald-600 mb-6">+{XP_REWARDS.PRACTICE_COMPLETE} XP earned</p>

        <div className="flex gap-2 justify-center mb-6">
          {questions.map((_, i) => (
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

        <button
          onClick={handleRestart}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
        >
          Try Again
        </button>
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
          Question {currentIndex + 1} of {questions.length}
        </p>
        <span className={`text-xs px-2 py-1 rounded-full ${difficultyColors[question.difficulty]}`}>
          {question.difficulty}
        </span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{
            width: `${((currentIndex + (showExplanation ? 1 : 0)) / questions.length) * 100}%`,
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
            {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  );
}
