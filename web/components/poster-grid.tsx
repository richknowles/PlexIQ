"use client";

/**
 * PlexIQ v5.4.0 - Poster Grid View
 * Target Acquisition - Visual poster selection with sniper targeting
 */

import { useState } from 'react';

interface Movie {
  id: number;
  ratingKey: string;
  title: string;
  year?: number;
  score: number;
  thumb?: string;
  rating: number;
}

interface PosterGridProps {
  movies: Movie[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  plexHost: string;
  plexToken: string;
}

export default function PosterGrid({
  movies,
  selectedIds,
  onToggleSelect,
  plexHost,
  plexToken
}: PosterGridProps) {

  const getPosterUrl = (thumb: string | undefined) => {
    if (!thumb) return '/placeholder-poster.png'; // Fallback
    // Plex poster URL format
    return `${plexHost}${thumb}?X-Plex-Token=${plexToken}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#E84040'; // High deletion candidate - RED
    if (score >= 65) return '#C9A84C'; // Medium - GOLD
    return '#3A7A3A'; // Low/safe - GREEN
  };

  return (
    <div style={{
      padding: '20px',
      background: '#0A0804',
    }}>
      {/* Grid Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '20px',
        justifyContent: 'center',
      }}>
        {movies.map((movie) => {
          const isSelected = selectedIds.has(movie.id);
          const scoreColor = getScoreColor(movie.score);

          return (
            <div
              key={movie.id}
              onClick={() => onToggleSelect(movie.id)}
              style={{
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Poster Image */}
              <div style={{
                width: '130px',
                height: '195px',
                border: isSelected ? '3px solid #E84040' : '1px solid #2A2318',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: isSelected
                  ? '0 0 20px rgba(232,64,64,0.6), 0 0 40px rgba(232,64,64,0.3)'
                  : '0 2px 8px rgba(0,0,0,0.5)',
                transition: 'all 0.2s ease',
              }}>
                <img
                  src={getPosterUrl(movie.thumb)}
                  alt={movie.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLImageElement).src = '/placeholder-poster.png';
                  }}
                />

                {/* Target Overlay - appears when selected */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'targetLock 0.3s ease-out',
                  }}>
                    <div style={{
                      fontSize: '48px',
                      textShadow: '0 0 20px #E84040, 0 0 40px #E84040',
                      animation: 'targetPulse 1.5s ease-in-out infinite',
                    }}>
                      🎯
                    </div>
                  </div>
                )}
              </div>

              {/* Movie Info Below Poster */}
              <div style={{
                marginTop: '8px',
                width: '130px',
              }}>
                {/* Title */}
                <div style={{
                  fontFamily: 'var(--font-audiowide)',
                  fontSize: '10px',
                  color: '#C8B99A',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.05em',
                }}>
                  {movie.title}
                </div>

                {/* Year and Score */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '9px',
                }}>
                  <span style={{ color: '#6B5E3C' }}>
                    {movie.year || 'N/A'}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-audiowide)',
                    color: scoreColor,
                    fontWeight: 'bold',
                  }}>
                    {Math.round(movie.score)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes targetLock {
          0%   { opacity: 0; transform: scale(0.5); }
          60%  { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes targetPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.1); opacity: 0.8; }
        }
      `}} />
    </div>
  );
}
