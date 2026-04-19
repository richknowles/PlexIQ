"use client";

/**
 * PlexIQ v5.3.4 - Deletion Success Feedback Banner
 * Chicago Edition - Art Deco styled success notification
 */

interface DeletionFeedbackProps {
  count: number;
  bytesFreed: number;
  executionTime: number;
  onDismiss: () => void;
}

export default function DeletionFeedback({ count, bytesFreed, executionTime, onDismiss }: DeletionFeedbackProps) {
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
    <div
      onClick={onDismiss}
      className="deletion-success-banner"
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "linear-gradient(135deg, #0D2A0D 0%, #1A4520 100%)",
        border: "2px solid #C9A84C",
        borderRadius: "8px",
        padding: "20px 32px",
        minWidth: "400px",
        boxShadow: `
          0 8px 24px rgba(0,0,0,0.8),
          inset 0 1px 0 rgba(201,168,76,0.3),
          0 0 32px rgba(201,168,76,0.25)
        `,
        cursor: "pointer",
        animation: "trashBounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      }}
    >
      {/* Corner Flourishes - Art Deco */}
      <div style={{
        position: "absolute",
        top: "-2px",
        left: "-2px",
        width: "24px",
        height: "24px",
        borderTop: "3px solid #C9A84C",
        borderLeft: "3px solid #C9A84C",
        borderRadius: "8px 0 0 0",
      }} />
      <div style={{
        position: "absolute",
        top: "-2px",
        right: "-2px",
        width: "24px",
        height: "24px",
        borderTop: "3px solid #C9A84C",
        borderRight: "3px solid #C9A84C",
        borderRadius: "0 8px 0 0",
      }} />
      <div style={{
        position: "absolute",
        bottom: "-2px",
        left: "-2px",
        width: "24px",
        height: "24px",
        borderBottom: "3px solid #C9A84C",
        borderLeft: "3px solid #C9A84C",
        borderRadius: "0 0 0 8px",
      }} />
      <div style={{
        position: "absolute",
        bottom: "-2px",
        right: "-2px",
        width: "24px",
        height: "24px",
        borderBottom: "3px solid #C9A84C",
        borderRight: "3px solid #C9A84C",
        borderRadius: "0 0 8px 0",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Animated Trash Icon */}
        <div style={{
          fontSize: "42px",
          animation: "trashWiggle 0.4s ease-in-out 0.3s",
          transformOrigin: "bottom center",
        }}>
          🗑️
        </div>

        <div style={{ flex: 1 }}>
          {/* Title */}
          <div style={{
            fontFamily: "var(--font-audiowide)",
            fontSize: "18px",
            color: "#C9A84C",
            letterSpacing: "0.1em",
            marginBottom: "8px",
            textShadow: "0 0 12px rgba(201,168,76,0.4)",
          }}>
            DELETION COMPLETE
          </div>

          {/* Stats */}
          <div style={{
            display: "flex",
            gap: "24px",
            fontSize: "13px",
            color: "#9ABF9E",
          }}>
            <span>
              <span style={{
                fontFamily: "var(--font-audiowide)",
                color: "#D4F4D7",
                fontSize: "15px",
              }}>
                {count}
              </span>
              {" "}file{count !== 1 ? 's' : ''} removed
            </span>
            <span style={{ color: "#6B7A8D" }}>•</span>
            <span>
              <span style={{
                fontFamily: "var(--font-audiowide)",
                color: "#6FD97F",
                fontSize: "15px",
              }}>
                {formatSize(bytesFreed)}
              </span>
              {" "}freed
            </span>
            <span style={{ color: "#6B7A8D" }}>•</span>
            <span style={{ color: "#8A9A8E", fontSize: "12px" }}>
              {executionTime.toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Dismiss hint */}
        <div style={{
          fontSize: "10px",
          color: "#6B7A8D",
          fontStyle: "italic",
        }}>
          click to dismiss
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes trashBounceIn {
          0%   { transform: translateX(120%) scale(0.8); opacity: 0; }
          60%  { transform: translateX(-50%) translateX(-20px) scale(1.05); opacity: 1; }
          80%  { transform: translateX(-50%) translateX(10px) scale(0.98); }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }

        @keyframes trashWiggle {
          0%, 100% { transform: rotate(0deg); }
          25%      { transform: rotate(-8deg); }
          75%      { transform: rotate(8deg); }
        }

        .deletion-success-banner {
          transition: opacity 0.3s ease-out, transform 0.3s ease-out;
        }

        .deletion-success-banner:hover {
          transform: translateX(-50%) scale(1.02);
          box-shadow:
            0 8px 32px rgba(0,0,0,0.9),
            inset 0 1px 0 rgba(201,168,76,0.4),
            0 0 40px rgba(201,168,76,0.35);
        }
      `}} />
    </div>
  );
}
