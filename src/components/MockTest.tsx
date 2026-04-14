import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getSubjectById } from '../data/index';
import { getMockTestBySubject } from '../data/mockTests';
import { scoreQuiz } from '../utils/scoring';
import { XP_REWARDS } from '../utils/xp';
import type { Question } from '../types';

export default function MockTest() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const subject = getSubjectById(subjectId || '');
  const mockTest = getMockTestBySubject(subjectId || '');

  if (!subject || !mockTest) return <div className="p-8 text-center text-slate-500">Mock test not found.</div>;

  // Generate a fresh shuffled set of 30 questions each attempt
  const [questions] = useState<Question[]>(() => {
    // Gather all questions from the subject's topics
    const subjectQuestions = subject.units.flatMap(u => u.topics.flatMap(t => t.questions));
    // Combine with the dedicated mock test questions
    const allPool = [...mockTest.questions];
    const mockIds = new Set(allPool.map(q => q.id));
    for (const q of subjectQuestions) {
      if (!mockIds.has(q.id)) {
        allPool.push(q);
        mockIds.add(q.id);
      }
    }
    // Shuffle using Fisher-Yates
    const shuffled = [...allPool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Pick 30 with balanced difficulty: 10 foundation, 10 intermediate, 7 higher, 3 further
    const byDiff: Record<string, Question[]> = { foundation: [], intermediate: [], higher: [], further: [] };
    for (const q of shuffled) {
      if (byDiff[q.difficulty]) byDiff[q.difficulty].push(q);
    }
    const picked: Question[] = [
      ...byDiff.foundation.slice(0, 10),
      ...byDiff.intermediate.slice(0, 10),
      ...byDiff.higher.slice(0, 7),
      ...byDiff.further.slice(0, 3),
    ];
    // Fill remaining slots if any difficulty bucket was short
    const pickedIds = new Set(picked.map(q => q.id));
    for (const q of shuffled) {
      if (picked.length >= 30) break;
      if (!pickedIds.has(q.id)) {
        picked.push(q);
        pickedIds.add(q.id);
      }
    }
    // Final shuffle so difficulties are mixed
    for (let i = picked.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [picked[i], picked[j]] = [picked[j], picked[i]];
    }
    return picked.slice(0, 30);
  });
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(mockTest.duration * 60);
  const [result, setResult] = useState<ReturnType<typeof scoreQuiz> | null>(null);

  useEffect(() => {
    if (!started || result) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, result]);

  const finishTest = () => {
    const quizResult = scoreQuiz(questions, answers, startTime);
    setResult(quizResult);

    const passed = quizResult.percentage >= 70;
    dispatch({
      type: 'ADD_CHECKPOINT_RESULT',
      result: {
        id: `mock-${subject.id}-${Date.now()}`,
        subjectId: subject.id,
        date: new Date().toISOString(),
        score: quizResult.correctAnswers,
        totalQuestions: quizResult.totalQuestions,
        topicBreakdown: quizResult.topicBreakdown,
        timeTaken: quizResult.timeTaken,
      },
    });
    dispatch({ type: 'ADD_XP', amount: passed ? XP_REWARDS.CHECKPOINT_PASS * 2 : XP_REWARDS.CHECKPOINT_FAIL * 2 });

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
      finishTest();
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'foundation': return 'bg-emerald-100 text-emerald-700';
      case 'intermediate': return 'bg-blue-100 text-blue-700';
      case 'higher': return 'bg-amber-100 text-amber-700';
      case 'further': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getGrade = (pct: number) => {
    if (pct >= 90) return { grade: '9', color: '#7c3aed' };
    if (pct >= 80) return { grade: '8', color: '#6366f1' };
    if (pct >= 70) return { grade: '7', color: '#2563eb' };
    if (pct >= 60) return { grade: '6', color: '#0891b2' };
    if (pct >= 50) return { grade: '5', color: '#059669' };
    if (pct >= 40) return { grade: '4', color: '#d97706' };
    if (pct >= 30) return { grade: '3', color: '#ea580c' };
    if (pct >= 20) return { grade: '2', color: '#dc2626' };
    return { grade: '1', color: '#991b1b' };
  };

  // Start screen
  if (!started) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border-2 border-slate-300 overflow-hidden">
          {/* AQA-style header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded">{mockTest.examBoard}</span>
              <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded">GCSE</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">{mockTest.title}</h1>
            <p className="text-sm text-slate-300">{mockTest.paper}</p>
          </div>

          <div className="p-6">
            {/* Exam info */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-400">Time allowed:</span> <strong>{mockTest.duration} minutes</strong></div>
                <div><span className="text-slate-400">Total marks:</span> <strong>{mockTest.totalMarks}</strong></div>
                <div><span className="text-slate-400">Questions:</span> <strong>{mockTest.questions.length}</strong></div>
                <div><span className="text-slate-400">XP reward:</span> <strong>+{XP_REWARDS.CHECKPOINT_PASS * 2} (pass) / +{XP_REWARDS.CHECKPOINT_FAIL * 2} (fail)</strong></div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-700 mb-2">Instructions</h3>
              <ul className="space-y-1 text-sm text-slate-600">
                {mockTest.instructions.map((inst, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-slate-400 mt-0.5">*</span>
                    {inst}
                  </li>
                ))}
              </ul>
            </div>

            {/* Difficulty breakdown */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-700 mb-2">Question Difficulty</h3>
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">10 Foundation</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">10 Intermediate</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">7 Higher</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">3 Further</span>
              </div>
            </div>

            <button
              onClick={() => setStarted(true)}
              className="w-full py-3 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 text-lg transition-colors"
            >
              Begin Mock Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (result) {
    const allTopics = subject.units.flatMap(u => u.topics);
    const { grade, color } = getGrade(result.percentage);

    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 text-white text-center">
            <p className="text-sm text-slate-300 mb-1">{mockTest.title} - Results</p>
            <div className="inline-flex items-center gap-4">
              <div>
                <p className="text-5xl font-bold">{result.percentage}%</p>
                <p className="text-sm text-slate-300 mt-1">
                  {result.correctAnswers}/{result.totalQuestions} correct
                </p>
              </div>
              <div className="w-px h-16 bg-white/20" />
              <div>
                <p className="text-sm text-slate-300">Estimated Grade</p>
                <p className="text-5xl font-bold" style={{ color }}>{grade}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400">Time Taken</p>
                <p className="text-lg font-bold text-slate-700">{formatTime(Math.floor(result.timeTaken / 1000))}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400">XP Earned</p>
                <p className="text-lg font-bold text-indigo-600">
                  +{result.percentage >= 70 ? XP_REWARDS.CHECKPOINT_PASS * 2 : XP_REWARDS.CHECKPOINT_FAIL * 2}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400">Pass Mark (70%)</p>
                <p className="text-lg font-bold" style={{ color: result.percentage >= 70 ? '#22c55e' : '#ef4444' }}>
                  {result.percentage >= 70 ? 'PASSED' : 'NOT YET'}
                </p>
              </div>
            </div>

            {/* Grade boundaries info */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-slate-700 mb-2 text-sm">Grade Boundaries (approximate)</h3>
              <div className="flex gap-1.5 text-xs">
                {[
                  { g: '9', min: 90 }, { g: '8', min: 80 }, { g: '7', min: 70 },
                  { g: '6', min: 60 }, { g: '5', min: 50 }, { g: '4', min: 40 },
                  { g: '3', min: 30 }, { g: '2', min: 20 }, { g: '1', min: 0 },
                ].map(({ g, min }) => (
                  <span
                    key={g}
                    className={`px-2 py-1 rounded font-medium ${
                      g === grade ? 'ring-2 ring-indigo-500 bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {g}: {min}%+
                  </span>
                ))}
              </div>
            </div>

            {/* Topic breakdown */}
            <h3 className="font-semibold text-slate-700 mb-3">Topic Breakdown</h3>
            <div className="space-y-2 mb-6">
              {Object.entries(result.topicBreakdown)
                .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))
                .map(([tId, { correct, total }]) => {
                  const topic = allTopics.find(t => t.id === tId);
                  const pct = Math.round((correct / total) * 100);
                  return (
                    <div key={tId} className="flex items-center gap-3 text-sm">
                      <span className="flex-1 text-slate-600">{topic?.name || tId}</span>
                      <div className="w-24 bg-slate-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                      <span className={`font-medium w-12 text-right ${pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {correct}/{total}
                      </span>
                    </div>
                  );
                })}
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                🔄 Retake Exam
              </button>
              <button
                onClick={() => navigate(`/subject/${subject.id}`)}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900"
              >
                Back to {subject.name}
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Question screen
  const question = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.entries(answers).filter(
    ([qId, ans]) => questions.find(q => q.id === qId)?.correctAnswer === ans
  ).length;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800">{subject.icon} Mock Exam</h2>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">Q{currentIndex + 1}/{questions.length}</span>
          <span className="text-xs text-slate-400">{correctCount}/{answeredCount} correct</span>
          <span className={`text-sm font-mono font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : timeLeft < 600 ? 'text-amber-600' : 'text-slate-600'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, backgroundColor: subject.color }}
        />
      </div>

      {/* Question card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
            {currentIndex + 1}
          </span>
          <span className="text-xs text-slate-400">of {questions.length}</span>
        </div>

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
              <p className="text-sm font-medium mb-1">
                {selectedAnswer === question.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
              </p>
              <p className="text-sm text-slate-600">{question.explanation}</p>
            </div>
            <button
              onClick={handleNext}
              className="mt-4 w-full py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900"
            >
              {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
