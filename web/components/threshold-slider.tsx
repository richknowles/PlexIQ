"use client";

import { useState, useCallback, useRef } from "react";

interface ThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const sliderCSS = `
  @keyframes hotdogBob {
    0%, 100% { transform: translateY(0) rotate(-5deg); }
    50%       { transform: translateY(-5px) rotate(5deg); }
  }
  @keyframes hotdogGrab {
    0%   { transform: scale(1) rotate(0deg); }
    100% { transform: scale(1.35) rotate(20deg); }
  }
  @keyframes steamRise {
    0%   { opacity: 0.8; transform: translateY(0) scaleX(1); }
    100% { opacity: 0; transform: translateY(-16px) scaleX(1.4); }
  }

  .hotdog-idle { animation: hotdogBob 2.4s ease-in-out infinite; }
  .hotdog-grabbed {
    animation: hotdogGrab 0.15s ease-out forwards;
    filter: drop-shadow(0 0 12px #C9A84C) drop-shadow(0 0 4px #fff8);
  }

  .plexiq-track::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 0; height: 0;
  }
  .plexiq-track::-moz-range-thumb {
    width: 0; height: 0; border: none;
    background: transparent;
  }
  .plexiq-track {
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    border-radius: 3px;
    outline: none;
    cursor: grab;
  }
  .plexiq-track:active { cursor: grabbing; }

  .steam-particle {
    position: absolute;
    width: 6px; height: 10px;
    background: radial-gradient(ellipse, #ffffff88 0%, transparent 80%);
    border-radius: 50%;
    pointer-events: none;
    animation: steamRise 1s ease-out infinite;
  }
  .steam-particle:nth-child(2) { animation-delay: 0.3s; left: 6px; }
  .steam-particle:nth-child(3) { animation-delay: 0.6s; left: -4px; }

  .deco-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, #C9A84C88, transparent);
  }
`;

export default function ThresholdSlider({ value, onChange, disabled = false }: ThresholdSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isGrabbed, setIsGrabbed] = useState(false);
  const trackRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setLocalValue(v);
    onChange(v);
  }, [onChange]);

  const getLabel = (t: number) => {
    if (t >= 0.85) return "Very Aggressive";
    if (t >= 0.70) return "Aggressive";
    if (t >= 0.55) return "Moderate";
    if (t >= 0.40) return "Conservative";
    return "Very Conservative";
  };

  const getGoldShade = (t: number) => {
    if (t >= 0.85) return "#E84040";
    if (t >= 0.70) return "#C9A84C";
    if (t >= 0.55) return "#D4AF37";
    if (t >= 0.40) return "#8B9670";
    return "#6B7A8D";
  };

  const hotdogPct = (localValue - 0) / (1 - 0);
  const hotdogLeft = `calc(${hotdogPct * 100}% - ${16 + hotdogPct * 8}px)`;
  const trackBg = `linear-gradient(90deg, #C9A84C ${localValue * 100}%, #2A2318 ${localValue * 100}%)`;

  return (
    <div className="space-y-4 select-none">
      <style dangerouslySetInnerHTML={{ __html: sliderCSS }} />

      {/* Title */}
      <div className="flex items-center justify-between">
        <div style={{fontFamily: "var(--font-audiowide)", fontSize: "11px", letterSpacing: "0.15em", color: "#C9A84C"}}>
          DELETION THRESHOLD
        </div>
        <div style={{fontFamily: "var(--font-audiowide)", fontSize: "20px", color: getGoldShade(localValue), textShadow: `0 0 20px ${getGoldShade(localValue)}66`}}>
          {localValue.toFixed(2)}
        </div>
      </div>

      <div className="deco-line" />

      {/* Slider with floating hotdog */}
      <div className="relative pt-10 pb-2">
        {/* Floating hotdog */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: hotdogLeft,
            fontSize: "28px",
            lineHeight: 1,
            transition: isGrabbed ? "none" : "left 0.08s ease-out",
            zIndex: 10,
            pointerEvents: "none",
          }}
          className={isGrabbed ? "hotdog-grabbed" : "hotdog-idle"}
        >
          {/* Steam particles when hot (high threshold) */}
          {localValue >= 0.7 && (
            <div style={{position: "absolute", top: "-14px", left: "4px", width: "20px", height: "14px"}}>
              <div className="steam-particle" style={{position: "absolute", left: "0"}} />
              <div className="steam-particle" />
              <div className="steam-particle" />
            </div>
          )}
          🌭
        </div>

        {/* Track */}
        <input
          ref={trackRef}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={localValue}
          onChange={handleChange}
          onMouseDown={() => setIsGrabbed(true)}
          onMouseUp={() => setIsGrabbed(false)}
          onTouchStart={() => setIsGrabbed(true)}
          onTouchEnd={() => setIsGrabbed(false)}
          disabled={disabled}
          className="plexiq-track w-full"
          style={{
            background: trackBg,
            boxShadow: isGrabbed ? `0 0 8px #C9A84C66` : "none",
            border: "1px solid #3A3020",
          }}
        />
      </div>

      {/* Label & Safety */}
      <div className="flex items-center justify-between">
        <span style={{fontSize: "12px", color: getGoldShade(localValue), fontWeight: 600}}>
          {getLabel(localValue)}
        </span>
        <span style={{fontSize: "11px", color: "#6B5E3C"}}>
          {localValue >= 0.7 ? "Ratings ≥8.0 protected" : "Safe zone"}
        </span>
      </div>

      <div className="deco-line" />

      {/* Scale markers */}
      <div className="flex justify-between px-0.5">
        {["0.0", "0.25", "0.5", "0.75", "1.0"].map((v) => (
          <div key={v} style={{fontSize: "9px", color: "#4A3F28", fontFamily: "var(--font-audiowide)"}}>
            {v}
          </div>
        ))}
      </div>
    </div>
  );
}
