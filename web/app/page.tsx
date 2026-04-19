"use client";

import { useState, useEffect } from "react";
import ThresholdSlider from "@/components/threshold-slider";
import LibraryStatsDisplay from "@/components/library-stats";
import MustardProgress from "@/components/mustard-progress";
import DeletionFeedback from "@/components/deletion-feedback";
import { LibraryStats } from "@/types/plexiq";

interface PlexMovie {
  id:        number;
  ratingKey: string;
  title:     string;
  year?:     number;
  score:     number;
  size:      string;
  sizeBytes: number;
  rating:    number;
  plays:     number;
}

interface PlexLibrary {
  key:   string;
  title: string;
  type:  string;
}

const CSS = `
  @keyframes decoFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

  /* ── Art Deco cards ── */
  .deco-card {
    background: linear-gradient(160deg,#181410 0%,#111008 100%);
    border:1px solid #2A2318; border-radius:4px; position:relative;
  }
  .deco-card::before,.deco-card::after {
    content:""; position:absolute; width:12px; height:12px;
    border-color:#C9A84C; border-style:solid; opacity:0.6;
  }
  .deco-card::before { top:4px; left:4px; border-width:1px 0 0 1px; }
  .deco-card::after  { bottom:4px; right:4px; border-width:0 1px 1px 0; }
  .deco-sep { height:1px; background:linear-gradient(90deg,transparent 0%,#C9A84C55 30%,#C9A84C88 50%,#C9A84C55 70%,transparent 100%); }

  /* ── Buttons ── */
  .u-btn {
    background:linear-gradient(135deg,#1A1408 0%,#0D0A04 100%);
    border:1px solid #C9A84C66; color:#C9A84C;
    font-family:var(--font-audiowide); letter-spacing:0.08em; font-size:12px;
    transition:all 0.2s; cursor:pointer; padding:14px 20px;
    border-radius:2px; width:100%;
  }
  .u-btn:hover { background:linear-gradient(135deg,#2A1E08 0%,#1A1208 100%); border-color:#C9A84C; box-shadow:0 0 16px #C9A84C22; }
  .u-btn:disabled { opacity:0.3; cursor:not-allowed; }
  .u-btn.primary { background:linear-gradient(135deg,#C9A84C 0%,#8B6914 100%); color:#0D0A04; border-color:#E8C96C; }
  .u-btn.primary:hover { background:linear-gradient(135deg,#E8C96C 0%,#C9A84C 100%); box-shadow:0 0 24px #C9A84C44; }
  .u-btn.danger { border-color:#8B1C1C88; color:#C05050; }
  .u-btn.danger:hover { background:linear-gradient(135deg,#2A0808 0%,#1A0404 100%); border-color:#C05050; box-shadow:0 0 16px #8B1C1C33; }
  .u-btn.danger.live { border-color:#C05050; color:#E07070; background:linear-gradient(135deg,#3A0808 0%,#1A0404 100%); }

  /* ── Police lights ── */
  @keyframes policePopDown { from { transform:translateY(-110%); opacity:0; } to { transform:translateY(0); opacity:1; } }
  @keyframes spinDomeL { from { transform:rotate(0deg); } to { transform:rotate(-360deg); } }
  @keyframes spinDomeR { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes policeBarPulse { 0%,100% { background:#1A0000; } 50% { background:#2A0404; } }
  .police-bar {
    animation:policePopDown 0.45s cubic-bezier(0.34,1.4,0.64,1) forwards, policeBarPulse 0.6s ease-in-out infinite;
    border-bottom:1px solid #CC000055;
    padding:10px 24px;
    display:flex; align-items:center; justify-content:space-between;
  }
  .dome-wrap {
    width:40px; height:40px; border-radius:50%; background:#0A0000;
    border:2px solid #550000; overflow:hidden; position:relative;
    box-shadow:0 0 18px #CC000099, 0 0 36px #CC000033;
  }
  .dome-inner {
    position:absolute; top:0; left:0; width:100%; height:100%;
    background:conic-gradient(#DD0000 0deg 80deg, #FF5555 80deg 100deg, transparent 100deg 280deg, #FF5555 280deg 300deg, #DD0000 300deg 360deg);
    border-radius:50%;
  }
  .dome-l .dome-inner { animation:spinDomeL 0.55s linear infinite; }
  .dome-r .dome-inner { animation:spinDomeR 0.55s linear infinite; }

  /* ── Body count badge pulse (v5.3.4.1) ── */
  @keyframes bodyCountPulse {
    0%, 100% { transform:scale(1); box-shadow:0 0 12px rgba(232,64,64,0.6); }
    50%      { transform:scale(1.1); box-shadow:0 0 20px rgba(232,64,64,0.9); }
  }

  /* ── Tabs ── */
  .tab-btn {
    font-family:var(--font-audiowide); font-size:11px; letter-spacing:0.12em;
    padding:10px 20px; border:1px solid transparent; cursor:pointer;
    transition:all 0.2s; background:none; color:#4A3F28;
  }
  .tab-btn.active { border-color:#C9A84C66; color:#C9A84C; background:#1A1408; box-shadow:0 0 12px #C9A84C11; }
  .tab-btn:hover:not(.active) { color:#8B7355; border-color:#2A2318; }

  /* ── Results table ── */
  .result-row { transition:background 0.15s; border-bottom:1px solid #1A1408; }
  .result-row:hover { background:#1A1408; }
  .check-box {
    width:14px; height:14px; border:1px solid #C9A84C44; border-radius:2px;
    cursor:pointer; appearance:none; background:transparent; transition:all 0.15s;
    vertical-align:middle;
  }
  .check-box:checked { background:#C9A84C; border-color:#C9A84C; }

  /* ── Fade-out of starred row ── */
  @keyframes fadeRowOut {
    from { opacity:1; max-height:60px; padding-top:10px; padding-bottom:10px; }
    to   { opacity:0; max-height:0;   padding-top:0;    padding-bottom:0; }
  }
  .fading-out td { animation:fadeRowOut 0.38s ease-in forwards; overflow:hidden; }

  /* ── Chicago Style 3-Shot Execution Animation (v5.3.4.4) ── */

  @keyframes chicagoExecution {
    /* Target acquired - pulsing dark red crosshair */
    0%   { background:transparent; box-shadow:none; }
    7%   { background:rgba(139,28,28,0.25); box-shadow:inset 0 0 0 1px #8B1C1C88; }
    12%  { background:transparent; box-shadow:none; }
    16%  { background:rgba(139,28,28,0.25); box-shadow:inset 0 0 0 2px #CC000088; }

    /* BOOM 1 — muzzle flash (510ms) */
    16.9%  { background:rgba(60,10,10,0.2); box-shadow:none; }
    17%    { background:rgba(255,80,20,0.9); box-shadow:inset 0 0 40px rgba(255,180,60,1); color:#fff; }
    20%    { background:rgba(139,28,28,0.35); box-shadow:inset 0 0 8px rgba(200,40,20,0.4); }

    /* BOOM 2 — second shot (810ms) */
    26.9%  { background:rgba(139,28,28,0.3); }
    27%    { background:rgba(255,70,15,0.85); box-shadow:inset 0 0 36px rgba(255,160,50,0.9); }
    30%    { background:rgba(139,28,28,0.35); box-shadow:inset 0 0 6px rgba(200,40,20,0.3); }

    /* BOOM 3 — kill shot (1110ms) */
    36.9%  { background:rgba(139,28,28,0.3); }
    37%    { background:rgba(255,60,10,0.8); box-shadow:inset 0 0 32px rgba(255,140,40,0.85); }
    41%    { background:rgba(180,30,30,0.5); box-shadow:none; }

    /* Collapse and fade — slow dramatic exit */
    55%    { background:rgba(80,10,10,0.4); opacity:1; max-height:60px; padding-top:10px; padding-bottom:10px; }
    85%    { background:rgba(30,5,5,0.2); opacity:0.3; max-height:30px; padding-top:4px; padding-bottom:4px; }
    100%   { background:transparent; opacity:0; max-height:0; padding-top:0; padding-bottom:0; overflow:hidden; }
  }

  .hit-target td {
    animation:chicagoExecution 3.2s ease-out forwards;
    overflow:hidden;
  }

  /* Kill shot lands slightly later on the title column for stagger feel */
  .hit-target td:nth-child(3) {
    animation:chicagoExecution 3.2s ease-out 0.06s forwards;
    overflow:hidden;
  }

  /* Respect prefers-reduced-motion */
  @media (prefers-reduced-motion: reduce) {
    .hit-target td { animation:fadeRowOut 0.25s ease-in forwards !important; }
  }

  /* Respect prefers-reduced-motion */
  @media (prefers-reduced-motion: reduce) {
    .hit-target td, .hit-row td { animation:fadeRowOut 0.25s ease-in forwards !important; }
  }

  /* ── Confirmation modal ── */
  .modal-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.82);
    display:flex; align-items:center; justify-content:center;
    z-index:200; animation:decoFadeIn 0.2s ease-out;
  }
  .modal-box {
    background:linear-gradient(160deg,#1C1610 0%,#0D0A04 100%);
    border:1px solid #C9A84C55; border-radius:4px;
    padding:32px; max-width:420px; width:90%; position:relative;
  }
  .modal-box::before { content:""; position:absolute; top:4px; left:4px; width:12px; height:12px; border:1px solid #C9A84C; border-right:none; border-bottom:none; opacity:0.6; }
  .modal-box::after  { content:""; position:absolute; bottom:4px; right:4px; width:12px; height:12px; border:1px solid #C9A84C; border-left:none; border-top:none; opacity:0.6; }
  .pwd-input {
    width:100%; background:#0A0800; border:1px solid #C9A84C44; color:#C8B99A;
    padding:12px 14px; font-family:var(--font-audiowide); font-size:13px;
    outline:none; border-radius:2px; box-sizing:border-box;
    transition:border-color 0.2s;
  }
  .pwd-input:focus { border-color:#C9A84C; box-shadow:0 0 10px #C9A84C22; }

  /* ── The Untouchables marquee ── */
  @keyframes bulbCycle {
    0%,49%  { background:#1A1200; box-shadow:none; }
    50%,100%{ background:#FFE066; box-shadow:0 0 6px #FFE066, 0 0 12px #C9A84C88; }
  }
  @keyframes marqueeSlideIn {
    from { opacity:0; transform:translateX(-28px); }
    to   { opacity:1; transform:none; }
  }
  .marquee-panel {
    background:#080600; border:3px solid #1A1200; position:relative;
    padding:52px 24px 24px; min-height:140px;
  }
  .bulb {
    position:absolute; width:10px; height:10px; border-radius:50%;
    background:#1A1200; animation:bulbCycle 1.4s ease-in-out infinite;
  }
  .marquee-title {
    position:absolute; top:0; left:0; right:0;
    display:flex; align-items:center; justify-content:center; height:38px;
    font-family:var(--font-audiowide); font-size:13px; letter-spacing:0.25em;
    color:#FFE066; text-shadow:0 0 12px #C9A84C, 0 0 24px #C9A84C66;
  }
  .marquee-item {
    animation:marqueeSlideIn 0.4s ease-out forwards;
    border-bottom:1px solid #1A1408; padding:10px 8px;
    display:flex; align-items:center; justify-content:space-between;
  }
  .rm-btn {
    background:none; border:1px solid #3A2318; color:#6B5E3C;
    font-size:10px; font-family:var(--font-audiowide); letter-spacing:0.1em;
    padding:3px 8px; cursor:pointer; border-radius:2px; transition:all 0.15s;
    white-space:nowrap;
  }
  .rm-btn:hover { border-color:#C05050; color:#C05050; }

  /* ── Footer ── demure dark red watermark, name slightly warmer */
  a.resume-link {
    color:#E84040; font-weight:700; text-decoration:none;
    transition:color 0.2s, text-shadow 0.2s;
  }
  a.resume-link:hover { color:#FF6868; text-shadow:0 0 10px #E8404066; }
`;

