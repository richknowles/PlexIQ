"use client";

/**
 * PlexIQ v4.0 - Library Statistics Display
 * ProxMenux-inspired clean, informative cards
 */

import { LibraryStats } from '@/types/plexiq';

interface LibraryStatsProps {
  stats: LibraryStats | null;
  loading?: boolean;
}

export default function LibraryStatsDisplay({ stats, loading = false }: LibraryStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700 text-center">
        <p className="text-gray-400">Select a library to view statistics</p>
      </div>
    );
  }

  const formatSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Items */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm font-medium mb-2">Total Items</div>
          <div className="text-3xl font-bold text-gray-100">{stats.itemCount.toLocaleString()}</div>
        </div>

        {/* Total Size */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm font-medium mb-2">Library Size</div>
          <div className="text-3xl font-bold text-gray-100">{formatSize(stats.totalSize)}</div>
        </div>

        {/* Avg Score */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm font-medium mb-2">Average Score</div>
          <div className="text-3xl font-bold text-amber-400">
            {stats.avgScore ? stats.avgScore.toFixed(2) : 'N/A'}
          </div>
        </div>
      </div>

      {/* Deletion Candidates Panel */}
      <div className="bg-gradient-to-br from-amber-900/20 to-red-900/20 rounded-lg p-6 border border-amber-700/30">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-amber-400 text-sm font-medium mb-2">Deletion Candidates</div>
            <div className="text-4xl font-bold text-gray-100 mb-2">
              {stats.deletionCandidates.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">
              Potential space saved: <span className="text-green-400 font-semibold">
                {formatSize(stats.potentialSpaceSaved)}
              </span>
            </div>
          </div>
          <div className="text-5xl">🗑️</div>
        </div>

        {stats.deletionCandidates > 0 && (
          <div className="mt-4 pt-4 border-t border-amber-700/30">
            <div className="text-xs text-gray-400">
              <span className="text-amber-400 font-semibold">{stats.deletionCandidates}</span> items
              meet the deletion threshold. Review recommendations before proceeding.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
