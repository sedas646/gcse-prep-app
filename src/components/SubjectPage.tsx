import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getSubjectById } from '../data/index';
import { getMasteryLevel, getMasteryColor } from '../types';

export default function SubjectPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { state } = useApp();
  const navigate = useNavigate();
  const subject = getSubjectById(subjectId || '');
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});

  if (!subject) {
    return <div className="p-8 text-center text-slate-500">Subject not found.</div>;
  }

  const diagnostic = state.diagnosticResults.find(d => d.subjectId === subject.id);
  const allTopics = subject.units.flatMap(u => u.topics);
  const completedTopics = allTopics.filter(t => {
    const prog = state.topicProgress[t.id];
    return prog && prog.masteryPercent >= 70;
  }).length;
  const overallProgress = allTopics.length > 0 ? Math.round((completedTopics / allTopics.length) * 100) : 0;

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const checkpointsForSubject = state.checkpointResults.filter(c => c.subjectId === subject.id);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
        <span className="text-3xl md:text-5xl">{subject.icon}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-3xl font-bold text-slate-800">{subject.name}</h1>
          <p className="text-sm text-slate-500">{subject.examBoard} • {subject.specification}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color: subject.color }}>{overallProgress}%</p>
          <p className="text-xs text-slate-400">{completedTopics}/{allTopics.length} topics mastered</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-3 mb-6">
        <div
          className="h-3 rounded-full transition-all duration-700"
          style={{ width: `${overallProgress}%`, backgroundColor: subject.color }}
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8">
        <button
          onClick={() => navigate(`/subject/${subject.id}/diagnostic`)}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          {diagnostic ? '🔄 Retake Diagnostic' : '🩺 Take Diagnostic Test'}
        </button>
        <button
          onClick={() => navigate(`/subject/${subject.id}/checkpoint`)}
          className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          📋 GCSE Checkpoint
        </button>
        <button
          onClick={() => navigate(`/subject/${subject.id}/mock-test`)}
          className="px-5 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 transition-colors"
        >
          📝 AQA Mock Exam
        </button>
        {diagnostic && (
          <div className="ml-auto bg-white rounded-lg border border-slate-200 px-4 py-2">
            <p className="text-xs text-slate-400">Last diagnostic</p>
            <p className="text-sm font-semibold" style={{ color: subject.color }}>{diagnostic.score}%</p>
          </div>
        )}
      </div>

      {/* Summer Term Focus topics */}
      {allTopics.some(t => t.summerTerm) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">☀️</span>
            <h3 className="font-semibold text-amber-800">Summer Term Focus</h3>
            <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full font-medium">Year 9</span>
          </div>
          <p className="text-xs text-amber-700 mb-3">Topics being taught this term — extra explanations, more practice questions, and renewing question sets.</p>
          <div className="flex flex-wrap gap-2">
            {allTopics.filter(t => t.summerTerm).map(topic => {
              const prog = state.topicProgress[topic.id];
              const m = prog?.masteryPercent || 0;
              return (
                <Link
                  key={topic.id}
                  to={`/subject/${subject.id}/topic/${topic.id}`}
                  className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-full text-xs font-medium hover:bg-amber-100 transition-colors no-underline inline-flex items-center gap-1.5"
                >
                  <span>☀️</span>
                  {topic.name}
                  <span className="text-amber-500">·</span>
                  <span className="text-amber-600">{m}%</span>
                  <span>→</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Weak topics from diagnostic */}
      {diagnostic && diagnostic.weakTopics.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-amber-800 mb-2">⚠️ Focus Areas (from diagnostic)</h3>
          <div className="flex flex-wrap gap-2">
            {diagnostic.weakTopics.map(topicId => {
              const topic = allTopics.find(t => t.id === topicId);
              return topic ? (
                <Link
                  key={topicId}
                  to={`/subject/${subject.id}/topic/${topicId}`}
                  className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium hover:bg-amber-200 transition-colors no-underline"
                >
                  {topic.name} →
                </Link>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Checkpoint history */}
      {checkpointsForSubject.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <h3 className="font-semibold text-slate-700 mb-3">📊 Checkpoint History</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {checkpointsForSubject.slice(-5).map((cp, i) => (
              <div key={cp.id} className="flex-shrink-0 bg-slate-50 rounded-lg p-3 min-w-[100px] text-center">
                <p className="text-xs text-slate-400">#{i + 1}</p>
                <p className="text-xl font-bold" style={{ color: cp.score >= 70 ? '#22c55e' : '#ef4444' }}>
                  {Math.round((cp.score / cp.totalQuestions) * 100)}%
                </p>
                <p className="text-xs text-slate-400">{new Date(cp.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic Grid - IXL Style */}
      <h2 className="text-xl font-bold text-slate-800 mb-4">Curriculum Topics</h2>
      <div className="space-y-3">
        {subject.units.map(unit => {
          const isExpanded = expandedUnits[unit.id] !== false;
          const unitTopics = unit.topics;
          const unitMastered = unitTopics.filter(t => {
            const prog = state.topicProgress[t.id];
            return prog && prog.masteryPercent >= 70;
          }).length;

          return (
            <div key={unit.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleUnit(unit.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                  <div>
                    <h3 className="font-semibold text-slate-700">{unit.name}</h3>
                    <p className="text-xs text-slate-400">{unitTopics.length} topics • {unitMastered} mastered</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${unitTopics.length > 0 ? (unitMastered / unitTopics.length) * 100 : 0}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-8">
                    {unitTopics.length > 0 ? Math.round((unitMastered / unitTopics.length) * 100) : 0}%
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {unitTopics.map(topic => {
                    const prog = state.topicProgress[topic.id];
                    const mastery = prog?.masteryPercent || 0;
                    const level = getMasteryLevel(mastery);
                    const colorClass = getMasteryColor(level);

                    return (
                      <Link
                        key={topic.id}
                        to={`/subject/${subject.id}/topic/${topic.id}`}
                        className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition-colors no-underline group"
                      >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold border ${colorClass}`}>
                          {mastery > 0 ? `${mastery}%` : '—'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                            {topic.name}
                            {topic.summerTerm && (
                              <span
                                title="Summer Term curriculum focus"
                                className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold border border-amber-300"
                              >
                                ☀️ Summer
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-400 truncate">{topic.description}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          {prog?.explanationRead && <span title="Explanation read">📖</span>}
                          {prog?.flashcardsReviewed && <span title="Flashcards reviewed">📇</span>}
                          {prog && prog.questionsAttempted > 0 && (
                            <span title="Questions attempted">
                              ✏️ {prog.questionsCorrect}/{prog.questionsAttempted}
                            </span>
                          )}
                          <span className="text-indigo-400 group-hover:text-indigo-600">→</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
