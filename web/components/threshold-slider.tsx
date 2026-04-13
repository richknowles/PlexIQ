"use client";

/**
 * PlexIQ v4.0 - The ONE SLIDER
 * ProxMenux-inspired minimalist design
 * The ONLY control you need for intelligent media management
 */

import { useState, useCallback } from 'react';

interface ThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function ThresholdSlider({
  value,
  onChange,
  disabled = false
}: ThresholdSliderProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  }, [onChange]);

  const getRecommendationText = (threshold: number): string => {
    if (threshold >= 0.8) return "Very Aggressive - Delete most unwatched content";
    if (threshold >= 0.7) return "Aggressive - Recommended default";
    if (threshold >= 0.6) return "Moderate - Balanced approach";
    if (threshold >= 0.5) return "Conservative - Only obvious candidates";
    return "Very Conservative - Minimal deletions";
  };

  const getColorClass = (threshold: number): string => {
    if (threshold >= 0.8) return "text-red-400";
    if (threshold >= 0.7) return "text-amber-400";
    if (threshold >= 0.6) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="space-y-6">
      {/* The ONE SLIDER Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-100 mb-2">
          Deletion Threshold
        </h2>
        <p className="text-sm text-gray-400">
          Simple. Powerful. The only control you need.
        </p>
      </div>

      {/* Score Display */}
      <div className="text-center">
        <div className="inline-block">
          <div className="text-6xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            {localValue.toFixed(2)}
          </div>
          <div className={`text-sm font-medium mt-2 ${getColorClass(localValue)}`}>
            {getRecommendationText(localValue)}
          </div>
        </div>
      </div>

      {/* The Slider */}
      <div className="relative px-4">
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.01"
          value={localValue}
          onChange={handleChange}
          disabled={disabled}
          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer
                     slider-thumb
                     disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right,
              rgb(34, 197, 94) 0%,
              rgb(234, 179, 8) ${(localValue - 0.5) * 100}%,
              rgb(239, 68, 68) 100%)`
          }}
        />

        {/* Scale Markers */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>0.0</span>
          <span>0.5</span>
          <span>1.0</span>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Current Threshold</div>
            <div className="text-lg font-semibold text-amber-400">{localValue.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-400">Safety Rating</div>
            <div className="text-lg font-semibold text-gray-100">≥ 8.0/10</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            ℹ️ Items with ratings ≥ 8.0/10 are <span className="text-green-400 font-semibold">never deleted</span>,
            regardless of threshold. PlexIQ protects your highly-rated content.
          </p>
        </div>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.5);
          transition: all 0.2s ease;
        }

        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.7);
        }

        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.5);
          transition: all 0.2s ease;
        }

        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.7);
        }
      `}</style>
    </div>
  );
}
