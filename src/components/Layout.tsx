import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { levelProgress } from '../utils/xp';

const subjects = [
  { id: 'maths', name: 'Maths', icon: '📐', path: '/subject/maths' },
  { id: 'biology', name: 'Biology', icon: '🧬', path: '/subject/biology' },
  { id: 'chemistry', name: 'Chemistry', icon: '⚗️', path: '/subject/chemistry' },
  { id: 'physics', name: 'Physics', icon: '⚡', path: '/subject/physics' },
  { id: 'history', name: 'History', icon: '📜', path: '/subject/history' },
  { id: 'english', name: 'English', icon: '📝', path: '/subject/english' },
];

export default function Layout() {
  const { state } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 flex items-center justify-between px-4 py-3 md:hidden">
        <button onClick={() => setSidebarOpen(true)} className="p-1">
          <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <NavLink to="/" className="flex items-center gap-2 no-underline" onClick={closeSidebar}>
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
          <span className="font-bold text-slate-800">AcePrep</span>
        </NavLink>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>🔥 {state.currentStreak}</span>
          <span className="text-indigo-600 font-semibold">Lv{state.level}</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-slate-200 flex flex-col shrink-0
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 no-underline" onClick={closeSidebar}>
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">A</div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-none">AcePrep</h1>
              <p className="text-[11px] text-slate-400 leading-none mt-0.5">GCSE Excellence</p>
            </div>
          </NavLink>
          <button onClick={closeSidebar} className="md:hidden p-1 text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* XP & Level */}
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-indigo-600">Level {state.level}</span>
            <span className="text-xs text-slate-400">{state.xp} XP</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${levelProgress(state.xp)}%` }}
            />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-500">🔥 {state.currentStreak} day streak</span>
            {state.longestStreak > 0 && (
              <span className="text-xs text-slate-400">Best: {state.longestStreak}</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          <NavLink
            to="/"
            end
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm no-underline transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border-r-3 border-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <span className="text-lg">🏠</span>
            Dashboard
          </NavLink>

          <div className="px-4 pt-4 pb-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Subjects</p>
          </div>

          {subjects.map((s) => (
            <NavLink
              key={s.id}
              to={s.path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm no-underline transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold border-r-3 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <span className="text-lg">{s.icon}</span>
              {s.name}
            </NavLink>
          ))}

          <div className="px-4 pt-4 pb-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Progress</p>
          </div>

          <NavLink
            to="/badges"
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm no-underline transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border-r-3 border-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <span className="text-lg">🏆</span>
            Badges & Achievements
          </NavLink>
        </nav>

        {/* Stats footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-slate-700">{state.totalQuestionsAnswered}</p>
              <p className="text-[10px] text-slate-400">Questions</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-700">
                {state.totalQuestionsAnswered > 0
                  ? Math.round((state.totalCorrectAnswers / state.totalQuestionsAnswered) * 100)
                  : 0}%
              </p>
              <p className="text-[10px] text-slate-400">Accuracy</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