const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250];
const BULB_COUNT = { top:12, bottom:12, left:5, right:5 };

function MarqueeBulbs() {
  const bulbs: React.ReactNode[] = [];
  let key = 0;
  const tw = 100 / (BULB_COUNT.top + 1);
  const lh = 100 / (BULB_COUNT.left + 1);
  for (let i = 1; i <= BULB_COUNT.top; i++) {
    const delay = `${((i - 1) * 0.12).toFixed(2)}s`;
    bulbs.push(<div key={key++} className="bulb" style={{ top:6, left:`${tw * i}%`, animationDelay:delay }} />);
    bulbs.push(<div key={key++} className="bulb" style={{ bottom:6, left:`${tw * i}%`, animationDelay:`${(BULB_COUNT.top - i) * 0.12}s` }} />);
  }
  for (let i = 1; i <= BULB_COUNT.left; i++) {
    const delay = `${(BULB_COUNT.top * 0.12 + i * 0.12).toFixed(2)}s`;
    bulbs.push(<div key={key++} className="bulb" style={{ left:6, top:`${lh * i}%`, animationDelay:delay }} />);
    bulbs.push(<div key={key++} className="bulb" style={{ right:6, top:`${lh * i}%`, animationDelay:`${(BULB_COUNT.left - i) * 0.12}s` }} />);
  }
  return <>{bulbs}</>;
}

