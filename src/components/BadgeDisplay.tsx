import { useApp } from '../context/AppContext';

export default function BadgeDisplay() {
  const { state } = useApp();
  const earned = state.badges.filter(b => b.earned);
  const locked = state.badges.filter(b => !b.earned);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Badges & Achievements</h1>
      <p className="text-slate-500 mb-8">
        {earned.length} of {state.badges.length} badges earned. Keep going!
      </p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-3xl font-bold text-indigo-600">{state.level}</p>
          <p className="text-xs text-slate-400">Level</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-3xl font-bold text-amber-500">{state.xp}</p>
          <p className="text-xs text-slate-400">Total XP</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-3xl font-bold text-orange-500">{state.currentStreak}</p>
          <p className="text-xs text-slate-400">Current Streak</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-3xl font-bold text-emerald-500">{state.longestStreak}</p>
          <p className="text-xs text-slate-400">Best Streak</p>
        </div>
      </div>

      {/* Earned Badges */}
      {earned.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">🏆 Earned ({earned.length})</h2>
          <div className="grid grid-cols-3 gap-4">
            {earned.map(badge => (
              <div
                key={badge.id}
                className="bg-white rounded-xl p-5 border border-yellow-200 shadow-sm badge-glow"
              >
                <div className="text-center">
                  <span className="text-4xl block mb-2">{badge.icon}</span>
                  <h3 className="font-semibold text-slate-700">{badge.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{badge.description}</p>
                  {badge.earnedDate && (
                    <p className="text-xs text-emerald-500 mt-2">
                      Earned {new Date(badge.earnedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">🔒 Locked ({locked.length})</h2>
        <div className="grid grid-cols-3 gap-4">
          {locked.map(badge => (
            <div
              key={badge.id}
              className="bg-slate-50 rounded-xl p-5 border border-slate-200 opacity-60"
            >
              <div className="text-center">
                <span className="text-4xl block mb-2 grayscale">{badge.icon}</span>
                <h3 className="font-semibold text-slate-500">{badge.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
