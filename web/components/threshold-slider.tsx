"use client";

/**
 * PlexIQ v4.0 - The ONE SLIDER
 * ProxMenux-inspired minimalist design
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
    if (threshold >= 0.8) return "Very Aggressive — delete most unwatched";
    if (threshold >= 0.7) return "Aggressive — recommended default";
    if (threshold >= 0.6) return "Moderate — balanced approach";
    if (threshold >= 0.5) return "Conservative — obvious candidates only";
    return "Very Conservative — minimal deletions";
  };

  const getColor = (threshold: number): string => {
    if (threshold >= 0.8) return "#ef4444";
    if (threshold >= 0.7) return "#F4A940";
    if (threshold >= 0.6) return "#eab308";
    return "#22c55e";
  };

  const thumbStyle = `
    .plexiq-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(251,191,36,0.5);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .plexiq-slider::-webkit-slider-thumb:hover {
      transform: scale(1.2);
      box-shadow: 0 4px 12px rgba(251,191,36,0.7);
    }
    .plexiq-slider::-moz-range-thumb {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 8px rgba(251,191,36,0.5);
    }
    .plexiq-slider {
      -webkit-appearance: none;
      appearance: none;
      height: 10px;
      border-radius: 5px;
      outline: none;
      cursor: pointer;
    }
  `;

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: thumbStyle }} />

      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-100 mb-1">
          Deletion Threshold
        </h2>
        <p className="text-sm text-gray-400">
          The only control you need.
        </p>
      </div>

      <div className="text-center">
        <div
          className="text-6xl font-bold"
          style={{ color: getColor(localValue) }}
        >
          {localValue.toFixed(2)}
        </div>
        <div
          className="text-sm font-medium mt-2"
          style={{ color: getColor(localValue) }}
        >
          {getRecommendationText(localValue)}
        </div>
      </div>

      <div className="relative px-2">
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.01"
          value={localValue}
          onChange={handleChange}
          disabled={disabled}
          className="plexiq-slider w-full disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right,
              #22c55e 0%,
              #F4A940 ${localValue * 50}%,
              #ef4444 ${localValue * 100}%,
              #334155 ${localValue * 100}%,
              #334155 100%)`
          }}
        />
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>0.0</span>
          <span>0.5</span>
          <span>1.0</span>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Threshold</div>
            <div className="text-lg font-semibold" style={{ color: "#F4A940" }}>
              {localValue.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Protected</div>
            <div className="text-lg font-semibold text-gray-100">≥ 8.0/10</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            ℹ️ Items rated ≥ 8.0/10 are{' '}
            <span className="text-green-400 font-semibold">never deleted</span>,
            regardless of threshold.
          </p>
        </div>
      </div>
    </div>
  );
}