export default function Dashboard() {
  const [threshold,        setThreshold]        = useState(50); // Now 0-100 scale
  const [libraries,        setLibraries]        = useState<PlexLibrary[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [isAnalyzing,      setIsAnalyzing]      = useState(false);
  const [isDryRun,         setIsDryRun]         = useState(true);
  const [progress,         setProgress]         = useState({ current:0, total:0, stage:"", message:"" });
  const [stats,            setStats]            = useState<LibraryStats | null>(null);
  const [movies,           setMovies]           = useState<PlexMovie[]>([]);
  const [activeTab,        setActiveTab]        = useState<"analyze"|"saved"|"hitlist">("analyze");
  const [hitList,          setHitList]          = useState<Array<{timestamp: string; titles: string[]; count: number; bytesFreed: number}>>([]);
  const [hitListSort,      setHitListSort]      = useState<"newest"|"oldest">("newest");
  const [untouchables,     setUntouchables]     = useState<Set<number>>(new Set());
  const [fadingIds,        setFadingIds]        = useState<Set<number>>(new Set());
  const [selectedIds,      setSelectedIds]      = useState<Set<number>>(new Set());
  const [pageSize,         setPageSize]         = useState(DEFAULT_PAGE_SIZE);
  const [visibleCount,     setVisibleCount]     = useState(DEFAULT_PAGE_SIZE);
  const [confirmStep,      setConfirmStep]      = useState<0|1|2|3>(0);
  const [password,         setPassword]         = useState("");
  const [pwdError,         setPwdError]         = useState(false);
  const [deleteSuccess,    setDeleteSuccess]    = useState(false);
  const [libError,         setLibError]         = useState("");
  const [globalCutList,    setGlobalCutList]    = useState<Map<string, Set<number>>>(new Map()); // libraryKey -> Set of movie IDs
  const [sortBy,           setSortBy]           = useState<"title"|"score"|"size"|"rating"|"plays">("score");
  const [sortDir,          setSortDir]          = useState<"asc"|"desc">("desc");

  // Deletion animation state (v5.3.4)
  const [deletingIds,      setDeletingIds]      = useState<Set<number>>(new Set());
  const [crumplingIds,     setCrumplingIds]     = useState<Set<number>>(new Set());
  const [slidingIds,       setSlidingIds]       = useState<Set<number>>(new Set());
  const [deletionStats,    setDeletionStats]    = useState<{
    count: number;
    bytesFreed: number;
    executionTime: number;
    titles: string[];
  } | null>(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SESSION PERSISTENCE v5.3.2 - Survives refresh, disconnect, accidental pulls
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Restore session on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedLibrary = localStorage.getItem("plexiq_selectedLibrary");
    const savedThreshold = localStorage.getItem("plexiq_threshold");
    const savedDryRun = localStorage.getItem("plexiq_dryRun");
    const savedStars = localStorage.getItem("plexiq_untouchables");
    const savedPageSize = localStorage.getItem("plexiq_pageSize");
    const savedGlobalCutList = localStorage.getItem("plexiq_globalCutList");
    const savedHitList = localStorage.getItem("plexiq_hitList");

    if (savedLibrary) setSelectedSectionId(savedLibrary);
    if (savedThreshold) {
      const t = parseFloat(savedThreshold);
      // Migrate old 0-1 values to 0-100
      setThreshold(t <= 1 ? t * 100 : t);
    }
    if (savedDryRun !== null) setIsDryRun(savedDryRun === "true");
    if (savedPageSize) setPageSize(parseInt(savedPageSize));
    if (savedStars) {
      try {
        const stars = JSON.parse(savedStars) as number[];
        setUntouchables(new Set(stars));
      } catch (e) {
        console.warn("Could not restore starred items:", e);
      }
    }
    if (savedGlobalCutList) {
      try {
        const data = JSON.parse(savedGlobalCutList);
        const map = new Map<string, Set<number>>();
        Object.entries(data).forEach(([key, ids]) => {
          map.set(key, new Set(ids as number[]));
        });
        setGlobalCutList(map);
      } catch (e) {
        console.warn("Could not restore global cut list:", e);
      }
    }
    if (savedHitList) {
      try {
        const data = JSON.parse(savedHitList);
        setHitList(Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn("Could not restore hit list:", e);
      }
    }
  }, []);

  // Save session when key state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedSectionId) {
      localStorage.setItem("plexiq_selectedLibrary", selectedSectionId);
    }
  }, [selectedSectionId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("plexiq_threshold", threshold.toString());
  }, [threshold]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("plexiq_dryRun", isDryRun.toString());
  }, [isDryRun]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("plexiq_untouchables", JSON.stringify([...untouchables]));
  }, [untouchables]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("plexiq_pageSize", pageSize.toString());
    setVisibleCount(pageSize);
  }, [pageSize]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const obj: Record<string, number[]> = {};
    globalCutList.forEach((ids, key) => {
      obj[key] = [...ids];
    });
    localStorage.setItem("plexiq_globalCutList", JSON.stringify(obj));
  }, [globalCutList]);

  // Recalculate deletion candidates when threshold, movies, or untouchables change
  useEffect(() => {
    if (movies.length === 0) return;

    const minScore = 100 - threshold;
    const candidates = movies.filter(m => m.score >= minScore && !untouchables.has(m.id));

    setStats(prevStats => {
      if (!prevStats) return prevStats;
      return {
        ...prevStats,
        deletionCandidates: candidates.length,
        potentialSpaceSaved: candidates.reduce((acc, m) => acc + m.sizeBytes, 0),
      };
    });
  }, [threshold, movies, untouchables]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Fetch Plex library list — callable on mount AND on retry
  const fetchLibraries = () => {
    setLibError("");
    fetch("/api/libraries")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLibraries(data);
        } else {
          setLibError(data.error || "Cannot reach Plex");
        }
      })
      .catch(() => setLibError("Cannot reach Plex server"));
  };

  useEffect(() => { fetchLibraries(); }, []);

  const selectedLibraryTitle = libraries.find(l => l.key === selectedSectionId)?.title || "";

  // Filter based on INVERTED threshold (0 = show nothing, 100 = show everything)
  // Higher threshold = more aggressive = more candidates shown
  const filteredMovies = movies.filter(m => {
    const minScore = 100 - threshold; // Invert: threshold 0 = need score 100, threshold 100 = need score 0
    // Keep crumpling/sliding rows in DOM so CSS animations can play
    return m.score >= minScore
      && !fadingIds.has(m.id)
      && !untouchables.has(m.id);
  });

  // Sort movies
  const sortedMovies = [...filteredMovies].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "score":
        comparison = a.score - b.score;
        break;
      case "size":
        comparison = a.sizeBytes - b.sizeBytes;
        break;
      case "rating":
        comparison = a.rating - b.rating;
        break;
      case "plays":
        comparison = a.plays - b.plays;
        break;
    }
    return sortDir === "asc" ? comparison : -comparison;
  });

  const visibleFiltered  = sortedMovies.slice(0, visibleCount);
  const hasMore          = sortedMovies.length > visibleCount;
  const untouchableItems = movies.filter(m => untouchables.has(m.id));

  // Toggle sort column
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir(column === "title" ? "asc" : "desc"); // Title defaults to A-Z, others to high-low
    }
  };

  const toggleStar = (id: number) => {
    if (untouchables.has(id)) return;
    setFadingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      setUntouchables(prev => new Set([...prev, id]));
      setFadingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 380);
  };

  const removeUntouchable = (id: number) => {
    setUntouchables(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      // Update global cut list for current library
      setGlobalCutList(prevMap => {
        const newMap = new Map(prevMap);
        newMap.set(selectedSectionId, newSet);
        return newMap;
      });
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    // If all visible items are selected, clear selection completely
    if (selectedIds.size > 0 && visibleFiltered.every(m => selectedIds.has(m.id))) {
      setSelectedIds(new Set());
      setGlobalCutList(prev => {
        const newMap = new Map(prev);
        newMap.set(selectedSectionId, new Set());
        return newMap;
      });
    } else {
      // Select all visible items
      const newSet = new Set(visibleFiltered.map(m => m.id));
      setSelectedIds(newSet);
      setGlobalCutList(prev => {
        const newMap = new Map(prev);
        newMap.set(selectedSectionId, newSet);
        return newMap;
      });
    }
  };

  const handleAnalyze = async () => {
    if (!selectedSectionId) { alert("Select a library first"); return; }
    setIsAnalyzing(true);
    setVisibleCount(pageSize);
    setMovies([]);

    // Restore selections for this library from global cut list
    const savedSelections = globalCutList.get(selectedSectionId);
    if (savedSelections) {
      setSelectedIds(savedSelections);
    } else {
      setSelectedIds(new Set());
    }

    const stages = [
      { stage:"connecting", message:"Connecting to Plex...",          pct:10, duration:700  },
      { stage:"collecting", message:"Pulling metadata...",            pct:35, duration:900  },
      { stage:"enriching",  message:"Fetching ratings & play data...", pct:65, duration:900  },
      { stage:"scoring",    message:"Calculating deletion scores...",  pct:88, duration:600  },
    ];

    // Run progress animation and API fetch in parallel
    const progressAnim = (async () => {
      for (const { stage, message, pct, duration } of stages) {
        setProgress({ current: pct, total: 100, stage, message });
        await new Promise(r => setTimeout(r, duration));
      }
    })();

    const fetchResult = fetch(`/api/analyze?sectionId=${selectedSectionId}`)
      .then(r => r.json());

    const [, data] = await Promise.all([progressAnim, fetchResult]);

    if (data.error) {
      alert(`Analysis failed: ${data.error}`);
      setIsAnalyzing(false);
      return;
    }

    setProgress({ current:100, total:100, stage:"complete", message:"Analysis complete." });
    await new Promise(r => setTimeout(r, 300));

    const fetchedMovies: PlexMovie[] = data.movies;
    const minScore = 100 - threshold; // Use inverted threshold
    const candidates = fetchedMovies.filter(m => m.score >= minScore && !untouchables.has(m.id));
    setMovies(fetchedMovies);
    setStats({
      ...data.stats,
      deletionCandidates:  candidates.length,
      potentialSpaceSaved: candidates.reduce((acc, m) => acc + m.sizeBytes, 0),
    });

    setIsAnalyzing(false);
    setActiveTab("analyze");
  };

  const handleDeleteClick = () => {
    if (!stats || isAnalyzing) return;
    setConfirmStep(1);
  };

  const handleConfirmNext = async () => {
    if (confirmStep === 2) { setConfirmStep(3); return; }
    if (confirmStep === 3) {
      if (!password.trim()) { setPwdError(true); return; }

      // Verify password with server
      try {
        const verifyRes = await fetch("/api/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const verifyData = await verifyRes.json();

        if (!verifyData.valid) {
          setPwdError(true);
          alert("Incorrect deletion password. Check your .env.local file.");
          return;
        }

        setPwdError(false);
      } catch {
        alert("Password verification failed. Check server connection.");
        return;
      }

      if (!isDryRun) {
        // ── Real Plex deletion with animations (v5.3.4.1) ──
        // ONLY delete manually checked items (never auto-delete based on threshold)
        if (selectedIds.size === 0) {
          alert("No items selected for deletion. Please check items you want to delete.");
          setConfirmStep(0);
          setPassword("");
          return;
        }

        const toDelete = movies.filter(m => selectedIds.has(m.id));
        const startTime = Date.now();
        const toDeleteIds = new Set(toDelete.map(m => m.id));

        // Capture stats before deletion
        const bytesFreed = toDelete.reduce((sum, m) => sum + m.sizeBytes, 0);
        const deletedTitles = toDelete.map(m => m.title);

        // Close modal FIRST so user can see the table animations
        setConfirmStep(0);
        setPassword("");

        // CHICAGO 3-SHOT EXECUTION ANIMATION (v5.3.4.4)
        // Single class does target lock + 3 muzzle flashes + dramatic collapse (3.2s total)
        console.log("🎯 Chicago Style: Executing", toDeleteIds.size, "titles");
        setCrumplingIds(toDeleteIds);

        // Wait for full animation to complete before removing from DOM
        // 3.2s animation + small buffer
        await new Promise(r => setTimeout(r, 3400));

        // Execute actual deletion API call
        const ratingKeys = toDelete.map(m => m.ratingKey);
        try {
          await fetch("/api/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ratingKeys }),
          });

          // Update state - remove deleted movies
          const deletedIds = new Set(toDelete.map(m => m.id));
          setMovies(prev => prev.filter(m => !deletedIds.has(m.id)));
          setSelectedIds(new Set());
          setCrumplingIds(new Set());
          setSlidingIds(new Set());

          // Add to hit list (persistent deletion history)
          const newHitListEntry = {
            timestamp: new Date().toISOString(),
            titles: deletedTitles,
            count: toDelete.length,
            bytesFreed,
          };

          // Store in localStorage and update state
          const existingHitList = JSON.parse(localStorage.getItem("plexiq_hitList") || "[]");
          existingHitList.push(newHitListEntry);
          localStorage.setItem("plexiq_hitList", JSON.stringify(existingHitList));
          setHitList(existingHitList);

          // Phase 4: Show success feedback (persistent - no auto-dismiss)
          const executionTime = (Date.now() - startTime) / 1000;
          setDeletionStats({
            count: toDelete.length,
            bytesFreed,
            executionTime,
            titles: deletedTitles,
          });

        } catch (err) {
          console.error("Delete API failed:", err);
          alert("Deletion failed. Check server connection.");
          // Reset animation states on error
          setCrumplingIds(new Set());
          setSlidingIds(new Set());
        }
      }

      // For dry run, just close modal
      if (isDryRun) {
        setConfirmStep(0);
        setPassword("");
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 4000);
      }
      return;
    }
    setConfirmStep(prev => (prev + 1) as 0|1|2|3);
  };

  const cancelConfirm = () => { setConfirmStep(0); setPassword(""); setPwdError(false); };

  // HIT LIST = ONLY manually checked items (must explicitly check to delete)
  const cutListCount   = selectedIds.size; // Only checked items get deleted
  const deleteTargets  = selectedIds.size; // Same - only checked items
  const showPoliceLights = !isDryRun && confirmStep > 0;

  // Wastebasket visual states (v5.3.4.1)
  const getWastebasketIcon = () => {
    const count = selectedIds.size;
    if (count === 0) return "🗑️";
    if (count >= 10) return "🗑️💥"; // Full/overflowing
    return "🗑️📄"; // Filling
  };

  const ScoreCell = ({ score }: { score: number }) => {
    const color = score >= 85 ? "#E84040" : score >= 65 ? "#C9A84C" : "#8B7355";
    return <span style={{ color, fontWeight:700, fontFamily:"var(--font-audiowide)", fontSize:"13px" }}>{Math.round(score)}</span>;
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0A0804", color:"#C8B99A" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── HEADER ── */}
      <header style={{ borderBottom:"1px solid #2A2318", background:"#0D0A04", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ height:"2px", background:"linear-gradient(90deg,transparent,#C9A84C,#E8C96C,#C9A84C,transparent)" }} />
        <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"8px 24px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
              <div style={{ fontSize:"44px", lineHeight:1, userSelect:"none" }}>🌭</div>
              <div>
                <h1 style={{ fontFamily:"var(--font-audiowide)", fontSize:"24px", letterSpacing:"0.06em", background:"linear-gradient(135deg,#E8C96C 0%,#C9A84C 50%,#8B6914 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", margin:0 }}>
                  PLEXIQ
                </h1>
                <p style={{ margin:0, fontSize:"12px", letterSpacing:"0.25em", color:"#4A3F28", fontFamily:"var(--font-audiowide)", marginTop:"2px" }}>
                  v5.3.4 · CHICAGO EDITION
                </p>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"24px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <span style={{ fontSize:"10px", color:"#4A3F28", fontFamily:"var(--font-audiowide)", letterSpacing:"0.1em" }}>
                  {isDryRun ? "DRY RUN" : "LIVE MODE"}
                </span>
                <div onClick={() => setIsDryRun(!isDryRun)} style={{ position:"relative", width:"44px", height:"22px", borderRadius:"11px", cursor:"pointer", background:isDryRun?"#1A1408":"#3A0808", border:`1px solid ${isDryRun?"#2A2318":"#8B1C1C"}`, transition:"all 0.2s" }}>
                  <div style={{ position:"absolute", top:"3px", width:"16px", height:"16px", borderRadius:"50%", background:isDryRun?"#4A3F28":"#C05050", left:isDryRun?"3px":"25px", transition:"all 0.2s" }} />
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:"9px", color:"#4A3F28", fontFamily:"var(--font-audiowide)", letterSpacing:"0.1em" }}>PLEX SERVER</div>
                <div style={{ display:"flex", alignItems:"center", gap:"6px", marginTop:"4px" }}>
                  <div style={{ width:"7px", height:"7px", borderRadius:"50%", background: libError ? "#7A3A3A" : "#3A7A3A", boxShadow: libError ? "0 0 6px #7A3A3A" : "0 0 6px #3A7A3A" }} />
                  <span style={{ fontSize:"11px", color: libError ? "#7A3A3A" : "#3A7A3A", fontFamily:"var(--font-audiowide)", letterSpacing:"0.05em" }}>
                    {libError ? "OFFLINE" : "CONNECTED"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="deco-sep" />
      </header>

      {/* ── POLICE LIGHTS BAR — fixed, above modal ── */}
      {showPoliceLights && (
        <div className="police-bar" style={{ position:"fixed", top:0, left:0, right:0, zIndex:300 }}>
          <div className="dome-wrap dome-l"><div className="dome-inner" /></div>
          <div style={{ fontFamily:"var(--font-audiowide)", fontSize:"11px", letterSpacing:"0.2em", color:"#CC0000", textShadow:"0 0 12px #CC0000" }}>
            ⚠ LIVE DELETE — IRREVERSIBLE ⚠
          </div>
          <div className="dome-wrap dome-r"><div className="dome-inner" /></div>
        </div>
      )}

      {/* ── LIVE WARNING STRIP ── */}
      {!isDryRun && confirmStep === 0 && (
        <div style={{ background:"#2A0404", borderBottom:"1px solid #8B1C1C55", padding:"8px 24px", textAlign:"center", fontFamily:"var(--font-audiowide)", fontSize:"10px", letterSpacing:"0.15em", color:"#C05050" }}>
          ⚠ LIVE MODE — DELETIONS ARE PERMANENT AND IRREVERSIBLE
        </div>
      )}

      {/* ── DELETE SUCCESS ── */}
      {deleteSuccess && (
        <div style={{ background:"#0A2A0A", borderBottom:"1px solid #3A7A3A55", padding:"10px 24px", textAlign:"center", fontFamily:"var(--font-audiowide)", fontSize:"11px", letterSpacing:"0.15em", color:"#3A7A3A" }}>
          ✓ {isDryRun ? "DRY RUN COMPLETE" : `DELETION EXECUTED — ${deleteTargets} FILE${deleteTargets !== 1 ? "S" : ""} REMOVED`}
        </div>
      )}

      {/* ── MAIN ── */}
      <main style={{ maxWidth:"1280px", margin:"0 auto", padding:"32px 24px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:"24px" }}>

          {/* ── LEFT PANEL ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

            <div className="deco-card" style={{ padding:"20px" }}>
              <div style={{ fontFamily:"var(--font-audiowide)", fontSize:"9px", letterSpacing:"0.2em", color:"#4A3F28", marginBottom:"12px" }}>SELECT LIBRARY</div>
              {libError ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px" }}>
                  <div style={{ color:"#7A3A3A", fontSize:"11px", fontFamily:"var(--font-audiowide)", letterSpacing:"0.08em" }}>
                    ⚠ {libError}
                  </div>
                  <button
                    onClick={fetchLibraries}
                    style={{ background:"none", border:"1px solid #4A2020", color:"#8A4040", fontFamily:"var(--font-audiowide)", fontSize:"9px", letterSpacing:"0.1em", padding:"4px 8px", cursor:"pointer", borderRadius:"2px", whiteSpace:"nowrap", flexShrink:0 }}
                    onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor="#C9A84C"; b.style.color="#C9A84C"; }}
                    onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor="#4A2020"; b.style.color="#8A4040"; }}
                  >↺ RETRY</button>
                </div>
              ) : (
                <>
                  <select
                    value={selectedSectionId}
                    onChange={e => setSelectedSectionId(e.target.value)}
                    disabled={isAnalyzing}
                    style={{ width:"100%", background:"#0D0A04", border:"1px solid #2A2318", color:"#C8B99A", padding:"10px 14px", fontFamily:"var(--font-audiowide)", fontSize:"11px", letterSpacing:"0.08em", cursor:"pointer", outline:"none", marginBottom:"8px" }}
                  >
                    <option value="">CHOOSE LIBRARY...</option>
                    {libraries.map(l => (
                      <option key={l.key} value={l.key}>{l.title.toUpperCase()}</option>
                    ))}
                  </select>
                  <button
                    onClick={fetchLibraries}
                    disabled={isAnalyzing}
                    style={{ width:"100%", background:"none", border:"1px solid #2A2318", color:"#6B5E3C", fontFamily:"var(--font-audiowide)", fontSize:"9px", letterSpacing:"0.1em", padding:"6px 8px", cursor:isAnalyzing?"not-allowed":"pointer", borderRadius:"2px", transition:"all 0.15s", opacity:isAnalyzing?0.3:1 }}
                    onMouseEnter={e => { if(!isAnalyzing){ const b = e.currentTarget; b.style.borderColor="#C9A84C"; b.style.color="#C9A84C"; }}}
                    onMouseLeave={e => { if(!isAnalyzing){ const b = e.currentTarget; b.style.borderColor="#2A2318"; b.style.color="#6B5E3C"; }}}
                  >↺ RECONNECT TO PLEX</button>
                </>
              )}
            </div>

            <div className="deco-card" style={{ padding:"20px" }}>
              <ThresholdSlider value={threshold} onChange={setThreshold} disabled={isAnalyzing} />
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              <button className="u-btn primary" onClick={handleAnalyze} disabled={isAnalyzing || !selectedSectionId}>
                {isAnalyzing ? "ANALYZING..." : "🔍 ANALYZE LIBRARY"}
              </button>
              <button className="u-btn" onClick={() => setActiveTab("analyze")} disabled={!stats}>
                🎯 THE HIT LIST ({stats ? cutListCount : "—"})
                {stats && cutListCount === 0 && <span style={{ marginLeft:"4px", fontSize:"9px", color:"#6B5E3C" }}>(check items to delete)</span>}
              </button>
              <button className="u-btn" onClick={() => setActiveTab("saved")}
                style={{ borderColor:untouchables.size > 0 ? "#C9A84C88" : undefined, color:untouchables.size > 0 ? "#FFE066" : undefined }}>
                ★ THE UNTOUCHABLES ({untouchables.size})
              </button>
              <button className="u-btn" onClick={() => setActiveTab("hitlist")}
                style={{ borderColor:hitList.length > 0 ? "#E8404088" : undefined, color:hitList.length > 0 ? "#E87070" : undefined }}>
                🕊️ IN REMEMBRANCE ({hitList.reduce((sum, h) => sum + h.count, 0)})
              </button>
              <button
                className={"u-btn danger" + (!isDryRun ? " live" : "")}
                disabled={!stats || isAnalyzing || selectedIds.size === 0}
                onClick={handleDeleteClick}
                title={selectedIds.size === 0 ? "Check items to delete first" : undefined}
                style={{
                  position: "relative",
                }}
              >
                {isDryRun
                  ? `🌭 HIT LIST${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""} (DRY RUN)`
                  : `${getWastebasketIcon()} DELETE ${selectedIds.size > 0 ? selectedIds.size : filteredMovies.length} FILES — LIVE`}
                {/* Body count badge when items selected */}
                {!isDryRun && selectedIds.size > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    background: selectedIds.size >= 10 ? "#E84040" : "#C9A84C",
                    color: "#0D0A04",
                    fontFamily: "var(--font-audiowide)",
                    fontSize: "10px",
                    fontWeight: "bold",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    border: "2px solid #0D0A04",
                    boxShadow: "0 0 12px rgba(201,168,76,0.6)",
                    animation: selectedIds.size >= 10 ? "bodyCountPulse 1s ease-in-out infinite" : "none",
                  }}>
                    {selectedIds.size}
                  </span>
                )}
              </button>
            </div>

            <div className="deco-card" style={{ padding:"16px" }}>
              <div style={{ display:"flex", gap:"12px", alignItems:"flex-start" }}>
                <div style={{ fontSize:"20px" }}>{isDryRun ? "🛡️" : "⚡"}</div>
                <div>
                  <div style={{ fontFamily:"var(--font-audiowide)", fontSize:"10px", letterSpacing:"0.12em", color:isDryRun?"#4A7A8D":"#C05050", marginBottom:"4px" }}>
                    {isDryRun ? "DRY RUN" : "LIVE MODE"}
                  </div>
                  <div style={{ fontSize:"11px", color:"#4A3F28", lineHeight:1.5 }}>
                    {isDryRun ? "Preview only. Nothing gets touched." : `Ratings \u22658.0 always protected. The Untouchables always protected.`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

            {isAnalyzing && (
              <div className="deco-card" style={{ padding:"20px" }}>
                <MustardProgress current={progress.current} total={progress.total} message={progress.message} stage={progress.stage} />
              </div>
            )}

            <LibraryStatsDisplay stats={stats} loading={isAnalyzing} />

            {!stats && !isAnalyzing && (
              <div className="deco-card" style={{ padding:"64px 40px", textAlign:"center" }}>
                <div style={{ fontSize:"72px", marginBottom:"20px" }}>🌭</div>
                <h2 style={{ fontFamily:"var(--font-audiowide)", fontSize:"22px", letterSpacing:"0.1em", color:"#C9A84C", margin:"0 0 12px" }}>PLEXIQ v5.3.4</h2>
                <p style={{ color:"#4A3F28", fontSize:"13px", lineHeight:1.7, maxWidth:"360px", margin:"0 auto 28px" }}>
                  Chicago, 1931. You run this library. One slider. You decide what stays and what goes.
                </p>
                <div className="deco-sep" />
                <div style={{ marginTop:"20px", fontFamily:"var(--font-audiowide)", fontSize:"10px", letterSpacing:"0.2em", color:"#2A2318" }}>
                  THE ONE SLIDER · EVERYTHING YOU NEED · NOTHING YOU DON&apos;T
                </div>
              </div>
            )}

            {/* ── THE UNTOUCHABLES MARQUEE ── */}
            {activeTab === "saved" && (
              <div className="marquee-panel">
                <MarqueeBulbs />
                <div className="marquee-title">★ THE UNTOUCHABLES ★</div>
                {untouchableItems.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"32px 0", color:"#4A3F28", fontFamily:"var(--font-audiowide)", fontSize:"11px", letterSpacing:"0.12em" }}>
                    NO NAMES ON THE LIST YET — STAR A CANDIDATE TO PROTECT IT
                  </div>
                ) : (
                  untouchableItems.map((m, idx) => (
                    <div key={m.id} className="marquee-item" style={{ animationDelay:`${idx * 0.07}s` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
                        <span style={{ fontFamily:"var(--font-audiowide)", fontSize:"10px", color:"#4A3F28", minWidth:"24px" }}>{String(idx + 1).padStart(2, "0")}</span>
                        <span style={{ color:"#FFE066", fontSize:"13px", textShadow:"0 0 8px #C9A84C55" }}>{m.title}</span>
                        <span style={{ fontSize:"11px", color:"#4A3F28" }}>{m.size}</span>
                      </div>
                      <button className="rm-btn" onClick={() => removeUntouchable(m.id)}>RELEASE</button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── IN REMEMBRANCE PANEL ── */}
            {activeTab === "hitlist" && (() => {
              const totalBytesFreed = hitList.reduce((sum, h) => sum + h.bytesFreed, 0);
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
              const sortedHitList = hitListSort === "newest"
                ? [...hitList].reverse()
                : [...hitList];

              return (
              <div className="deco-card" style={{ padding:"24px", background:"linear-gradient(160deg,#1A0808 0%,#0D0404 100%)" }}>
                {/* Header with total GB */}
                <div style={{ textAlign:"center", marginBottom:"20px" }}>
                  <div style={{ fontFamily:"var(--font-audiowide)", fontSize:"16px", letterSpacing:"0.12em", color:"#E84040", marginBottom:"8px", textShadow:"0 0 16px rgba(232,64,64,0.4)" }}>
                    🕊️ IN REMEMBRANCE 🕊️
                  </div>
                  {hitList.length > 0 && (
                    <div style={{ fontSize:"12px", color:"#8B6060", fontStyle:"italic" }}>
                      {formatSize(totalBytesFreed)} Sleeps with the fishes 🐟
                    </div>
                  )}
                </div>

                {/* Sort button */}
                {hitList.length > 1 && (
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:"16px" }}>
                    <button
                      onClick={() => setHitListSort(s => s === "newest" ? "oldest" : "newest")}
                      style={{
                        background:"linear-gradient(135deg, #2A0808 0%, #1A0404 100%)",
                        border:"1px solid #4A1818",
                        color:"#C05050",
                        fontFamily:"var(--font-audiowide)",
                        fontSize:"9px",
                        letterSpacing:"0.1em",
                        padding:"8px 16px",
                        cursor:"pointer",
                        borderRadius:"2px",
                        transition:"all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#E84040"; e.currentTarget.style.color = "#E84040"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#4A1818"; e.currentTarget.style.color = "#C05050"; }}
                    >
                      {hitListSort === "newest" ? "↓ NEWEST FIRST" : "↑ OLDEST FIRST"}
                    </button>
                  </div>
                )}

                {hitList.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"40px 20px", color:"#6B4040", fontFamily:"var(--font-audiowide)", fontSize:"11px", letterSpacing:"0.12em" }}>
                    NO DEPARTED SOULS YET — DELETE SOME MOVIES IN LIVE MODE
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
                    {sortedHitList.map((hit, idx) => {
                      const date = new Date(hit.timestamp);
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
                        <div key={idx} style={{
                          background:"linear-gradient(135deg, #2A0808 0%, #1A0404 100%)",
                          border:"1px solid #4A1818",
                          borderRadius:"4px",
                          padding:"16px",
                        }}>
                          {/* Header Row */}
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                            <div style={{ fontFamily:"var(--font-audiowide)", fontSize:"10px", letterSpacing:"0.1em", color:"#C05050" }}>
                              HIT #{hitListSort === "newest" ? hitList.length - idx : idx + 1}
                            </div>
                            <div style={{ fontSize:"11px", color:"#6B4040" }}>
                              {date.toLocaleDateString()} {date.toLocaleTimeString()}
                            </div>
                          </div>

                          {/* Stats Row */}
                          <div style={{ display:"flex", gap:"20px", marginBottom:"12px", fontSize:"12px", color:"#9A7070" }}>
                            <span>
                              <span style={{ fontFamily:"var(--font-audiowide)", color:"#E87070", fontSize:"14px" }}>
                                {hit.count}
                              </span>
                              {" "}file{hit.count !== 1 ? 's' : ''}
                            </span>
                            <span style={{ color:"#4A1818" }}>•</span>
                            <span>
                              <span style={{ fontFamily:"var(--font-audiowide)", color:"#E87070", fontSize:"14px" }}>
                                {formatSize(hit.bytesFreed)}
                              </span>
                              {" "}freed
                            </span>
                          </div>

                          {/* Casualties List */}
                          <div style={{ borderTop:"1px solid #4A1818", paddingTop:"12px" }}>
                            <div style={{ fontFamily:"var(--font-audiowide)", fontSize:"8px", letterSpacing:"0.15em", color:"#6B4040", marginBottom:"8px" }}>
                              CASUALTIES:
                            </div>
                            <ul style={{ margin:0, padding:"0 0 0 20px", fontSize:"11px", color:"#9A7070", lineHeight:"1.7", maxHeight:"150px", overflowY:"auto" }}>
                              {hit.titles.map((title, tidx) => (
                                <li key={tidx}>{title}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              );
            })()}

            {/* ── THE HIT LIST TABLE ── */}
            {stats && !isAnalyzing && activeTab === "analyze" && (
              <div className="deco-card" style={{ padding:0, overflow:"hidden" }}>
                <div style={{ display:"flex", borderBottom:"1px solid #2A2318", padding:"0 16px" }}>
                  <button className={"tab-btn active"}>
                    🎯 THE HIT LIST ({cutListCount})
                    {cutListCount === 0 && <span style={{ marginLeft:"8px", color:"#6B5E3C", fontSize:"9px" }}>(check items you want to delete)</span>}
                    {cutListCount > 0 && filteredMovies.length > cutListCount && <span style={{ marginLeft:"8px", color:"#4A3F28", fontSize:"9px" }}>(of {filteredMovies.length} candidates)</span>}
                  </button>
                </div>
                <div style={{ padding:"0 16px 16px", overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ borderBottom:"1px solid #2A2318" }}>
                        <th style={{ padding:"10px 8px" }}>
                          <input type="checkbox" className="check-box"
                            checked={selectedIds.size === visibleFiltered.length && visibleFiltered.length > 0}
                            onChange={toggleSelectAll} />
                        </th>
                        <th style={{ padding:"10px 8px" }}></th>
                        <th style={{ padding:"10px 8px", textAlign:"left", cursor:"pointer", userSelect:"none" }} onClick={() => handleSort("title")}>
                          <span style={{ fontFamily:"var(--font-audiowide)", fontSize:"9px", letterSpacing:"0.15em", color: sortBy === "title" ? "#C9A84C" : "#4A3F28", fontWeight:400, display:"inline-flex", alignItems:"center", gap:"4px" }}>
                            TITLE {sortBy === "title" && (sortDir === "asc" ? "↑" : "↓")}
                          </span>
                        </th>
                        <th style={{ padding:"10px 8px", textAlign:"left", cursor:"pointer", userSelect:"none" }} onClick={() => handleSort("score")}>
                          <span style={{ fontFamily:"var(--font-audiowide)", fontSize:"9px", letterSpacing:"0.15em", color: sortBy === "score" ? "#C9A84C" : "#4A3F28", fontWeight:400, display:"inline-flex", alignItems:"center", gap:"4px" }}>
                            SCORE {sortBy === "score" && (sortDir === "asc" ? "↑" : "↓")}
                          </span>
                        </th>
                        <th style={{ padding:"10px 8px", textAlign:"left", cursor:"pointer", userSelect:"none" }} onClick={() => handleSort("size")}>
                          <span style={{ fontFamily:"var(--font-audiowide)", fontSize:"9px", letterSpacing:"0.15em", color: sortBy === "size" ? "#C9A84C" : "#4A3F28", fontWeight:400, display:"inline-flex", alignItems:"center", gap:"4px" }}>
                            SIZE {sortBy === "size" && (sortDir === "asc" ? "↑" : "↓")}
                          </span>
                        </th>
                        <th style={{ padding:"10px 8px", textAlign:"left", cursor:"pointer", userSelect:"none" }} onClick={() => handleSort("rating")}>
                          <span style={{ fontFamily:"var(--font-audiowide)", fontSize:"9px", letterSpacing:"0.15em", color: sortBy === "rating" ? "#C9A84C" : "#4A3F28", fontWeight:400, display:"inline-flex", alignItems:"center", gap:"4px" }}>
                            RTG {sortBy === "rating" && (sortDir === "asc" ? "↑" : "↓")}
                          </span>
                        </th>
                        <th style={{ padding:"10px 8px", textAlign:"left", cursor:"pointer", userSelect:"none" }} onClick={() => handleSort("plays")}>
                          <span style={{ fontFamily:"var(--font-audiowide)", fontSize:"9px", letterSpacing:"0.15em", color: sortBy === "plays" ? "#C9A84C" : "#4A3F28", fontWeight:400, display:"inline-flex", alignItems:"center", gap:"4px" }}>
                            PLAYS {sortBy === "plays" && (sortDir === "asc" ? "↑" : "↓")}
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleFiltered.map(m => {
                        const rowClasses = [
                          "result-row",
                          fadingIds.has(m.id) && "fading-out",
                          crumplingIds.has(m.id) && "hit-target", // Target appears
                          slidingIds.has(m.id) && "hit-row", // Row gets hit and fades
                        ].filter(Boolean).join(" ");

                        return (
                        <tr key={m.id} className={rowClasses} data-movie-id={m.id}
                          style={{ opacity: selectedIds.has(m.id) ? 1 : undefined, background: selectedIds.has(m.id) ? "#1C1608" : undefined }}>
                          <td style={{ padding:"10px 8px" }}>
                            <input type="checkbox" className="check-box" checked={selectedIds.has(m.id)} onChange={() => toggleSelect(m.id)} />
                          </td>
                          <td style={{ padding:"10px 4px 10px 8px" }}>
                            <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:"16px", transition:"transform 0.15s, filter 0.15s", filter:untouchables.has(m.id)?"drop-shadow(0 0 6px #C9A84C)":"none" }}
                              onClick={() => toggleStar(m.id)} title="Add to The Untouchables">
                              {untouchables.has(m.id) ? "⭐" : "☆"}
                            </button>
                          </td>
                          <td style={{ padding:"10px 8px", color:"#C8B99A", fontSize:"13px" }}>{m.title}{m.year ? <span style={{ color:"#4A3F28", fontSize:"11px", marginLeft:"6px" }}>({m.year})</span> : null}</td>
                          <td style={{ padding:"10px 8px" }}><ScoreCell score={m.score} /></td>
                          <td style={{ padding:"10px 8px", color:"#6B5E3C", fontSize:"12px" }}>{m.size}</td>
                          <td style={{ padding:"10px 8px", color:"#6B5E3C", fontSize:"12px" }}>{m.rating || "—"}</td>
                          <td style={{ padding:"10px 8px", color:"#4A3F28", fontSize:"12px" }}>{m.plays}</td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Controls v5.3.4 - Enhanced with page numbers */}
                <div style={{ borderTop:"1px solid #1A1408", padding:"20px 24px" }}>
                  {/* Top row: page size selector and info */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                      <span style={{ fontFamily:"var(--font-audiowide)", fontSize:"9px", letterSpacing:"0.1em", color:"#4A3F28" }}>
                        SHOW:
                      </span>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(parseInt(e.target.value))}
                        style={{ background:"#0D0A04", border:"1px solid #2A2318", color:"#C8B99A", padding:"6px 10px", fontFamily:"var(--font-audiowide)", fontSize:"10px", letterSpacing:"0.08em", cursor:"pointer", outline:"none" }}
                      >
                        {PAGE_SIZE_OPTIONS.map(size => (
                          <option key={size} value={size}>{size} items</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
                      <span style={{ fontFamily:"var(--font-audiowide)", fontSize:"11px", letterSpacing:"0.08em", color:"#C9A84C" }}>
                        Page {Math.ceil(visibleCount / pageSize)} of {Math.ceil(filteredMovies.length / pageSize)}
                      </span>
                      <div style={{ width:"1px", height:"12px", background:"#2A2318" }} />
                      <span style={{ fontFamily:"var(--font-audiowide)", fontSize:"10px", letterSpacing:"0.08em", color:"#6B5E3C" }}>
                        Showing {Math.min(visibleCount, filteredMovies.length)} of {filteredMovies.length}
                      </span>
                    </div>
                  </div>

                  {/* Bottom row: page number controls */}
                  {filteredMovies.length > pageSize && (
                    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"6px" }}>
                      {/* Previous button */}
                      <button
                        onClick={() => setVisibleCount(v => Math.max(pageSize, v - pageSize))}
                        disabled={visibleCount <= pageSize}
                        style={{
                          background:"none",
                          border:"1px solid #2A2318",
                          color:visibleCount <= pageSize ? "#2A2318" : "#C9A84C",
                          fontFamily:"var(--font-audiowide)",
                          fontSize:"9px",
                          letterSpacing:"0.08em",
                          padding:"6px 12px",
                          cursor:visibleCount <= pageSize ? "not-allowed" : "pointer",
                          borderRadius:"2px",
                          transition:"all 0.15s",
                          opacity:visibleCount <= pageSize ? 0.3 : 1,
                        }}
                        onMouseEnter={(e) => { if (visibleCount > pageSize) { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.boxShadow = "0 0 8px #C9A84C22"; }}}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A2318"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        ◄ PREV
                      </button>

                      {/* Page numbers - show first 2, current, last 2 with ellipsis */}
                      {(() => {
                        const currentPage = Math.ceil(visibleCount / pageSize);
                        const totalPages = Math.ceil(filteredMovies.length / pageSize);
                        const pageButtons = [];

                        const addPageButton = (pageNum: number) => {
                          const isActive = pageNum === currentPage;
                          pageButtons.push(
                            <button
                              key={pageNum}
                              onClick={() => setVisibleCount(pageNum * pageSize)}
                              style={{
                                background:isActive ? "#C9A84C22" : "none",
                                border:`1px solid ${isActive ? "#C9A84C" : "#2A2318"}`,
                                color:isActive ? "#C9A84C" : "#6B5E3C",
                                fontFamily:"var(--font-audiowide)",
                                fontSize:"11px",
                                padding:"6px 10px",
                                cursor:"pointer",
                                borderRadius:"2px",
                                minWidth:"32px",
                                transition:"all 0.15s",
                                boxShadow:isActive ? "0 0 12px #C9A84C22" : "none",
                              }}
                              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}}
                              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.borderColor = "#2A2318"; e.currentTarget.style.color = "#6B5E3C"; }}}
                            >
                              {pageNum}
                            </button>
                          );
                        };

                        if (totalPages <= 7) {
                          for (let i = 1; i <= totalPages; i++) addPageButton(i);
                        } else {
                          // Always show first page
                          addPageButton(1);
                          if (currentPage > 3) {
                            pageButtons.push(<span key="ellipsis1" style={{ color:"#4A3F28", fontSize:"12px", padding:"0 4px" }}>...</span>);
                          }
                          // Show pages around current
                          const start = Math.max(2, currentPage - 1);
                          const end = Math.min(totalPages - 1, currentPage + 1);
                          for (let i = start; i <= end; i++) {
                            if (i > 1 && i < totalPages) addPageButton(i);
                          }
                          if (currentPage < totalPages - 2) {
                            pageButtons.push(<span key="ellipsis2" style={{ color:"#4A3F28", fontSize:"12px", padding:"0 4px" }}>...</span>);
                          }
                          // Always show last page
                          if (totalPages > 1) addPageButton(totalPages);
                        }

                        return pageButtons;
                      })()}

                      {/* Next button */}
                      <button
                        onClick={() => setVisibleCount(v => Math.min(filteredMovies.length, v + pageSize))}
                        disabled={visibleCount >= filteredMovies.length}
                        style={{
                          background:"none",
                          border:"1px solid #2A2318",
                          color:visibleCount >= filteredMovies.length ? "#2A2318" : "#C9A84C",
                          fontFamily:"var(--font-audiowide)",
                          fontSize:"9px",
                          letterSpacing:"0.08em",
                          padding:"6px 12px",
                          cursor:visibleCount >= filteredMovies.length ? "not-allowed" : "pointer",
                          borderRadius:"2px",
                          transition:"all 0.15s",
                          opacity:visibleCount >= filteredMovies.length ? 0.3 : 1,
                        }}
                        onMouseEnter={(e) => { if (visibleCount < filteredMovies.length) { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.boxShadow = "0 0 8px #C9A84C22"; }}}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A2318"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        NEXT ►
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <div className="deco-sep" style={{ marginTop:"40px" }} />
      <footer style={{ padding:"16px 24px", maxWidth:"1280px", margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:"var(--font-audiowide)", fontSize:"10px", letterSpacing:"0.15em", color:"#E84040" }}>
            PLEXIQ v5.3.4 ·{" "}
            <a href="https://resume.richknowles.com" target="_blank" rel="noopener noreferrer" className="resume-link">RICH KNOWLES</a>
          </div>
          <div style={{ display:"flex", gap:"20px" }}>
            {["GITHUB", "DOCS"].map(l => (
              <span key={l} style={{ fontFamily:"var(--font-audiowide)", fontSize:"10px", letterSpacing:"0.15em", color:"#E84040", cursor:"pointer" }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>

      {/* ── TRIPLE CONFIRM MODAL ── */}
      {confirmStep > 0 && (
        <div className="modal-overlay" onClick={cancelConfirm}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", gap:"6px", marginBottom:"24px" }}>
              {[1,2,3].map(s => (
                <div key={s} style={{ height:"3px", flex:1, borderRadius:"2px", background:confirmStep >= s ? "#C9A84C" : "#2A2318", transition:"background 0.3s" }} />
              ))}
            </div>

            {confirmStep === 1 && (
              <>
                <div style={{ fontFamily:"var(--font-audiowide)", fontSize:"13px", letterSpacing:"0.15em", color:"#C9A84C", marginBottom:"16px" }}>CONFIRM DELETION — 1 OF 3</div>
                <p style={{ color:"#C8B99A", fontSize:"13px", lineHeight:1.7, marginBottom:"24px" }}>
                  You are about to delete <strong style={{ color:"#C9A84C" }}>{deleteTargets} file{deleteTargets !== 1 ? "s" : ""}</strong> from <strong style={{ color:"#C9A84C" }}>{selectedLibraryTitle || "your library"}</strong>.
                  {isDryRun ? " (DRY RUN — nothing will actually be deleted.)" : ""}
                </p>
              </>
            )}

            {confirmStep === 2 && (
              <>
                <div style={{ fontFamily:"var(--font-audiowide)", fontSize:"13px", letterSpacing:"0.15em", color:isDryRun?"#C9A84C":"#C05050", marginBottom:"16px" }}>ARE YOU CERTAIN? — 2 OF 3</div>
                <p style={{ color:"#C8B99A", fontSize:"13px", lineHeight:1.7, marginBottom:"24px" }}>
                  {isDryRun
                    ? "Dry run will simulate the deletion and log the results. No files will be touched."
                    : <><strong style={{ color:"#E07070" }}>This cannot be undone.</strong> Files will be permanently removed from disk. The Untouchables are always protected.</>}
                </p>
              </>
            )}

            {confirmStep === 3 && (
              <>
                <div style={{ fontFamily:"var(--font-audiowide)", fontSize:"13px", letterSpacing:"0.15em", color:isDryRun?"#C9A84C":"#C05050", marginBottom:"16px" }}>FINAL AUTHORIZATION — 3 OF 3</div>
                <p style={{ color:"#6B5E3C", fontSize:"11px", marginBottom:"16px" }}>Enter your password to execute.</p>
                <input
                  type="password"
                  className="pwd-input"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPwdError(false); }}
                  onKeyDown={e => e.key === "Enter" && handleConfirmNext()}
                  placeholder="••••••••"
                  autoFocus
                />
                {pwdError && <div style={{ color:"#C05050", fontSize:"11px", marginTop:"6px", fontFamily:"var(--font-audiowide)" }}>PASSWORD REQUIRED</div>}
              </>
            )}

            <div style={{ display:"flex", gap:"12px", marginTop:"24px" }}>
              <button className="u-btn" style={{ flex:1 }} onClick={cancelConfirm}>CANCEL</button>
              <button
                className={"u-btn " + (isDryRun ? "primary" : "danger live")}
                style={{ flex:1 }}
                onClick={handleConfirmNext}
              >
                {confirmStep === 3
                  ? (isDryRun ? "✓ EXECUTE DRY RUN" : "🗑️ DELETE NOW")
                  : "CONTINUE →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Success Feedback Banner (v5.3.4) */}
      {deletionStats && (
        <DeletionFeedback
          count={deletionStats.count}
          bytesFreed={deletionStats.bytesFreed}
          executionTime={deletionStats.executionTime}
          titles={deletionStats.titles}
          onDismiss={() => setDeletionStats(null)}
        />
      )}
    </div>
  );
}
