"use client";

import { useState, useEffect, useRef } from "react";
import ThresholdSlider from "@/components/threshold-slider";
import LibraryStatsDisplay from "@/components/library-stats";
import MustardProgress from "@/components/mustard-progress";
import { LibraryStats } from "@/types/plexiq";

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
    padding:44px 20px 20px; min-height:140px;
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
  a.resume-link { color:#C9A84C; text-decoration:none; transition:color 0.2s, text-shadow 0.2s; }
  a.resume-link:hover { color:#E8C96C; text-shadow:0 0 10px #C9A84C88; }
`;

// Higher score = more deletable. Filter: score >= (1 - threshold)
const ALL_MOVIES = [
  { id:1,  title:"Blade Runner 2049",          score:0.92, size:"18.4 GB", rating:8.0, plays:0 },
  { id:2,  title:"The Lighthouse",             score:0.88, size:"12.1 GB", rating:7.5, plays:0 },
  { id:3,  title:"Midsommar",                  score:0.83, size:"9.8 GB",  rating:7.1, plays:1 },
  { id:4,  title:"Enemy",                      score:0.78, size:"7.2 GB",  rating:6.9, plays:0 },
  { id:5,  title:"Annihilation",               score:0.73, size:"14.3 GB", rating:6.8, plays:0 },
  { id:6,  title:"Hereditary",                 score:0.68, size:"8.9 GB",  rating:7.3, plays:2 },
  { id:7,  title:"Under the Silver Lake",      score:0.62, size:"6.4 GB",  rating:6.2, plays:0 },
  { id:8,  title:"mother!",                    score:0.57, size:"11.2 GB", rating:6.7, plays:1 },
  { id:9,  title:"The House That Jack Built",  score:0.51, size:"10.5 GB", rating:6.8, plays:0 },
  { id:10, title:"High Life",                  score:0.46, size:"7.7 GB",  rating:6.4, plays:0 },
  { id:11, title:"Suspiria (2018)",            score:0.41, size:"15.2 GB", rating:6.8, plays:0 },
  { id:12, title:"Border",                     score:0.37, size:"5.9 GB",  rating:7.1, plays:1 },
  { id:13, title:"Cold War",                   score:0.33, size:"8.3 GB",  rating:7.6, plays:0 },
  { id:14, title:"The Favourite",              score:0.28, size:"12.8 GB", rating:7.6, plays:1 },
  { id:15, title:"First Reformed",             score:0.24, size:"6.1 GB",  rating:7.5, plays:0 },
];

const PAGE_SIZE = 7;
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
  const [threshold, setThreshold]         = useState(0.5);
  const [selectedLibrary, setSelectedLibrary] = useState("");
  const [isAnalyzing, setIsAnalyzing]     = useState(false);
  const [isDryRun, setIsDryRun]           = useState(true);
  const [progress, setProgress]           = useState({ current:0, total:0, stage:"", message:"" });
  const [stats, setStats]                 = useState<LibraryStats | null>(null);
  const [activeTab, setActiveTab]         = useState<"analyze"|"saved">("analyze");
  const [untouchables, setUntouchables]   = useState<Set<number>>(new Set());
  const [fadingIds, setFadingIds]         = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds]     = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount]   = useState(PAGE_SIZE);
  const [confirmStep, setConfirmStep]     = useState<0|1|2|3>(0);
  const [password, setPassword]           = useState("");
  const [pwdError, setPwdError]           = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const libraries = ["Movies", "TV Shows", "Music", "4K Movies"];

  const filteredMovies = ALL_MOVIES.filter(m => m.score >= (1 - threshold) && !fadingIds.has(m.id) && !untouchables.has(m.id));
  const visibleFiltered = filteredMovies.slice(0, visibleCount);
  const hasMore = filteredMovies.length > visibleCount;
  const untouchableItems = ALL_MOVIES.filter(m => untouchables.has(m.id));

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
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleFiltered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleFiltered.map(m => m.id)));
    }
  };

  const handleAnalyze = async () => {
    if (!selectedLibrary) { alert("Select a library first"); return; }
    setIsAnalyzing(true);
    setVisibleCount(PAGE_SIZE);
    const stages = [
      { stage:"connecting", message:"Connecting to Plex...",          duration:700  },
      { stage:"collecting", message:"Pulling metadata...",            duration:1400 },
      { stage:"enriching",  message:"Fetching IMDb ratings...",       duration:1100 },
      { stage:"enriching",  message:"Fetching TMDb data...",          duration:1000 },
      { stage:"scoring",    message:"Calculating deletion scores...", duration:1400 },
      { stage:"complete",   message:"Analysis complete.",             duration:300  },
    ];
    let current = 0;
    for (const { stage, message, duration } of stages) {
      setProgress({ current, total:100, stage, message });
      await new Promise(r => setTimeout(r, duration));
      current += Math.floor(100 / stages.length);
    }
    setStats({ name:selectedLibrary, itemCount:1247, totalSize:5_432_109_876_543, avgScore:0.65, deletionCandidates:342, potentialSpaceSaved:1_234_567_890_123 });
    setIsAnalyzing(false);
    setActiveTab("analyze");
  };

  const handleDeleteClick = () => {
    if (!stats || isAnalyzing) return;
    setConfirmStep(1);
  };

  const handleConfirmNext = () => {
    if (confirmStep === 2) { setConfirmStep(3); return; }
    if (confirmStep === 3) {
      if (!password.trim()) { setPwdError(true); return; }
      setPwdError(false);
      setConfirmStep(0);
      setPassword("");
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 4000);
      return;
    }
    setConfirmStep(prev => (prev + 1) as 0|1|2|3);
  };

  const cancelConfirm = () => { setConfirmStep(0); setPassword(""); setPwdError(false); };

  const deleteTargets = selectedIds.size > 0 ? selectedIds.size : filteredMovies.length;
  const showPoliceLights = !isDryRun && confirmStep > 0;

  const ScoreCell = ({ score }: { score: number }) => {
    const color = score >= 0.85 ? "#E84040" : score >= 0.65 ? "#C9A84C" : "#8B7355";
    return <span style={{ color, fontWeight:700, fontFamily:"var(--font-audiowide)", fontSize:"13px" }}>{score.toFixed(2)}</span>;
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0A0804", color:"#C8B99A" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── HEADER ── */}
      <header style={{ borderBottom:"1px solid #2A2318", background:"#0D0A04", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ height:"2px", background:"linear-gradient(90deg,transparent,#C9A84C,#E8C96C,#C9A84C,transparent)" }} />
        <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"16px 24px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
              <div style={{ fontSize:"42px", lineHeight:1, userSelect:"none" }}>🌭</div>
              <div>
                <h1 style={{ fontFamily:"var(--font-audiowide)", fontSize:"28px", letterSpacing:"0.06em", background:"linear-gradient(135deg,#E8C96C 0%,#C9A84C 50%,#8B6914 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", margin:0 }}>
                  PLEXIQ
                </h1>
                <p style={{ margin:0, fontSize:"9px", letterSpacing:"0.25em", color:"#4A3F28", fontFamily:"var(--font-audiowide)", marginTop:"2px" }}>
                  v5.3.1 · CHICAGO EDITION
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
                  <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#3A7A3A", boxShadow:"0 0 6px #3A7A3A" }} />
                  <span style={{ fontSize:"11px", color:"#3A7A3A", fontFamily:"var(--font-audiowide)", letterSpacing:"0.05em" }}>CONNECTED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="deco-sep" />
      </header>

      {/* ── POLICE LIGHTS BAR ── */}
      {showPoliceLights && (
        <div className="police-bar">
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
          ✓ DELETION EXECUTED — {deleteTargets} FILES REMOVED
        </div>
      )}

      {/* ── MAIN ── */}
      <main style={{ maxWidth:"1280px", margin:"0 auto", padding:"32px 24px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:"24px" }}>

          {/* ── LEFT PANEL ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

            <div className="deco-card" style={{ padding:"20px" }}>
              <div style={{ fontFamily:"var(--font-audiowide)", fontSize:"9px", letterSpacing:"0.2em", color:"#4A3F28", marginBottom:"12px" }}>SELECT LIBRARY</div>
              <select value={selectedLibrary} onChange={e => setSelectedLibrary(e.target.value)} disabled={isAnalyzing}
                style={{ width:"100%", background:"#0D0A04", border:"1px solid #2A2318", color:"#C8B99A", padding:"10px 14px", fontFamily:"var(--font-audiowide)", fontSize:"11px", letterSpacing:"0.08em", cursor:"pointer", outline:"none" }}>
                <option value="">CHOOSE LIBRARY...</option>
                {libraries.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </select>
            </div>

            <div className="deco-card" style={{ padding:"20px" }}>
              <ThresholdSlider value={threshold} onChange={setThreshold} disabled={isAnalyzing} />
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              <button className="u-btn primary" onClick={handleAnalyze} disabled={isAnalyzing || !selectedLibrary}>
                {isAnalyzing ? "ANALYZING..." : "🔍 ANALYZE LIBRARY"}
              </button>
              <button className="u-btn" onClick={() => setActiveTab("analyze")} disabled={!stats}>
                DELETION CANDIDATES ({stats ? filteredMovies.length : "—"})
              </button>
              <button className="u-btn" onClick={() => setActiveTab("saved")}
                style={{ borderColor:untouchables.size > 0 ? "#C9A84C88" : undefined, color:untouchables.size > 0 ? "#FFE066" : undefined }}>
                ★ THE UNTOUCHABLES ({untouchables.size})
              </button>
              <button className={"u-btn danger" + (!isDryRun ? " live" : "")}
                disabled={!stats || isAnalyzing} onClick={handleDeleteClick}>
                {isDryRun
                  ? `🌭 DELETE CANDIDATES (DRY RUN)`
                  : `🗑️ DELETE ${selectedIds.size > 0 ? selectedIds.size : filteredMovies.length} FILES — LIVE`}
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
                <h2 style={{ fontFamily:"var(--font-audiowide)", fontSize:"22px", letterSpacing:"0.1em", color:"#C9A84C", margin:"0 0 12px" }}>PLEXIQ v5.3.1</h2>
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

            {/* ── CANDIDATES TABLE ── */}
            {stats && !isAnalyzing && activeTab === "analyze" && (
              <div className="deco-card" style={{ padding:0, overflow:"hidden" }}>
                <div style={{ display:"flex", borderBottom:"1px solid #2A2318", padding:"0 16px" }}>
                  <button className={"tab-btn active"}>
                    CANDIDATES ({filteredMovies.length})
                    {selectedIds.size > 0 && <span style={{ marginLeft:"8px", color:"#C9A84C", fontSize:"9px" }}>[{selectedIds.size} SELECTED]</span>}
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
                        {["", "TITLE", "SCORE", "SIZE", "RTG", "PLAYS"].map(h => (
                          <th key={h} style={{ padding:"10px 8px", textAlign:"left", fontFamily:"var(--font-audiowide)", fontSize:"9px", letterSpacing:"0.15em", color:"#4A3F28", fontWeight:400 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleFiltered.map(m => (
                        <tr key={m.id} className={"result-row" + (fadingIds.has(m.id) ? " fading-out" : "")}
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
                          <td style={{ padding:"10px 8px", color:"#C8B99A", fontSize:"13px" }}>{m.title}</td>
                          <td style={{ padding:"10px 8px" }}><ScoreCell score={m.score} /></td>
                          <td style={{ padding:"10px 8px", color:"#6B5E3C", fontSize:"12px" }}>{m.size}</td>
                          <td style={{ padding:"10px 8px", color:"#6B5E3C", fontSize:"12px" }}>{m.rating}</td>
                          <td style={{ padding:"10px 8px", color:"#4A3F28", fontSize:"12px" }}>{m.plays}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {hasMore && (
                  <div style={{ borderTop:"1px solid #1A1408", padding:"12px 24px", textAlign:"center", cursor:"pointer" }} onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
                    <span style={{ fontFamily:"var(--font-audiowide)", fontSize:"10px", letterSpacing:"0.12em", color:"#C9A84C" }}>
                      LOAD MORE ↓ ({filteredMovies.length - visibleCount} remaining)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <div className="deco-sep" style={{ marginTop:"40px" }} />
      <footer style={{ padding:"16px 24px", maxWidth:"1280px", margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:"var(--font-audiowide)", fontSize:"9px", letterSpacing:"0.15em", color:"#2A2318" }}>
            PLEXIQ v5.3.1 ·{" "}
            <a href="https://resume.richknowles.com" target="_blank" rel="noopener noreferrer" className="resume-link">RICH KNOWLES</a>
          </div>
          <div style={{ display:"flex", gap:"20px" }}>
            {["GITHUB", "DOCS"].map(l => (
              <span key={l} style={{ fontFamily:"var(--font-audiowide)", fontSize:"9px", letterSpacing:"0.15em", color:"#2A2318", cursor:"pointer" }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>

      {/* ── TRIPLE CONFIRM MODAL ── */}
      {confirmStep > 0 && (
        <div className="modal-overlay" onClick={cancelConfirm}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            {/* Step indicator */}
            <div style={{ display:"flex", gap:"6px", marginBottom:"24px" }}>
              {[1,2,3].map(s => (
                <div key={s} style={{ height:"3px", flex:1, borderRadius:"2px", background:confirmStep >= s ? "#C9A84C" : "#2A2318", transition:"background 0.3s" }} />
              ))}
            </div>

            {confirmStep === 1 && (
              <>
                <div style={{ fontFamily:"var(--font-audiowide)", fontSize:"13px", letterSpacing:"0.15em", color:"#C9A84C", marginBottom:"16px" }}>CONFIRM DELETION — 1 OF 3</div>
                <p style={{ color:"#C8B99A", fontSize:"13px", lineHeight:1.7, marginBottom:"24px" }}>
                  You are about to delete <strong style={{ color:"#C9A84C" }}>{deleteTargets} file{deleteTargets !== 1 ? "s" : ""}</strong> from <strong style={{ color:"#C9A84C" }}>{selectedLibrary || "your library"}</strong>.
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
    </div>
  );
}
