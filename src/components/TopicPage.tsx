import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getSubjectById } from '../data/index';
import { XP_REWARDS } from '../utils/xp';
import Flashcards from './Flashcards';
import YouTubeSection from './YouTubeSection';
import PracticeQuestions from './PracticeQuestions';

type Tab = 'learn' | 'flashcards' | 'videos' | 'practice';

export default function TopicPage() {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('learn');

  const subject = getSubjectById(subjectId || '');
  if (!subject) return <div className="p-8 text-center text-slate-500">Subject not found.</div>;

  const topic = subject.units.flatMap(u => u.topics).find(t => t.id === topicId);
  if (!topic) return <div className="p-8 text-center text-slate-500">Topic not found.</div>;

  const progress = state.topicProgress[topic.id];
  const mastery = progress?.masteryPercent || 0;

  const handleExplanationRead = () => {
    if (!progress?.explanationRead) {
      dispatch({ type: 'SET_TOPIC_PROGRESS', topicId: topic.id, progress: { explanationRead: true } });
      dispatch({ type: 'ADD_XP', amount: XP_REWARDS.EXPLANATION_READ });
    }
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'learn', label: 'Learn', icon: '📖' },
    { key: 'flashcards', label: 'Flashcards', icon: '📇' },
    { key: 'videos', label: 'Videos', icon: '🎬' },
    { key: 'practice', label: 'Practice', icon: '✏️' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <Link to={`/subject/${subject.id}`} className="hover:text-indigo-600 no-underline text-slate-400">
          {subject.icon} {subject.name}
        </Link>
        <span>›</span>
        <span className="text-slate-600">{topic.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-800">{topic.name}</h1>
            {topic.summerTerm && (
              <span
                title="Year 9 Summer Term curriculum focus"
                className="text-xs px-2 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 rounded-full font-semibold border border-amber-300 inline-flex items-center gap-1"
              >
                <span>☀️</span> Summer Term Focus
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">{topic.description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: subject.color }}>
            {mastery}%
          </div>
          <p className="text-xs text-slate-400">mastery</p>
        </div>
      </div>

      {/* Key Points */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-indigo-800 mb-2">Key Points</h3>
        <ul className="space-y-1">
          {topic.keyPoints.map((point, i) => (
            <li key={i} className="text-sm text-indigo-700 flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">•</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === 'learn') handleExplanationRead();
            }}
            className={`flex-1 flex items-center justify-center gap-1 md:gap-2 py-2 md:py-2.5 px-2 md:px-4 rounded-md text-xs md:text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.key === 'learn' && progress?.explanationRead && <span className="text-emerald-500 text-xs">✓</span>}
            {tab.key === 'flashcards' && progress?.flashcardsReviewed && <span className="text-emerald-500 text-xs">✓</span>}
            {tab.key === 'practice' && progress && progress.questionsAttempted > 0 && (
              <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded">
                {progress.questionsCorrect}/{progress.questionsAttempted}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-slide-in">
        {activeTab === 'learn' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="prose prose-slate max-w-none">
              {topic.explanation.split('\n\n').map((para, i) => (
                <p key={i} className="text-slate-700 leading-relaxed mb-4">{para}</p>
              ))}
            </div>
            {!progress?.explanationRead && (
              <button
                onClick={handleExplanationRead}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Mark as Read (+{XP_REWARDS.EXPLANATION_READ} XP)
              </button>
            )}
            {progress?.explanationRead && (
              <p className="mt-4 text-sm text-emerald-600">✅ You've read this explanation</p>
            )}
          </div>
        )}

        {activeTab === 'flashcards' && (
          <Flashcards
            flashcards={topic.flashcards}
            topicId={topic.id}
          />
        )}

        {activeTab === 'videos' && (
          <YouTubeSection
            videos={topic.videos}
            topicId={topic.id}
            subjectColor={subject.color}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeQuestions
            questions={topic.questions}
            topicId={topic.id}
            subjectColor={subject.color}
          />
        )}
      </div>
    </div>
  );
}
