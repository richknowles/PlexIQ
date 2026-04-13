"use client";

import { useState } from "react";
import ThresholdSlider from "@/components/threshold-slider";
import LibraryStatsDisplay from "@/components/library-stats";
import MustardProgress from "@/components/mustard-progress";
import { LibraryStats } from "@/types/plexiq";

const decorCSS = `
  @keyframes decoFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  .deco-card {
    background: linear-gradient(160deg, #181410 0%, #111008 100%);
    border: 1px solid #2A2318;
    border-radius: 4px;
    position: relative;
  }
  .deco-card::before, .deco-card::after {
    content: "";
    position: absolute;
    width: 12px; height: 12px;
    border-color: #C9A84C;
    border-style: solid;
    opacity: 0.6;
  }
  .deco-card::before { top: 4px; left: 4px; border-width: 1px 0 0 1px; }
  .deco-card::after  { bottom: 4px; right: 4px; border-width: 0 1px 1px 0; }
  .deco-sep {
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, #C9A84C55 30%, #C9A84C88 50%, #C9A84C55 70%, transparent 100%);
    margin: 0;
  }
  .gold-text { color: #C9A84C; }
  .untouchable-btn {
    background: linear-gradient(135deg, #1A1408 0%, #0D0A04 100%);
    border: 1px solid #C9A84C66;
    color: #C9A84C;
    font-family: var(--font-audiowide);
    letter-spacing: 0.08em;
    font-size: 12px;
    transition: all 0.2s;
    cursor: pointer;
    padding: 14px 20px;
    border-radius: 2px;
    width: 100%;
  }
  .untouchable-btn:hover { background: linear-gradient(135deg, #2A1E08 0%, #1A1208 100%); border-color: #C9A84C; box-shadow: 0 0 16px #C9A84C22; }
  .untouchable-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .untouchable-btn.primary {
    background: linear-gradient(135deg, #C9A84C 0%, #8B6914 100%);
    color: #0D0A04;
    border-color: #E8C96C;
  }
  .untouchable-btn.primary:hover { background: linear-gradient(135deg, #E8C96C 0%, #C9A84C 100%); box-shadow: 0 0 24px #C9A84C44; }
  .untouchable-btn.danger { border-color: #8B1C1C88; color: #C05050; }
  .untouchable-btn.danger:hover { background: linear-gradient(135deg, #2A0808 0%, #1A0404 100%); border-color: #C05050; box-shadow: 0 0 16px #8B1C1C33; }
  .untouchable-btn.danger.live { border-color: #C05050; color: #E07070; background: linear-gradient(135deg, #3A0808 0%, #1A0404 100%); }
  .star-btn { background: none; border: none; cursor: pointer; padding: 2px 6px; font-size: 16px; transition: transform 0.15s, filter 0.15s; }
  .star-btn:hover { transform: scale(1.2); filter: drop-shadow(0 0 4px #C9A84C); }
  .star-btn.starred { filter: drop-shadow(0 0 6px #C9A84C); }
  .result-row { transition: background 0.15s; border-bottom: 1px solid #1A1408; }
  .result-row:hover { background: #1A1408; }
  .tab-btn {
    font-family: var(--font-audiowide);
    font-size: 11px;
    letter-spacing: 0.12em;
    padding: 10px 20px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    background: none;
    color: #4A3F28;
  }
  .tab-btn.active { border-color: #C9A84C66; color: #C9A84C; background: #1A1408; box-shadow: 0 0 12px #C9A84C11; }
  .tab-btn:hover:not(.active) { color: #8B7355; border-color: #2A2318; }
  a.resume-link { color: #C9A84C; text-decoration: none; transition: color 0.2s, text-shadow 0.2s; }
  a.resume-link:hover { color: #E8C96C; text-shadow: 0 0 10px #C9A84C88; }
`;

