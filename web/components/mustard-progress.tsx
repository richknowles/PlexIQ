"use client";

const shimmerCSS = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;

interface MustardProgressProps {
  current: number;
  total: number;
  message?: string;
  stage?: string;
}

export default function MustardProgress({
  current,
  total,
  message = "Processing...",
  stage = ""
}: MustardProgressProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="w-full space-y-2">
      <style dangerouslySetInnerHTML={{ __html: shimmerCSS }} />
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
          <span className="text-gray-300 font-medium">{message}</span>
        </div>
        {stage && <span className="text-gray-500 text-xs uppercase tracking-wider">{stage}</span>}
      </div>
      <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{current.toLocaleString()} / {total.toLocaleString()}</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
    </div>
  );
}
