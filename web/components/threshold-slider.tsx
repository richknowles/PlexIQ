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
    50%       { transform: translateY(-8px) rotate(6deg); }
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
    height: 16px;
    border-radius: 8px;
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

  /* Grab handle - simple button style that's clearly draggable */
  .grab-handle {
    width: 50px;
    height: 24px;
    border-radius: 4px;
    background: linear-gradient(135deg, #C9A84C 0%, #8B6914 100%);
    border: 2px solid #E8C96C;
    box-shadow:
      0 4px 12px rgba(0,0,0,0.8),
      inset 0 1px 0 rgba(255,240,190,0.4),
      inset 0 -2px 0 rgba(0,0,0,0.3),
      0 0 12px #C9A84C33;
    transition: all 0.15s;
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #0D0A04;
    font-weight: bold;
  }
  .grab-handle:active {
    cursor: grabbing;
    transform: scale(0.98);
    box-shadow:
      0 2px 8px rgba(0,0,0,0.9),
      inset 0 1px 0 rgba(255,240,190,0.4),
      inset 0 -2px 0 rgba(0,0,0,0.3),
      0 0 18px #C9A84C66;
  }

  .deco-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, #C9A84C88, transparent);
  }
`;

export default function ThresholdSlider({ value, onChange, disabled = false }: ThresholdSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isGrabbed, setIsGrabbed]   = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setLocalValue(v);
    onChange(v);
  }, [onChange]);

  const getLabel = (t: number) => {
    if (t >= 85) return "Very Aggressive";
    if (t >= 70) return "Aggressive";
    if (t >= 55) return "Moderate";
    if (t >= 40) return "Conservative";
    return "Very Conservative";
  };

  const getAccentColor = (t: number) => {
    if (t >= 85) return "#E84040";
    if (t >= 70) return "#C9A84C";
    if (t >= 55) return "#D4AF37";
    if (t >= 40) return "#8B9670";
    return "#6B7A8D";
  };

  const pct          = localValue / 100; // Convert 0-100 to 0-1 for positioning
  const hotdogLeft   = `calc(${pct * 100}% - ${14 + pct * 12}px)`;
  const trackBg      = `linear-gradient(90deg, #C9A84C ${localValue}%, #2A2318 ${localValue}%)`;
  const hotdogSize   = Math.round(26 + (localValue / 100) * 20);
  const steamLevel   = localValue >= 85 ? 3 : localValue >= 65 ? 2 : localValue >= 45 ? 1 : 0;
  const accentColor  = getAccentColor(localValue);

  const steamParticles = [
    { left: "8px",  delay: "0s",    w: "8px",  h: "14px" },
    { left: "18px", delay: "0.28s", w: "6px",  h: "12px" },
    { left: "0px",  delay: "0.55s", w: "6px",  h: "11px" },
    { left: "22px", delay: "0.8s",  w: "5px",  h: "10px" },
    { left: "-4px", delay: "1.05s", w: "5px",  h: "9px"  },
  ].slice(0, steamLevel === 3 ? 5 : steamLevel === 2 ? 3 : 2);

  return (
    <div className="space-y-4 select-none">
      <style dangerouslySetInnerHTML={{ __html: sliderCSS }} />

      {/* Title row */}
      <div className="flex items-center justify-between">
        <div style={{ fontFamily:"var(--font-audiowide)", fontSize:"11px", letterSpacing:"0.15em", color:"#C9A84C" }}>
          AGGRESSIVENESS
        </div>
        <div style={{ fontFamily:"var(--font-audiowide)", fontSize:"20px", color:accentColor, textShadow:`0 0 20px ${accentColor}66`, transition:"color 0.3s, text-shadow 0.3s" }}>
          {Math.round(localValue)}
        </div>
      </div>

      <div className="deco-line" />

      {/* Slider area */}
      <div className="relative" style={{ paddingTop:"58px", paddingBottom:"24px", position:"relative" }}>

        {/* ── HOTDOG ASSEMBLY ──
            Floats above the track and bobs freely.
            No grab disc here — disc is a separate sibling below.
            This eliminates the flexbox-diagonal artifact. */}
        <div style={{
          position: "absolute",
          top: 0,
          left: hotdogLeft,
          zIndex: 10,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transition: isGrabbed ? "none" : "left 0.06s ease-out",
        }}>
          {/* Steam cloud */}
          {steamLevel > 0 && (
            <div style={{ position:"relative", width:"32px", height: steamLevel === 3 ? "22px" : "16px", marginBottom:"2px" }}>
              {steamParticles.map((s, i) => (
                <div key={i} className="steam-p" style={{
                  left: s.left, bottom: 0, width: s.w, height: s.h,
                  background: steamLevel === 3
                    ? "radial-gradient(ellipse, #ffffffaa 0%, transparent 80%)"
                    : "radial-gradient(ellipse, #ffffff77 0%, transparent 80%)",
                  animation: `${steamLevel === 3 ? "steamRiseBig" : "steamRise"} ${steamLevel === 3 ? "0.75s" : "1.0s"} ease-out ${s.delay} infinite`,
                }} />
              ))}
            </div>
          )}

          {/* Hotdog — bobs and glows with aggression.
              No stem below it — stem removed to kill the diagonal. */}
          <div
            className={isGrabbed ? "hotdog-grabbed" : "hotdog-idle"}
            style={{
              fontSize: `${hotdogSize}px`,
              lineHeight: 1,
              filter: localValue >= 0.7
                ? `drop-shadow(0 0 ${Math.round(localValue * 14)}px ${accentColor}88)`
                : "none",
              transition: "font-size 0.2s ease-out, filter 0.3s",
            }}
          >
            🌭
          </div>
        </div>

        {/* Track - v5.3.3: Increased height for easier grabbing */}
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={localValue}
          onChange={handleChange}
          onMouseDown={() => setIsGrabbed(true)}
          onMouseUp={()   => setIsGrabbed(false)}
          onTouchStart={() => setIsGrabbed(true)}
          onTouchEnd={()   => setIsGrabbed(false)}
          disabled={disabled}
          className="plexiq-track w-full"
          style={{
            background: trackBg,
            boxShadow: isGrabbed ? "0 0 10px #C9A84C55" : "none",
            border: "1px solid #3A3020",
            transition: "box-shadow 0.15s",
            height: "16px",
            cursor: "grab",
            position: "relative",
            zIndex: 8,
          }}
        />

        {/* ── GRAB HANDLE ──
            Positioned to align exactly with the track center. */}
        <div
          className="grab-handle"
          style={{
            position: "absolute",
            top: "54px", // Center on 16px track: paddingTop(58) - (handleHeight(24)-trackHeight(16))/2 = 54
            left: hotdogLeft,
            transform: "translateX(-50%)",
            zIndex: 10,
            transition: isGrabbed ? "none" : "left 0.06s ease-out",
            background: isGrabbed
              ? `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`
              : "linear-gradient(135deg, #C9A84C 0%, #8B6914 100%)",
            pointerEvents: "none",
          }}
        >
          ⋮⋮
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize:"12px", color:accentColor, fontWeight:600, transition:"color 0.3s" }}>
          {getLabel(localValue)}
        </span>
        <span style={{ fontSize:"11px", color:"#6B5E3C" }}>
          {localValue === 0 ? "No candidates" : localValue >= 70 ? "Ratings \u22658.0 always protected" : "Fewer candidates"}
        </span>
      </div>

      <div className="deco-line" />

      {/* Scale markers */}
      <div className="flex justify-between px-0.5">
        {["0", "25", "50", "75", "100"].map((v) => (
          <div key={v} style={{ fontSize:"9px", color:"#4A3F28", fontFamily:"var(--font-audiowide)" }}>{v}</div>
        ))}
      </div>
    </div>
  );
}
