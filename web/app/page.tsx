"use client";

import { useState } from 'react';
import ThresholdSlider from '@/components/threshold-slider';
import LibraryStatsDisplay from '@/components/library-stats';
import MustardProgress from '@/components/mustard-progress';
import { LibraryStats } from '@/types/plexiq';

export default function Dashboard() {
  const [threshold, setThreshold] = useState(0.7);
  const [selectedLibrary, setSelectedLibrary] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 0, stage: '', message: '' });
  const [stats, setStats] = useState<LibraryStats | null>(null);

  const libraries = ['Movies', 'TV Shows', 'Music', '4K Movies'];

  const handleAnalyze = async () => {
    if (!selectedLibrary) {
      alert('Please select a library first');
      return;
    }
    setIsAnalyzing(true);
    const stages = [
      { stage: 'collecting', message: 'Connecting to Plex server...', duration: 800 },
      { stage: 'collecting', message: 'Collecting metadata...', duration: 1500 },
      { stage: 'enriching', message: 'Enriching with IMDb ratings...', duration: 1200 },
      { stage: 'enriching', message: 'Enriching with TMDb data...', duration: 1200 },
      { stage: 'analyzing', message: 'Calculating deletion scores...', duration: 1500 },
      { stage: 'complete', message: 'Analysis complete!', duration: 400 },
    ];
    let current = 0;
    const total = 100;
    for (const { stage, message, duration } of stages) {
      setProgress({ current, total, stage, message });
      await new Promise(resolve => setTimeout(resolve, duration));
      current += Math.floor(100 / stages.length);
    }
    setStats({
      name: selectedLibrary,
      itemCount: 1247,
      totalSize: 5_432_109_876_543,
      avgScore: 0.65,
      deletionCandidates: 342,
      potentialSpaceSaved: 1_234_567_890_123,
    });
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-amber-900/30 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl leading-none select-none">🌭</div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight" style={{background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'var(--font-audiowide), monospace'}}>
                  PlexIQ
                </h1>
                <p className="text-xs text-gray-500 mt-0.5 tracking-widest uppercase">
                  v5.1 &nbsp;·&nbsp; Smart Media Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer select-none" title="Toggle dry-run mode">
                <span className="text-xs text-gray-400">{isDryRun ? 'Dry Run' : 'Live Mode'}</span>
                <div
                  onClick={() => setIsDryRun(!isDryRun)}
                  className={"relative w-10 h-5 rounded-full transition-colors duration-200 " + (isDryRun ? 'bg-gray-700' : 'bg-red-700')}
                >
                  <div className={"absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 " + (isDryRun ? 'left-0.5 bg-gray-400' : 'left-5 bg-red-300')} />
                </div>
              </label>
              <div className="text-right">
                <div className="text-xs text-gray-500">Plex Server</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400 font-medium">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Live Mode Warning Banner */}
      {!isDryRun && (
        <div className="bg-red-900/40 border-b border-red-700/50 px-6 py-2 text-center">
          <span className="text-sm text-red-300 font-semibold">⚠ Live Mode — deletions are permanent</span>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-5">
            {/* Library Selection */}
            <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/60">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Library</h3>
              <select
                value={selectedLibrary}
                onChange={(e) => setSelectedLibrary(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{focusRingColor: '#f59e0b'} as React.CSSProperties}
                disabled={isAnalyzing}
              >
                <option value="">Choose a library...</option>
                {libraries.map((lib) => (
                  <option key={lib} value={lib}>{lib}</option>
                ))}
              </select>
            </div>

            {/* THE ONE SLIDER */}
            <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/60">
              <ThresholdSlider
                value={threshold}
                onChange={setThreshold}
                disabled={isAnalyzing}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !selectedLibrary}
                className="w-full font-semibold py-4 px-6 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                style={{background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#111827'}}
              >
                {isAnalyzing ? '⏳ Analyzing...' : '🔍 Analyze Library'}
              </button>

              <button
                disabled={!stats || isAnalyzing}
                className="w-full bg-gray-800 text-gray-100 font-semibold py-4 px-6 rounded-xl hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 border border-gray-700"
              >
                📊 View All Recommendations
              </button>

              <button
                disabled={!stats || isAnalyzing}
                className={"w-full font-semibold py-4 px-6 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 border " + (!isDryRun ? 'bg-red-700/60 border-red-600 text-red-100 hover:bg-red-700' : 'bg-gray-800/60 border-gray-600 text-gray-300 hover:bg-gray-700/60')}
              >
                {isDryRun ? '🌭 Delete Candidates (Dry Run)' : '🗑️ Delete Candidates — LIVE'}
              </button>
            </div>

            {/* Mode indicator */}
            <div className={"rounded-xl p-4 border " + (isDryRun ? 'bg-blue-900/10 border-blue-800/30' : 'bg-red-900/10 border-red-800/30')}>
              <div className="flex items-start gap-3">
                <div className="text-xl">{isDryRun ? '🛡️' : '⚡'}</div>
                <div>
                  <div className={"text-sm font-semibold mb-1 " + (isDryRun ? 'text-blue-400' : 'text-red-400')}>
                    {isDryRun ? 'Dry Run Mode' : 'Live Delete Mode'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {isDryRun
                      ? 'Nothing will be deleted. Review candidates first.'
                      : 'Content rated ≥8.0 is always protected.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {isAnalyzing && (
              <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700/60">
                <MustardProgress
                  current={progress.current}
                  total={progress.total}
                  message={progress.message}
                  stage={progress.stage}
                />
              </div>
            )}

            <LibraryStatsDisplay stats={stats} loading={isAnalyzing} />

            {!stats && !isAnalyzing && (
              <div className="bg-gray-800/60 rounded-xl p-14 border border-gray-700/60 text-center">
                <div className="text-7xl mb-5 select-none">🌭</div>
                <h2 className="text-2xl font-bold text-gray-100 mb-3">
                  PlexIQ v5.1
                </h2>
                <p className="text-gray-400 max-w-sm mx-auto mb-7 text-sm leading-relaxed">
                  Select a library, set your threshold, and let PlexIQ find what needs to go.
                  One slider. No drama.
                </p>
                <div className="inline-block border border-amber-600/30 bg-amber-900/10 rounded-xl px-6 py-4">
                  <div className="text-sm text-amber-400 font-semibold mb-1">THE ONE SLIDER</div>
                  <div className="text-xs text-gray-500">Everything you need. Nothing you don't.</div>
                </div>
              </div>
            )}

            {stats && !isAnalyzing && (
              <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700/60">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-gray-100">Deletion Candidates</h3>
                  <span className="text-xs text-gray-500 bg-gray-700/50 px-3 py-1 rounded-full">Top 50</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-700">
                      <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                        <th className="pb-3 font-medium">Title</th>
                        <th className="pb-3 font-medium">Score</th>
                        <th className="pb-3 font-medium">Size</th>
                        <th className="pb-3 font-medium">Rating</th>
                        <th className="pb-3 font-medium">Plays</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300 divide-y divide-gray-800/80">
                      {[...Array(10)].map((_, i) => (
                        <tr key={i} className="hover:bg-gray-700/20 transition-colors">
                          <td className="py-3 pr-4">Sample Movie {i + 1}</td>
                          <td className="py-3">
                            <span className="text-amber-400 font-bold">{(0.7 + Math.random() * 0.28).toFixed(2)}</span>
                          </td>
                          <td className="py-3 text-gray-400">2.4 GB</td>
                          <td className="py-3 text-gray-400">6.{i + 1}</td>
                          <td className="py-3 text-gray-500">0</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-5 pt-4 border-t border-gray-700/60 text-center">
                  <button className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors">
                    Load more →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-gray-800/60">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>PlexIQ v5.1 &nbsp;·&nbsp; Built by Rich Knowles</div>
            <div className="flex items-center gap-5">
              <a href="https://github.com/richknowles/PlexIQ" className="hover:text-gray-400 transition-colors">GitHub</a>
              <a href="/docs" className="hover:text-gray-400 transition-colors">Docs</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
