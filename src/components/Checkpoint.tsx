import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getSubjectById } from '../data/index';
import { scoreQuiz } from '../utils/scoring';
import { XP_REWARDS } from '../utils/xp';
import type { Question } from '../types';

export default function Checkpoint() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const subject = getSubjectById(subjectId || '');
  if (!subject) return <div className="p-8 text-center text-slate-500">Subject not found.</div>;

  const allQuestions = subject.units.flatMap(u => u.topics.flatMap(t => t.questions));

  // Select 20 random questions for checkpoint
  const [questions] = useState<Question[]>(() => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(20, shuffled.length));
  });

  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [result, setResult] = useState<ReturnType<typeof scoreQuiz> | null>(null);

  useEffect(() => {
    if (!started || result) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishCheckpoint();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, result]);

  const finishCheckpoint = () => {
    const quizResult = scoreQuiz(questions, answers, startTime);
    setResult(quizResult);

    const passed = quizResult.percentage >= 70;
    dispatch({
      type: 'ADD_CHECKPOINT_RESULT',
      result: {
        id: `cp-${Date.now()}`,
        subjectId: subject.id,
        date: new Date().toISOString(),
        score: quizResult.correctAnswers,
        totalQuestions: quizResult.totalQuestions,
        topicBreakdown: quizResult.topicBreakdown,
        timeTaken: quizResult.timeTaken,
      },
    });
    dispatch({ type: 'ADD_XP', amount: passed ? XP_REWARDS.CHECKPOINT_PASS : XP_REWARDS.CHECKPOINT_FAIL });

    if (quizResult.percentage >= 90) {
      dispatch({ type: 'EARN_BADGE', badgeId: 'checkpoint-90' });
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    const correct = answerIndex === questions[currentIndex].correctAnswer;
    const newAnswers = { ...answers, [questions[currentIndex].id]: answerIndex };
    setAnswers(newAnswers);
    dispatch({ type: 'ANSWER_QUESTION', correct });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      finishCheckpoint();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!started) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <span className="text-5xl mb-4 block">📋</span>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{subject.name} GCSE Checkpoint</h1>
          <p className="text-slate-500 mb-6">
            A timed GCSE-style assessment covering topics from across the {subject.name} curriculum.
            Test yourself under exam conditions!
          </p>
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-400">Questions:</span> <strong>{questions.length}</strong></div>
              <div><span className="text-slate-400">Time limit:</span> <strong>30 minutes</strong></div>
              <div><span className="text-slate-400">Pass mark:</span> <strong>70%</strong></div>
              <div><span className="text-slate-400">XP (pass):</span> <strong>+{XP_REWARDS.CHECKPOINT_PASS}</strong></div>
            </div>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 text-lg"
          >
            Start Checkpoint
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    const allTopics = subject.units.flatMap(u => u.topics);
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">
              {result.percentage >= 90 ? '🌟' : result.percentage >= 70 ? '✅' : result.percentage >= 50 ? '📈' : '💪'}
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Checkpoint Complete!</h2>
            <p className="text-5xl font-bold my-4" style={{ color: result.percentage >= 70 ? '#22c55e' : '#ef4444' }}>
              {result.percentage}%
            </p>
            <p className="text-slate-500">
              {result.correctAnswers}/{result.totalQuestions} correct •
              Time: {formatTime(Math.floor(result.timeTaken / 1000))}
            </p>
            <p className={`text-sm font-medium mt-2 ${result.percentage >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {result.percentage >= 70 ? `✅ PASSED! +${XP_REWARDS.CHECKPOINT_PASS} XP` : `Keep going! +${XP_REWARDS.CHECKPOINT_FAIL} XP`}
            </p>
          </div>

          <h3 className="font-semibold text-slate-700 mb-3">Topic Breakdown</h3>
          <div className="space-y-2 mb-6">
            {Object.entries(result.topicBreakdown).map(([tId, { correct, total }]) => {
              const topic = allTopics.find(t => t.id === tId);
              const pct = Math.round((correct / total) * 100);
              return (
                <div key={tId} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 text-slate-600">{topic?.name || tId}</span>
                  <span className={`font-medium ${pct >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {correct}/{total}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(`/subject/${subject.id}`)}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Back to {subject.name}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">{subject.icon} Checkpoint</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{currentIndex + 1}/{questions.length}</span>
          <span className={`text-sm font-mono font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-slate-600'}`}>
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, backgroundColor: subject.color }}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <p className="text-lg font-medium text-slate-800 mb-6">{question.question}</p>

        <div className="space-y-2">
          {question.options.map((option, i) => {
            let btnClass = 'w-full p-4 rounded-lg text-left text-sm font-medium transition-all border-2 ';
            if (showExplanation) {
              if (i === question.correctAnswer) btnClass += 'bg-emerald-50 border-emerald-400 text-emerald-800';
              else if (i === selectedAnswer) btnClass += 'bg-red-50 border-red-400 text-red-800';
              else btnClass += 'bg-slate-50 border-slate-200 text-slate-400';
            } else {
              btnClass += 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer text-slate-700';
            }
            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={showExplanation} className={btnClass}>
                <span className="inline-flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <>
            <div className={`mt-4 p-4 rounded-lg ${
              selectedAnswer === question.correctAnswer
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-amber-50 border border-amber-200'
            }`}>
              <p className="text-sm">{question.explanation}</p>
            </div>
            <button
              onClick={handleNext}
              className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
