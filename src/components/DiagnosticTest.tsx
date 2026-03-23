import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getSubjectById } from '../data/index';
import { scoreQuiz, identifyWeakTopics, identifyStrongTopics } from '../utils/scoring';
import { XP_REWARDS } from '../utils/xp';

export default function DiagnosticTest() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const subject = getSubjectById(subjectId || '');
  if (!subject) return <div className="p-8 text-center text-slate-500">Subject not found.</div>;

  const questions = subject.diagnosticQuestions;
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startTime] = useState(Date.now());
  const [result, setResult] = useState<ReturnType<typeof scoreQuiz> | null>(null);

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = { ...answers, [questions[currentIndex].id]: answerIndex };
    setAnswers(newAnswers);

    dispatch({ type: 'ANSWER_QUESTION', correct: answerIndex === questions[currentIndex].correctAnswer });

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const quizResult = scoreQuiz(questions, newAnswers, startTime);
      setResult(quizResult);

      const weakTopics = identifyWeakTopics(quizResult.topicBreakdown);
      const strongTopics = identifyStrongTopics(quizResult.topicBreakdown);

      dispatch({
        type: 'ADD_DIAGNOSTIC_RESULT',
        result: {
          subjectId: subject.id,
          date: new Date().toISOString(),
          score: quizResult.percentage,
          totalQuestions: quizResult.totalQuestions,
          topicScores: quizResult.topicBreakdown,
          weakTopics,
          strongTopics,
        },
      });
      dispatch({ type: 'ADD_XP', amount: XP_REWARDS.DIAGNOSTIC_COMPLETE });

      // Check all diagnostics badge
      const otherDiagnostics = state.diagnosticResults.filter(d => d.subjectId !== subject.id);
      if (otherDiagnostics.length >= 5) {
        dispatch({ type: 'EARN_BADGE', badgeId: 'all-diagnostics' });
      }
    }
  };

  if (!started) {
    const existingDiagnostic = state.diagnosticResults.find(d => d.subjectId === subject.id);
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <span className="text-5xl mb-4 block">{subject.icon}</span>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{subject.name} Diagnostic Test</h1>
          <p className="text-slate-500 mb-6">
            This GCSE-level test will assess your current knowledge across all {subject.name} topics.
            Your results will identify areas to focus on.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-400">Questions:</span> <strong>{questions.length}</strong></div>
              <div><span className="text-slate-400">Difficulty:</span> <strong>GCSE Higher</strong></div>
              <div><span className="text-slate-400">XP Reward:</span> <strong>+{XP_REWARDS.DIAGNOSTIC_COMPLETE}</strong></div>
              <div><span className="text-slate-400">Time limit:</span> <strong>None</strong></div>
            </div>
          </div>
          {existingDiagnostic && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-700">
              You previously scored {existingDiagnostic.score}% on {new Date(existingDiagnostic.date).toLocaleDateString()}.
              Retaking will replace your previous result.
            </div>
          )}
          <button
            onClick={() => setStarted(true)}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 text-lg"
          >
            Start Diagnostic
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    const allTopics = subject.units.flatMap(u => u.topics);
    const weakTopics = identifyWeakTopics(result.topicBreakdown);
    const strongTopics = identifyStrongTopics(result.topicBreakdown);

    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">
              {result.percentage >= 80 ? '🌟' : result.percentage >= 60 ? '👏' : result.percentage >= 40 ? '👍' : '💪'}
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Diagnostic Complete!</h2>
            <p className="text-5xl font-bold my-4" style={{ color: result.percentage >= 60 ? '#22c55e' : '#ef4444' }}>
              {result.percentage}%
            </p>
            <p className="text-slate-500">
              {result.correctAnswers} out of {result.totalQuestions} correct
            </p>
            <p className="text-sm text-emerald-600 mt-2">+{XP_REWARDS.DIAGNOSTIC_COMPLETE} XP earned</p>
          </div>

          {/* Topic Breakdown */}
          <h3 className="font-semibold text-slate-700 mb-3">Topic Breakdown</h3>
          <div className="space-y-2 mb-6">
            {Object.entries(result.topicBreakdown).map(([tId, { correct, total }]) => {
              const topic = allTopics.find(t => t.id === tId);
              const pct = Math.round((correct / total) * 100);
              return (
                <div key={tId} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">{topic?.name || tId}</span>
                      <span className={`text-sm font-medium ${pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {correct}/{total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendations */}
          {weakTopics.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-red-800 mb-2">⚠️ Focus Areas</h4>
              <div className="flex flex-wrap gap-2">
                {weakTopics.map(tId => {
                  const topic = allTopics.find(t => t.id === tId);
                  return topic ? (
                    <span key={tId} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      {topic.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {strongTopics.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-emerald-800 mb-2">💪 Strong Areas</h4>
              <div className="flex flex-wrap gap-2">
                {strongTopics.map(tId => {
                  const topic = allTopics.find(t => t.id === tId);
                  return topic ? (
                    <span key={tId} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      {topic.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(`/subject/${subject.id}`)}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Start Studying →
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active quiz
  const question = questions[currentIndex];
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">{subject.icon} {subject.name} Diagnostic</h2>
        <span className="text-sm text-slate-500">
          {currentIndex + 1} / {questions.length}
        </span>
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
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className="w-full p-4 rounded-lg text-left text-sm font-medium border-2 border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 transition-all text-slate-700"
            >
              <span className="inline-flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