// Scores = deletion scores (0=keeper, 1=delete this).
// More aggressive threshold = lower bar = more candidates shown.
// Filter: score >= (1 - threshold)
const ALL_MOCK_MOVIES = [
  { id:  1, title: "Blade Runner 2049",          score: 0.92, size: "18.4 GB", rating: 8.0, plays: 0 },
  { id:  2, title: "The Lighthouse",             score: 0.88, size: "12.1 GB", rating: 7.5, plays: 0 },
  { id:  3, title: "Midsommar",                  score: 0.83, size: "9.8 GB",  rating: 7.1, plays: 1 },
  { id:  4, title: "Enemy",                      score: 0.78, size: "7.2 GB",  rating: 6.9, plays: 0 },
  { id:  5, title: "Annihilation",               score: 0.73, size: "14.3 GB", rating: 6.8, plays: 0 },
  { id:  6, title: "Hereditary",                 score: 0.68, size: "8.9 GB",  rating: 7.3, plays: 2 },
  { id:  7, title: "Under the Silver Lake",      score: 0.62, size: "6.4 GB",  rating: 6.2, plays: 0 },
  { id:  8, title: "mother!",                    score: 0.57, size: "11.2 GB", rating: 6.7, plays: 1 },
  { id:  9, title: "The House That Jack Built",  score: 0.51, size: "10.5 GB", rating: 6.8, plays: 0 },
  { id: 10, title: "High Life",                  score: 0.46, size: "7.7 GB",  rating: 6.4, plays: 0 },
  { id: 11, title: "Suspiria (2018)",             score: 0.41, size: "15.2 GB", rating: 6.8, plays: 0 },
  { id: 12, title: "Border",                     score: 0.37, size: "5.9 GB",  rating: 7.1, plays: 1 },
  { id: 13, title: "Cold War",                   score: 0.33, size: "8.3 GB",  rating: 7.6, plays: 0 },
  { id: 14, title: "The Favourite",              score: 0.28, size: "12.8 GB", rating: 7.6, plays: 1 },
  { id: 15, title: "First Reformed",             score: 0.24, size: "6.1 GB",  rating: 7.5, plays: 0 },
];

const PAGE_SIZE = 7;

