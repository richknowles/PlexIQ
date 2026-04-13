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
    50%       { transform: translateY(-6px) rotate(6deg); }
  }
  @keyframes hotdogGrab {
    0%   { transform: scale(1) rotate(0deg); }
    100% { transform: scale(1.35) rotate(20deg); }
  }
  @keyframes steamRise {
    0%   { opacity: 0.85; transform: translateY(0) scaleX(1); }
    100% { opacity: 0; transform: translateY(-22px) scaleX(1.6); }
  }
  @keyframes steamRiseBig {
    0%   { opacity: 1; transform: translateY(0) scaleX(1.2); }
    100% { opacity: 0; transform: translateY(-32px) scaleX(2.2); }
  }
  @keyframes stemPulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  .hotdog-idle { animation: hotdogBob 2.4s ease-in-out infinite; }
  .hotdog-grabbed {
    animation: hotdogGrab 0.15s ease-out forwards;
    filter: drop-shadow(0 0 14px #C9A84C) drop-shadow(0 0 5px #fff9);
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
    height: 10px;
    border-radius: 5px;
    outline: none;
    cursor: grab;
    touch-action: pan-y;
  }
  .plexiq-track:active { cursor: grabbing; }

  .steam-p {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }

  .grab-indicator {
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 28px;
    height: 12px;
    border: 1.5px solid #C9A84C88;
    border-radius: 6px;
    background: linear-gradient(180deg, #2A2318 0%, #1A1408 100%);
    box-shadow: 0 0 8px #C9A84C33;
  }

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

  const getAccentColor = (t: number) => {
    if (t >= 0.85) return "#E84040";
    if (t >= 0.70) return "#C9A84C";
    if (t >= 0.55) return "#D4AF37";
    if (t >= 0.40) return "#8B9670";
    return "#6B7A8D";
  };

  const pct = localValue;
  const hotdogLeft = `calc(${pct * 100}% - ${14 + pct * 12}px)`;
  const trackBg = `linear-gradient(90deg, #C9A84C ${localValue * 100}%, #2A2318 ${localValue * 100}%)`;

  // Hotdog grows from 26px to 46px as value increases
  const hotdogSize = Math.round(26 + localValue * 20);

  // Steam intensity levels
  const steamLevel = localValue >= 0.85 ? 3 : localValue >= 0.65 ? 2 : localValue >= 0.45 ? 1 : 0;

  const steamParticles = [
    { left: "8px",  delay: "0s",    w: "8px",  h: "14px" },
    { left: "18px", delay: "0.28s", w: "6px",  h: "12px" },
    { left: "0px",  delay: "0.55s", w: "6px",  h: "11px" },
    { left: "22px", delay: "0.8s",  w: "5px",  h: "10px" },
    { left: "-4px", delay: "1.05s", w: "5px",  h: "9px"  },
  ].slice(0, steamLevel === 3 ? 5 : steamLevel === 2 ? 3 : 2);

  const accentColor = getAccentColor(localValue);

  return (
    <div className="space-y-4 select-none">
      <style dangerouslySetInnerHTML={{ __html: sliderCSS }} />

      {/* Title row */}
      <div className="flex items-center justify-between">
        <div style={{fontFamily: "var(--font-audiowide)", fontSize: "11px", letterSpacing: "0.15em", color: "#C9A84C"}}>
          DELETION THRESHOLD
        </div>
        <div style={{fontFamily: "var(--font-audiowide)", fontSize: "20px", color: accentColor, textShadow: `0 0 20px ${accentColor}66`, transition: "color 0.3s, text-shadow 0.3s"}}>
          {localValue.toFixed(2)}
        </div>
      </div>

      <div className="deco-line" />

      {/* Slider area */}
      <div className="relative" style={{paddingTop: "56px", paddingBottom: "18px"}}>

        {/* Floating hotdog assembly */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: hotdogLeft,
            zIndex: 10,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transition: isGrabbed ? "none" : "left 0.06s ease-out",
          }}
        >
          {/* Steam cloud */}
          {steamLevel > 0 && (
            <div style={{position: "relative", width: "32px", height: steamLevel === 3 ? "22px" : "16px", marginBottom: "1px"}}>
              {steamParticles.map((s, i) => (
                <div
                  key={i}
                  className="steam-p"
                  style={{
                    left: s.left,
                    bottom: 0,
                    width: s.w,
                    height: s.h,
                    background: steamLevel === 3
                      ? "radial-gradient(ellipse, #ffffffaa 0%, transparent 80%)"
                      : "radial-gradient(ellipse, #ffffff77 0%, transparent 80%)",
                    animation: `${steamLevel === 3 ? "steamRiseBig" : "steamRise"} ${steamLevel === 3 ? "0.75s" : "1.0s"} ease-out ${s.delay} infinite`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Hotdog — grows and glows with aggression */}
          <div
            className={isGrabbed ? "hotdog-grabbed" : "hotdog-idle"}
            style={{
              fontSize: `${hotdogSize}px`,
              lineHeight: 1,
              filter: localValue >= 0.7 ? `drop-shadow(0 0 ${Math.round(localValue * 14)}px ${accentColor}88)` : "none",
              transition: "font-size 0.2s ease-out, filter 0.3s",
            }}
          >
            🌭
          </div>

          {/* Gold stem connecting hotdog to track */}
          <div style={{
            width: "2px",
            height: "12px",
            background: `linear-gradient(180deg, ${accentColor}bb, ${accentColor}22)`,
            animation: isGrabbed ? "none" : "stemPulse 2.4s ease-in-out infinite",
            marginTop: "1px",
          }} />

          {/* Grab indicator pill — the thing users actually grab */}
          <div className="grab-indicator" style={{
            borderColor: isGrabbed ? accentColor : "#C9A84C88",
            boxShadow: isGrabbed ? `0 0 12px ${accentColor}66` : "0 0 6px #C9A84C22",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }} />
        </div>

        {/* The actual range input */}
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
            boxShadow: isGrabbed ? `0 0 10px #C9A84C55` : "none",
            border: "1px solid #3A3020",
            transition: "box-shadow 0.15s",
          }}
        />
      </div>

      {/* Label & Safety note */}
      <div className="flex items-center justify-between">
        <span style={{fontSize: "12px", color: accentColor, fontWeight: 600, transition: "color 0.3s"}}>
          {getLabel(localValue)}
        </span>
        <span style={{fontSize: "11px", color: "#6B5E3C"}}>
          {localValue >= 0.7 ? "Ratings \u22658.0 protected" : "Safe zone"}
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
