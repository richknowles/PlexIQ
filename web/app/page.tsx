"use client";

/**
 * PlexIQ v4.0 - Main Dashboard
 * ProxMenux-inspired minimalist design with THE ONE SLIDER
 *
 * Philosophy: Simple. Powerful. Beautiful.
 * Everything you need, nothing you don't.
 */

import { useState } from 'react';
import ThresholdSlider from '@/components/threshold-slider';
import LibraryStatsDisplay from '@/components/library-stats';
import MustardProgress from '@/components/mustard-progress';
import { LibraryStats } from '@/types/plexiq';

export default function Dashboard() {
  const [threshold, setThreshold] = useState(0.7);
  const [selectedLibrary, setSelectedLibrary] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, stage: '', message: '' });
  const [stats, setStats] = useState<LibraryStats | null>(null);

  // Mock libraries for demo
  const libraries = ['Movies', 'TV Shows', 'Music', '4K Movies'];

  const handleAnalyze = async () => {
    if (!selectedLibrary) {
      alert('Please select a library first');
      return;
    }

    setIsAnalyzing(true);

    // Simulate analysis progress
    const stages = [
      { stage: 'collecting', message: 'Connecting to Plex server...', duration: 1000 },
      { stage: 'collecting', message: 'Collecting metadata...', duration: 2000 },
      { stage: 'enriching', message: 'Enriching with IMDb ratings...', duration: 1500 },
      { stage: 'enriching', message: 'Enriching with TMDb ratings...', duration: 1500 },
      { stage: 'analyzing', message: 'Analyzing media quality...', duration: 2000 },
      { stage: 'analyzing', message: 'Calculating deletion scores...', duration: 1000 },
      { stage: 'complete', message: 'Analysis complete!', duration: 500 },
    ];

    let current = 0;
    const total = 100;

    for (const { stage, message, duration } of stages) {
      setProgress({ current, total, stage, message });
      await new Promise(resolve => setTimeout(resolve, duration));
      current += Math.floor(100 / stages.length);
    }

    // Mock stats
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                PlexIQ
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                v4.0 ProxMenux Edition • Smart Media Management
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-gray-500">Server Status</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400 font-medium">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Library Selection */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Select Library</h3>
              <select
                value={selectedLibrary}
                onChange={(e) => setSelectedLibrary(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                disabled={isAnalyzing}
              >
                <option value="">Choose a library...</option>
                {libraries.map((lib) => (
                  <option key={lib} value={lib}>{lib}</option>
                ))}
              </select>
            </div>

            {/* THE ONE SLIDER */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
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
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-gray-900 font-semibold
                         py-4 px-6 rounded-lg hover:from-amber-400 hover:to-amber-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 shadow-lg hover:shadow-amber-500/50"
              >
                {isAnalyzing ? 'Analyzing...' : '🔍 Analyze Library'}
              </button>

              <button
                disabled={!stats || isAnalyzing}
                className="w-full bg-gray-700 text-gray-100 font-semibold
                         py-4 px-6 rounded-lg hover:bg-gray-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              >
                📊 View Recommendations
              </button>

              <button
                disabled={!stats || isAnalyzing}
                className="w-full bg-red-900/30 border border-red-700/50 text-red-400 font-semibold
                         py-4 px-6 rounded-lg hover:bg-red-900/50
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              >
                🗑️ Delete (Dry Run)
              </button>
            </div>

            {/* Safety Notice */}
            <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🛡️</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-green-400 mb-1">
                    Safety First
                  </div>
                  <div className="text-xs text-gray-400">
                    All operations default to dry-run. Highly-rated content (≥8.0) is never deleted.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Bar */}
            {isAnalyzing && (
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <MustardProgress
                  current={progress.current}
                  total={progress.total}
                  message={progress.message}
                  stage={progress.stage}
                />
              </div>
            )}

            {/* Library Stats */}
            <LibraryStatsDisplay stats={stats} loading={isAnalyzing} />

            {/* Welcome Message */}
            {!stats && !isAnalyzing && (
              <div className="bg-gray-800/50 rounded-lg p-12 border border-gray-700 text-center">
                <div className="text-6xl mb-6">🎬</div>
                <h2 className="text-2xl font-bold text-gray-100 mb-4">
                  Welcome to PlexIQ v4.0
                </h2>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  The ProxMenux-inspired media management revolution. Simple. Powerful. Beautiful.
                </p>
                <div className="inline-block bg-gradient-to-r from-amber-500/20 to-amber-600/20
                               border border-amber-500/30 rounded-lg px-6 py-4">
                  <div className="text-sm text-amber-400 font-semibold mb-2">
                    THE ONE SLIDER Philosophy
                  </div>
                  <div className="text-xs text-gray-400">
                    Everything you need to manage your Plex library intelligently.
                    <br />No complexity. No confusion. Just results.
                  </div>
                </div>
              </div>
            )}

            {/* Results Table Placeholder */}
            {stats && !isAnalyzing && (
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-100">
                    Deletion Recommendations
                  </h3>
                  <span className="text-sm text-gray-400">
                    Showing top 50 candidates
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-700">
                      <tr className="text-left text-gray-400">
                        <th className="pb-3 font-medium">Title</th>
                        <th className="pb-3 font-medium">Score</th>
                        <th className="pb-3 font-medium">Size</th>
                        <th className="pb-3 font-medium">Rating</th>
                        <th className="pb-3 font-medium">Plays</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {[...Array(10)].map((_, i) => (
                        <tr key={i} className="border-b border-gray-800 hover:bg-gray-700/30">
                          <td className="py-3">Sample Movie {i + 1}</td>
                          <td className="py-3">
                            <span className="text-amber-400 font-semibold">
                              {(0.7 + Math.random() * 0.3).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3">2.4 GB</td>
                          <td className="py-3">6.5</td>
                          <td className="py-3">0</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700 text-center">
                  <button className="text-sm text-amber-400 hover:text-amber-300 font-medium">
                    Load more results →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              Built with ❤️ by Rich Knowles • Inspired by{' '}
              <a
                href="https://proxmenux.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300"
              >
                ProxMenux
              </a>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://github.com/richknowles/PlexIQ" className="hover:text-gray-300">
                GitHub
              </a>
              <a href="/docs" className="hover:text-gray-300">
                Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