export default function Dashboard() {
  const [threshold, setThreshold] = useState(0.5);
  const [selectedLibrary, setSelectedLibrary] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 0, stage: "", message: "" });
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [activeTab, setActiveTab] = useState<"analyze" | "saved">("analyze");
  const [starred, setStarred] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const libraries = ["Movies", "TV Shows", "Music", "4K Movies"];

  const toggleStar = (id: number) => {
    setStarred(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAnalyze = async () => {
    if (!selectedLibrary) { alert("Select a library first"); return; }
    setIsAnalyzing(true);
    setVisibleCount(PAGE_SIZE);
    const stages = [
      { stage: "connecting",  message: "Connecting to Plex...",           duration: 700  },
      { stage: "collecting",  message: "Pulling metadata...",             duration: 1400 },
      { stage: "enriching",   message: "Fetching IMDb ratings...",        duration: 1100 },
      { stage: "enriching",   message: "Fetching TMDb data...",           duration: 1000 },
      { stage: "scoring",     message: "Calculating deletion scores...",  duration: 1400 },
      { stage: "complete",    message: "Analysis complete.",              duration: 300  },
    ];
    let current = 0;
    for (const { stage, message, duration } of stages) {
      setProgress({ current, total: 100, stage, message });
      await new Promise(r => setTimeout(r, duration));
      current += Math.floor(100 / stages.length);
    }
    setStats({ name: selectedLibrary, itemCount: 1247, totalSize: 5_432_109_876_543, avgScore: 0.65, deletionCandidates: 342, potentialSpaceSaved: 1_234_567_890_123 });
    setIsAnalyzing(false);
    setActiveTab("analyze");
  };

  // Higher threshold = more aggressive = lower bar = more candidates
  // score >= (1 - threshold): threshold 0.9 → score >= 0.1 → most items
  // threshold 0.1 → score >= 0.9 → only the worst items
  const filteredMovies = ALL_MOCK_MOVIES.filter(m => m.score >= (1 - threshold));
  const savedMovies = ALL_MOCK_MOVIES.filter(m => starred.has(m.id));
  const visibleFiltered = filteredMovies.slice(0, visibleCount);
  const hasMore = filteredMovies.length > visibleCount;

  const ScoreCell = ({ score }: { score: number }) => {
    const color = score >= 0.85 ? "#E84040" : score >= 0.65 ? "#C9A84C" : "#8B7355";
    return <span style={{ color, fontWeight: 700, fontFamily: "var(--font-audiowide)", fontSize: "13px" }}>{score.toFixed(2)}</span>;
  };

  const ResultTable = ({ movies, showEmpty }: { movies: typeof ALL_MOCK_MOVIES, showEmpty: string }) => (
    movies.length === 0 ? (
      <div style={{ textAlign: "center", padding: "48px 0", color: "#4A3F28", fontFamily: "var(--font-audiowide)", fontSize: "11px", letterSpacing: "0.12em" }}>
        {showEmpty}
      </div>
    ) : (
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #2A2318" }}>
            {["", "TITLE", "SCORE", "SIZE", "RTG", "PLAYS"].map(h => (
              <th key={h} style={{ padding: "10px 8px", textAlign: "left", fontFamily: "var(--font-audiowide)", fontSize: "9px", letterSpacing: "0.15em", color: "#4A3F28", fontWeight: 400 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {movies.map(m => (
            <tr key={m.id} className="result-row">
              <td style={{ padding: "10px 4px 10px 8px" }}>
                <button className={"star-btn" + (starred.has(m.id) ? " starred" : "")} onClick={() => toggleStar(m.id)} title={starred.has(m.id) ? "Remove from saved" : "Save this title"}>
                  {starred.has(m.id) ? "\u2B50" : "\u2606"}
                </button>
              </td>
              <td style={{ padding: "10px 8px", color: "#C8B99A", fontSize: "13px" }}>{m.title}</td>
              <td style={{ padding: "10px 8px" }}><ScoreCell score={m.score} /></td>
              <td style={{ padding: "10px 8px", color: "#6B5E3C", fontSize: "12px" }}>{m.size}</td>
              <td style={{ padding: "10px 8px", color: "#6B5E3C", fontSize: "12px" }}>{m.rating}</td>
              <td style={{ padding: "10px 8px", color: "#4A3F28", fontSize: "12px" }}>{m.plays}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0A0804", color: "#C8B99A" }}>
      <style dangerouslySetInnerHTML={{ __html: decorCSS }} />

      {/* ─── HEADER ─── */}
      <header style={{ borderBottom: "1px solid #2A2318", background: "#0D0A04", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, #C9A84C, #E8C96C, #C9A84C, transparent)" }} />

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ fontSize: "42px", lineHeight: 1, userSelect: "none" }}>🌭</div>
              <div>
                <h1 style={{ fontFamily: "var(--font-audiowide)", fontSize: "28px", letterSpacing: "0.06em", background: "linear-gradient(135deg, #E8C96C 0%, #C9A84C 50%, #8B6914 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
                  PLEXIQ
                </h1>
                <p style={{ margin: 0, fontSize: "9px", letterSpacing: "0.25em", color: "#4A3F28", fontFamily: "var(--font-audiowide)", marginTop: "2px" }}>
                  v5.3 · CHICAGO EDITION
                </p>
              </div>
            </div>

            {/* Right controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              {/* Dry-run toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "10px", color: "#4A3F28", fontFamily: "var(--font-audiowide)", letterSpacing: "0.1em" }}>
                  {isDryRun ? "DRY RUN" : "LIVE MODE"}
                </span>
                <div
                  onClick={() => setIsDryRun(!isDryRun)}
                  style={{
                    position: "relative", width: "44px", height: "22px", borderRadius: "11px", cursor: "pointer",
                    background: isDryRun ? "#1A1408" : "#3A0808", border: `1px solid ${isDryRun ? "#2A2318" : "#8B1C1C"}`,
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: "3px", width: "16px", height: "16px", borderRadius: "50%",
                    background: isDryRun ? "#4A3F28" : "#C05050", left: isDryRun ? "3px" : "25px", transition: "all 0.2s",
                  }} />
                </div>
              </div>

              {/* Plex status */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "9px", color: "#4A3F28", fontFamily: "var(--font-audiowide)", letterSpacing: "0.1em" }}>PLEX SERVER</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#3A7A3A", boxShadow: "0 0 6px #3A7A3A" }} />
                  <span style={{ fontSize: "11px", color: "#3A7A3A", fontFamily: "var(--font-audiowide)", letterSpacing: "0.05em" }}>CONNECTED</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="deco-sep" />
      </header>

      {/* Live warning */}
      {!isDryRun && (
        <div style={{ background: "#2A0404", borderBottom: "1px solid #8B1C1C55", padding: "8px 24px", textAlign: "center", fontFamily: "var(--font-audiowide)", fontSize: "10px", letterSpacing: "0.15em", color: "#C05050" }}>
          ⚠ LIVE MODE — DELETIONS ARE PERMANENT AND IRREVERSIBLE
        </div>
      )}

      {/* ─── MAIN ─── */}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px" }}>

          {/* ─── LEFT PANEL ─── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Library selector */}
            <div className="deco-card" style={{ padding: "20px" }}>
              <div style={{ fontFamily: "var(--font-audiowide)", fontSize: "9px", letterSpacing: "0.2em", color: "#4A3F28", marginBottom: "12px" }}>SELECT LIBRARY</div>
              <select
                value={selectedLibrary}
                onChange={e => setSelectedLibrary(e.target.value)}
                disabled={isAnalyzing}
                style={{
                  width: "100%", background: "#0D0A04", border: "1px solid #2A2318",
                  color: "#C8B99A", padding: "10px 14px", fontFamily: "var(--font-audiowide)",
                  fontSize: "11px", letterSpacing: "0.08em", cursor: "pointer", outline: "none",
                }}
              >
                <option value="">CHOOSE LIBRARY...</option>
                {libraries.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </select>
            </div>

            {/* THE Slider */}
            <div className="deco-card" style={{ padding: "20px" }}>
              <ThresholdSlider value={threshold} onChange={setThreshold} disabled={isAnalyzing} />
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button className="untouchable-btn primary" onClick={handleAnalyze} disabled={isAnalyzing || !selectedLibrary}>
                {isAnalyzing ? "ANALYZING..." : "🔍 ANALYZE LIBRARY"}
              </button>
              <button className="untouchable-btn" onClick={() => setActiveTab("analyze")} disabled={!stats}>
                DELETION CANDIDATES ({stats ? filteredMovies.length : "—"})
              </button>
              <button
                className={"untouchable-btn" + (starred.size > 0 ? " active" : "")}
                onClick={() => setActiveTab("saved")}
                style={{ borderColor: starred.size > 0 ? "#C9A84C88" : undefined, color: starred.size > 0 ? "#C9A84C" : undefined }}
              >
                ⭐ SAVED LIST ({starred.size})
              </button>
              <button
                className={"untouchable-btn danger" + (!isDryRun ? " live" : "")}
                disabled={!stats || isAnalyzing}
              >
                {isDryRun ? "🌭 DELETE CANDIDATES (DRY RUN)" : "🗑️ DELETE CANDIDATES — LIVE"}
              </button>
            </div>

            {/* Mode card */}
            <div className="deco-card" style={{ padding: "16px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ fontSize: "20px" }}>{isDryRun ? "🛡️" : "⚡"}</div>
                <div>
                  <div style={{ fontFamily: "var(--font-audiowide)", fontSize: "10px", letterSpacing: "0.12em", color: isDryRun ? "#4A7A8D" : "#C05050", marginBottom: "4px" }}>
                    {isDryRun ? "DRY RUN MODE" : "LIVE DELETE MODE"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#4A3F28", lineHeight: 1.5 }}>
                    {isDryRun ? "Nothing will be deleted. Review candidates first." : "Content rated \u22658.0 is always protected."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT PANEL ─── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Progress */}
            {isAnalyzing && (
              <div className="deco-card" style={{ padding: "20px" }}>
                <MustardProgress current={progress.current} total={progress.total} message={progress.message} stage={progress.stage} />
              </div>
            )}

            {/* Stats */}
            <LibraryStatsDisplay stats={stats} loading={isAnalyzing} />

            {/* Welcome or Results */}
            {!stats && !isAnalyzing && (
              <div className="deco-card" style={{ padding: "64px 40px", textAlign: "center" }}>
                <div style={{ fontSize: "72px", marginBottom: "20px" }}>🌭</div>
                <h2 style={{ fontFamily: "var(--font-audiowide)", fontSize: "22px", letterSpacing: "0.1em", color: "#C9A84C", margin: "0 0 12px" }}>PLEXIQ v5.3</h2>
                <p style={{ color: "#4A3F28", fontSize: "13px", lineHeight: 1.7, maxWidth: "360px", margin: "0 auto 28px" }}>
                  Chicago, 1931. You run this library. One slider. No nonsense. You decide what stays and what goes.
                </p>
                <div className="deco-sep" />
                <div style={{ marginTop: "20px", fontFamily: "var(--font-audiowide)", fontSize: "10px", letterSpacing: "0.2em", color: "#2A2318" }}>
                  THE ONE SLIDER · EVERYTHING YOU NEED · NOTHING YOU DON&apos;T
                </div>
              </div>
            )}

            {stats && !isAnalyzing && (
              <div className="deco-card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid #2A2318", padding: "0 16px" }}>
                  <button className={"tab-btn" + (activeTab === "analyze" ? " active" : "")} onClick={() => setActiveTab("analyze")}>
                    CANDIDATES ({filteredMovies.length})
                  </button>
                  <button className={"tab-btn" + (activeTab === "saved" ? " active" : "")} onClick={() => setActiveTab("saved")}>
                    ⭐ SAVED ({starred.size})
                  </button>
                </div>

                {/* Table */}
                <div style={{ padding: "0 16px 16px", overflowX: "auto" }}>
                  {activeTab === "analyze" && (
                    <ResultTable movies={visibleFiltered} showEmpty="NO CANDIDATES AT THIS THRESHOLD" />
                  )}
                  {activeTab === "saved" && (
                    <ResultTable movies={savedMovies} showEmpty="NO SAVED TITLES YET — STAR A CANDIDATE TO SAVE IT" />
                  )}
                </div>

                {/* Load More */}
                {activeTab === "analyze" && hasMore && (
                  <div
                    style={{ borderTop: "1px solid #1A1408", padding: "12px 24px", textAlign: "center", cursor: "pointer" }}
                    onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                  >
                    <span style={{ fontFamily: "var(--font-audiowide)", fontSize: "10px", letterSpacing: "0.12em", color: "#C9A84C" }}>
                      LOAD MORE ↓  ({filteredMovies.length - visibleCount} remaining)
                    </span>
                  </div>
                )}
                {activeTab === "analyze" && !hasMore && filteredMovies.length > 0 && (
                  <div style={{ borderTop: "1px solid #1A1408", padding: "10px 24px", textAlign: "center" }}>
                    <span style={{ fontFamily: "var(--font-audiowide)", fontSize: "9px", letterSpacing: "0.12em", color: "#2A2318" }}>
                      ALL {filteredMovies.length} CANDIDATES SHOWN
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <div className="deco-sep" style={{ marginTop: "40px" }} />
      <footer style={{ padding: "16px 24px", maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "var(--font-audiowide)", fontSize: "9px", letterSpacing: "0.15em", color: "#2A2318" }}>
            PLEXIQ v5.3 · BUILT BY{" "}
            <a href="https://resume.richknowles.com" target="_blank" rel="noopener noreferrer" className="resume-link">
              RICH KNOWLES
            </a>
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            {["GITHUB", "DOCS"].map(l => (
              <span key={l} style={{ fontFamily: "var(--font-audiowide)", fontSize: "9px", letterSpacing: "0.15em", color: "#2A2318", cursor: "pointer" }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
