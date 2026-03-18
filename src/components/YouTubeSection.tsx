import { useState } from 'react';
import type { YouTubeVideo } from '../types';
import { useApp } from '../context/AppContext';
import { XP_REWARDS } from '../utils/xp';

interface Props {
  videos: YouTubeVideo[];
  topicId: string;
  subjectColor: string;
}

export default function YouTubeSection({ videos, topicId, subjectColor }: Props) {
  const { state, dispatch } = useApp();
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState('');
  const [editingSummaryFor, setEditingSummaryFor] = useState<string | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const progress = state.topicProgress[topicId];
  const savedVideos = state.savedVideos[topicId] || [];
  const allVideos = [...videos, ...savedVideos];

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    return null;
  };

  const handleAddVideo = () => {
    const videoId = extractVideoId(newVideoUrl);
    if (!videoId || !newVideoTitle.trim()) return;

    dispatch({
      type: 'SAVE_VIDEO',
      topicId,
      video: {
        id: `custom-${Date.now()}`,
        title: newVideoTitle.trim(),
        videoId,
        channel: 'Custom',
      },
    });
    setNewVideoUrl('');
    setNewVideoTitle('');
    setShowAddForm(false);
  };

  const handleSaveSummary = (videoId: string) => {
    if (!summaryText.trim()) return;
    dispatch({ type: 'SAVE_VIDEO_SUMMARY', topicId, videoId, summary: summaryText });
    dispatch({ type: 'ADD_XP', amount: XP_REWARDS.VIDEO_SUMMARY });
    setEditingSummaryFor(null);
    setSummaryText('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">{allVideos.length} Videos Available</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {showAddForm ? 'Cancel' : '+ Add Video'}
        </button>
      </div>

      {/* Add Video Form */}
      {showAddForm && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-3">Add a YouTube video to this topic</p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Video title"
              value={newVideoTitle}
              onChange={e => setNewVideoTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
            <input
              type="text"
              placeholder="YouTube URL or video ID"
              value={newVideoUrl}
              onChange={e => setNewVideoUrl(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
            <button
              onClick={handleAddVideo}
              disabled={!newVideoTitle.trim() || !newVideoUrl.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
            >
              Add Video
            </button>
          </div>
        </div>
      )}

      {/* Video List */}
      {allVideos.map(video => {
        const isActive = activeVideoId === video.videoId;
        const existingSummary = progress?.videoSummaries?.[video.videoId];
        const isEditing = editingSummaryFor === video.videoId;
        const isCustom = video.channel === 'Custom';

        return (
          <div key={video.videoId} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Video header */}
            <button
              onClick={() => setActiveVideoId(isActive ? null : video.videoId)}
              className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 text-left transition-colors"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                style={{ backgroundColor: subjectColor }}
              >
                ▶
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{video.title}</p>
                <p className="text-xs text-slate-400">{video.channel}</p>
              </div>
              <div className="flex items-center gap-2">
                {existingSummary && <span className="text-xs text-emerald-600">📝 Summary</span>}
                {isCustom && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      dispatch({ type: 'REMOVE_VIDEO', topicId, videoId: video.videoId });
                    }}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                )}
                <span className="text-slate-400">{isActive ? '▲' : '▼'}</span>
              </div>
            </button>

            {/* Expanded video */}
            {isActive && (
              <div className="border-t border-slate-100 p-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${video.videoId}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* Summary section */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    📝 Video Summary
                    {!existingSummary && <span className="text-xs text-slate-400 font-normal ml-2">+{XP_REWARDS.VIDEO_SUMMARY} XP</span>}
                  </h4>

                  {existingSummary && !isEditing ? (
                    <div>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{existingSummary}</p>
                      <button
                        onClick={() => {
                          setEditingSummaryFor(video.videoId);
                          setSummaryText(existingSummary);
                        }}
                        className="mt-2 text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Edit summary
                      </button>
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={isEditing ? summaryText : summaryText}
                        onChange={e => setSummaryText(e.target.value)}
                        placeholder="Watch the video and write a summary of what you learned. What are the key takeaways?"
                        className="w-full h-28 px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:border-indigo-400"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSaveSummary(video.videoId)}
                          disabled={!summaryText.trim()}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
                        >
                          Save Summary
                        </button>
                        {isEditing && (
                          <button
                            onClick={() => { setEditingSummaryFor(null); setSummaryText(''); }}
                            className="px-4 py-2 text-slate-500 text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {allVideos.length === 0 && (
        <div className="text-center text-slate-400 py-8">
          <p>No videos yet. Click "Add Video" to add YouTube links for this topic.</p>
        </div>
      )}
    </div>
  );
}
