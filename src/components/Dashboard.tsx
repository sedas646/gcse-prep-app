import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getDailyChallenge } from '../data/dailyChallenges';
import { getDailyOlympiad } from '../data/olympiadPuzzles';
import type { OlympiadPuzzle } from '../data/olympiadPuzzles';
import { getAllSubjects } from '../data/index';

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const challenge = getDailyChallenge(today);
  const todayChallenge = state.dailyChallenges[today];
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(todayChallenge?.answered || false);
  const subjects = getAllSubjects();

  // Olympiad puzzles
  const olympiad = getDailyOlympiad(today);
  const mathsOlympiadKey = `olympiad-maths-${today}`;
  const physicsOlympiadKey = `olympiad-physics-${today}`;
  const mathsOlympiadDone = state.dailyChallenges[mathsOlympiadKey];
  const physicsOlympiadDone = state.dailyChallenges[physicsOlympiadKey];
  const [olympiadAnswers, setOlympiadAnswers] = useState<Record<string, number | null>>({});
  const [olympiadResults, setOlympiadResults] = useState<Record<string, boolean>>({
    [mathsOlympiadKey]: mathsOlympiadDone?.answered || false,
    [physicsOlympiadKey]: physicsOlympiadDone?.answered || false,
  });
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});

  const handleOlympiadAnswer = (puzzle: OlympiadPuzzle, key: string, answerIndex: number) => {
    if (olympiadResults[key]) return;
    setOlympiadAnswers(prev => ({ ...prev, [key]: answerIndex }));
    const correct = answerIndex === puzzle.correctAnswer;
    setOlympiadResults(prev => ({ ...prev, [key]: true }));
    dispatch({ type: 'ANSWER_DAILY_CHALLENGE', date: key, correct, questionId: puzzle.id });
    dispatch({ type: 'ANSWER_QUESTION', correct });
  };

  const handleChallengeAnswer = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
    const correct = answerIndex === challenge.correctAnswer;
    dispatch({ type: 'ANSWER_DAILY_CHALLENGE', date: today, correct, questionId: challenge.id });
    dispatch({ type: 'ANSWER_QUESTION', correct });
    setShowResult(true);
  };

  const getSubjectProgress = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return 0;
    const allTopics = subject.units.flatMap(u => u.topics);
    if (allTopics.length === 0) return 0;
    const completed = allTopics.filter(t => {
      const prog = state.topicProgress[t.id];
      return prog && prog.masteryPercent >= 70;
    }).length;
    return Math.round((completed / allTopics.length) * 100);
  };

  const recentBadges = state.badges.filter(b => b.earned).slice(-3);
  const diagnosticsDone = state.diagnosticResults.length;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Welcome Back! 👋</h1>
        <p className="text-slate-500 mt-1">Keep pushing for those top grades. Every question counts.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Current Streak</p>
          <p className="text-3xl font-bold text-orange-500">🔥 {state.currentStreak}</p>
          <p className="text-xs text-slate-400 mt-1">days</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Level</p>
          <p className="text-3xl font-bold text-indigo-600">⭐ {state.level}</p>
          <p className="text-xs text-slate-400 mt-1">{state.xp} XP total</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Questions Done</p>
          <p className="text-3xl font-bold text-emerald-600">📝 {state.totalQuestionsAnswered}</p>
          <p className="text-xs text-slate-400 mt-1">
            {state.totalQuestionsAnswered > 0
              ? Math.round((state.totalCorrectAnswers / state.totalQuestionsAnswered) * 100)
              : 0}% accuracy
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Badges Earned</p>
          <p className="text-3xl font-bold text-yellow-500">🏆 {state.badges.filter(b => b.earned).length}</p>
          <p className="text-xs text-slate-400 mt-1">of {state.badges.length} total</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Daily Challenge */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 md:p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🎯</span>
            <h2 className="text-xl font-bold">Daily Challenge</h2>
            <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full">{today}</span>
          </div>
          <p className="text-lg mb-4 font-medium">{challenge.question}</p>
          <div className="grid grid-cols-2 gap-2">
            {challenge.options.map((opt, i) => {
              let btnClass = 'p-3 rounded-lg text-sm font-medium text-left transition-all ';
              if (showResult) {
                if (i === challenge.correctAnswer) {
                  btnClass += 'bg-emerald-400/30 border-2 border-emerald-300';
                } else if (i === selectedAnswer && i !== challenge.correctAnswer) {
                  btnClass += 'bg-red-400/30 border-2 border-red-300';
                } else {
                  btnClass += 'bg-white/10 border border-white/20 opacity-50';
                }
              } else {
                btnClass += 'bg-white/10 border border-white/20 hover:bg-white/20 cursor-pointer';
              }
              return (
                <button
                  key={i}
                  onClick={() => handleChallengeAnswer(i)}
                  disabled={showResult}
                  className={btnClass}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {showResult && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <p className="text-sm">
                {(todayChallenge?.correct || selectedAnswer === challenge.correctAnswer) ? '✅ Correct! ' : '❌ Not quite. '}
                {challenge.explanation}
              </p>
              <p className="text-xs mt-2 text-white/70">
                +{(todayChallenge?.correct || selectedAnswer === challenge.correctAnswer) ? '50' : '25'} XP earned
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-3">📊 Diagnostics</h3>
            <p className="text-sm text-slate-500 mb-3">{diagnosticsDone}/6 subjects tested</p>
            {diagnosticsDone < 6 && (
              <p className="text-xs text-indigo-600">Take a diagnostic test to find your weak spots!</p>
            )}
          </div>
          {recentBadges.length > 0 && (
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-3">Recent Badges</h3>
              <div className="flex gap-2">
                {recentBadges.map(b => (
                  <span key={b.id} className="text-2xl" title={b.name}>{b.icon}</span>
                ))}
              </div>
            </div>
          )}
          <Link
            to="/badges"
            className="block bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors no-underline"
          >
            <h3 className="font-semibold text-slate-700">🏆 View All Badges</h3>
            <p className="text-xs text-slate-400 mt-1">Track your achievements</p>
          </Link>
        </div>
      </div>

      {/* Olympiad Puzzles */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🧩</span>
          <h2 className="text-xl font-bold text-slate-800">Daily Olympiad Puzzles</h2>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Brain Teasers</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { puzzle: olympiad.maths, key: mathsOlympiadKey, icon: '📐', label: 'Maths', gradient: 'from-violet-500 to-indigo-600' },
            { puzzle: olympiad.physics, key: physicsOlympiadKey, icon: '⚡', label: 'Physics', gradient: 'from-cyan-500 to-blue-600' },
          ].map(({ puzzle, key, icon, label, gradient }) => {
            const done = olympiadResults[key];
            const answer = olympiadAnswers[key] ?? null;
            const prevAnswer = state.dailyChallenges[key];
            const wasCorrect = prevAnswer?.correct || answer === puzzle.correctAnswer;

            return (
              <div key={key} className={`bg-gradient-to-br ${gradient} rounded-xl p-4 md:p-5 text-white shadow-lg`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{icon}</span>
                  <span className="font-bold text-sm">{label} Olympiad</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    puzzle.difficulty === 'gold' ? 'bg-yellow-400/30' :
                    puzzle.difficulty === 'silver' ? 'bg-slate-300/30' : 'bg-orange-400/30'
                  }`}>
                    {puzzle.difficulty === 'gold' ? '🥇' : puzzle.difficulty === 'silver' ? '🥈' : '🥉'} {puzzle.difficulty}
                  </span>
                </div>
                <h3 className="font-bold text-base mb-2">{puzzle.title}</h3>
                <p className="text-sm mb-3 text-white/90">{puzzle.puzzle}</p>

                {!done && !showHint[key] && (
                  <button
                    onClick={() => setShowHint(prev => ({ ...prev, [key]: true }))}
                    className="text-xs text-white/60 hover:text-white/90 mb-3 underline"
                  >
                    Show hint
                  </button>
                )}
                {showHint[key] && !done && (
                  <p className="text-xs text-white/70 bg-white/10 rounded-lg p-2 mb-3">
                    💡 {puzzle.hint}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {puzzle.options.map((opt, i) => {
                    let cls = 'p-2.5 rounded-lg text-xs font-medium text-left transition-all ';
                    if (done) {
                      if (i === puzzle.correctAnswer) {
                        cls += 'bg-emerald-400/30 border-2 border-emerald-300';
                      } else if (i === answer && i !== puzzle.correctAnswer) {
                        cls += 'bg-red-400/30 border-2 border-red-300';
                      } else {
                        cls += 'bg-white/10 border border-white/20 opacity-40';
                      }
                    } else {
                      cls += 'bg-white/10 border border-white/20 hover:bg-white/20 cursor-pointer';
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => handleOlympiadAnswer(puzzle, key, i)}
                        disabled={done}
                        className={cls}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {done && (
                  <div className="mt-3 p-2.5 bg-white/10 rounded-lg">
                    <p className="text-xs">
                      {wasCorrect ? '✅ Brilliant! ' : '❌ Not quite. '}
                      {puzzle.explanation}
                    </p>
                    <p className="text-xs mt-1 text-white/60">
                      +{wasCorrect ? '50' : '25'} XP earned
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject Cards */}
      <h2 className="text-xl font-bold text-slate-800 mb-4">Your Subjects</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map(subject => {
          const progress = getSubjectProgress(subject.id);
          const diagnostic = state.diagnosticResults.find(d => d.subjectId === subject.id);
          const topicCount = subject.units.reduce((sum, u) => sum + u.topics.length, 0);

          return (
            <Link
              key={subject.id}
              to={`/subject/${subject.id}`}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all no-underline group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{subject.icon}</span>
                <div>
                  <h3 className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-xs text-slate-400">{subject.examBoard} • {topicCount} topics</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: subject.color }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">{progress}% mastered</span>
                {diagnostic ? (
                  <span className="text-xs text-emerald-600">Diagnostic: {diagnostic.score}%</span>
                ) : (
                  <span className="text-xs text-amber-600">Take diagnostic →</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
