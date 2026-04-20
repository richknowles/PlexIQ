'use client'

import { useRef, useState, useCallback } from 'react'

type Phase = 'idle' | 'scoping' | 'locked' | 'fired' | 'dead'

const COLS = 4
const ROWS = 5

const TARGET = {
  title: 'Battlefield Earth',
  year: 2000,
  score: 94.2,
  size: '38.4 GB',
  rating: 2.3,
  plays: 0,
}

const POSTER_BG = 'linear-gradient(160deg, #1a0a00 0%, #3d1a00 30%, #1a0a00 60%, #0a0000 100%)'

export default function KillDemo() {
  const [phase, setPhase] = useState<Phase>('idle')
  const posterRef    = useRef<HTMLDivElement>(null)
  const scopeRef     = useRef<HTMLDivElement>(null)
  const tilesRef     = useRef<HTMLDivElement>(null)
  const flashRef     = useRef<HTMLDivElement>(null)
  const crosshairRef = useRef<SVGSVGElement>(null)
  const tweensRef    = useRef<Array<{ kill(): void }>>([])

  const handleAcquire = useCallback(async () => {
    if (phase !== 'idle') return
    setPhase('scoping')
    const { gsap } = await import('gsap')

    gsap.fromTo(scopeRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' })

    const breathe = gsap.to(crosshairRef.current, {
      x: 7, y: -5, rotation: 1.5,
      duration: 2.4, ease: 'sine.inOut',
      yoyo: true, repeat: -1,
    })
    tweensRef.current.push(breathe)

    gsap.to(posterRef.current, { scale: 1.06, duration: 0.7, ease: 'power2.out' })

    setTimeout(() => setPhase('locked'), 1200)
  }, [phase])

  const handleFire = useCallback(async () => {
    if (phase !== 'locked') return
    setPhase('fired')
    const { gsap } = await import('gsap')

    tweensRef.current.forEach(t => t.kill())

    gsap.set(flashRef.current, { opacity: 1 })
    gsap.to(flashRef.current, { opacity: 0, duration: 0.45, ease: 'power3.out' })

    gsap.to(crosshairRef.current, {
      scale: 1.25, y: -12, duration: 0.07, ease: 'power4.out',
      onComplete: () => {
        gsap.to(scopeRef.current, { opacity: 0, duration: 0.55, delay: 0.15 })
      }
    })

    const shards = Array.from(tilesRef.current?.querySelectorAll('.shard') ?? []) as HTMLElement[]
    if (posterRef.current)  posterRef.current.style.visibility  = 'hidden'
    if (tilesRef.current)   tilesRef.current.style.visibility   = 'visible'

    gsap.fromTo(shards,
      { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1 },
      {
        opacity: 0,
        x: (_i: number, el: Element) => {
          const col = Number((el as HTMLElement).dataset.col) - (COLS / 2 - 0.5)
          return col * 180 + (Math.random() - 0.5) * 120
        },
        y: (_i: number, el: Element) => {
          const row = Number((el as HTMLElement).dataset.row) - (ROWS / 2 - 0.5)
          return row * 160 + Math.random() * 100 + 40
        },
        rotation: () => (Math.random() - 0.5) * 420,
        scale: () => 0.15 + Math.random() * 0.45,
        duration: 1.5,
        ease: 'power3.out',
        stagger: { amount: 0.18, from: 'center' },
        delay: 0.12,
      }
    )

    setTimeout(() => setPhase('dead'), 2000)
  }, [phase])

  const handleReset = useCallback(() => {
    tweensRef.current.forEach(t => t.kill())
    tweensRef.current = []
    if (posterRef.current) {
      posterRef.current.style.visibility = 'visible'
      posterRef.current.style.transform  = ''
    }
    if (tilesRef.current)   tilesRef.current.style.visibility  = 'hidden'
    if (scopeRef.current)   scopeRef.current.style.opacity     = '0'
    if (flashRef.current)   flashRef.current.style.opacity     = '0'
    setPhase('idle')
  }, [])

  const shards = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const xPct = `${(col / (COLS - 1)) * 100}%`
      const yPct = `${(row / (ROWS - 1)) * 100}%`
      shards.push(
        <div
          key={`${row}-${col}`}
          className="shard"
          data-row={row}
          data-col={col}
          style={{
            position: 'absolute',
            width:  `${100 / COLS}%`,
            height: `${100 / ROWS}%`,
            left:   `${(col / COLS) * 100}%`,
            top:    `${(row / ROWS) * 100}%`,
            background: POSTER_BG,
            backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
            backgroundPosition: `${xPct} ${yPct}`,
            boxSizing: 'border-box',
            border: '0.5px solid rgba(255,80,0,0.08)',
          }}
        />
      )
    }
  }

  return (
    <div
      onClick={phase === 'locked' ? handleFire : phase === 'idle' ? handleAcquire : undefined}
      style={{
        minHeight: '100vh',
        background: '#050505',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Georgia', serif",
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
        cursor: phase === 'locked' ? 'crosshair' : phase === 'idle' ? 'pointer' : 'default',
      }}>

      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
        zIndex: 1,
      }} />

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>

        <div style={{ marginBottom: 32, opacity: phase === 'dead' ? 0 : 1, transition: 'opacity 0.4s' }}>
          <p style={{ color: '#8b0000', fontSize: 11, letterSpacing: 6, textTransform: 'uppercase', margin: 0 }}>
            Target Acquired
          </p>
          <p style={{ color: '#555', fontSize: 11, letterSpacing: 3, margin: '4px 0 0' }}>
            Score {TARGET.score} · {TARGET.size} · {TARGET.plays} Plays
          </p>
        </div>

        <div style={{ position: 'relative', width: 220, height: 320, margin: '0 auto' }}>

          <div ref={posterRef} style={{
            position: 'absolute', inset: 0,
            background: POSTER_BG,
            borderRadius: 4,
            boxShadow: '0 0 40px rgba(139,0,0,0.4), 0 20px 60px rgba(0,0,0,0.8)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'flex-end',
            padding: 16, boxSizing: 'border-box',
          }}>
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: '#8b0000', borderRadius: 2,
              padding: '3px 7px', fontSize: 11, color: '#fff',
              fontFamily: 'monospace', letterSpacing: 1,
            }}>
              {TARGET.score}
            </div>
            <div style={{ color: '#ff4400', fontSize: 11, letterSpacing: 3, marginBottom: 4 }}>
              ★ {TARGET.rating}
            </div>
            <div style={{ color: '#e8d5b0', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 }}>
              {TARGET.title}
            </div>
            <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>{TARGET.year}</div>
          </div>

          <div ref={tilesRef} style={{
            position: 'absolute', inset: 0,
            visibility: 'hidden', borderRadius: 4, overflow: 'visible',
          }}>
            {shards}
          </div>
        </div>

        <div style={{ marginTop: 40, opacity: phase === 'dead' ? 0 : 1, transition: 'opacity 0.3s' }}>
          {phase === 'idle' && (
            <button onClick={handleAcquire} style={btnStyle('#8b0000')}>
              ◎ Acquire Target
            </button>
          )}
          {phase === 'scoping' && (
            <p style={{ color: '#555', fontSize: 11, letterSpacing: 4 }}>Acquiring…</p>
          )}
          {phase === 'locked' && (
            <button onClick={handleFire} style={{ ...btnStyle('#cc0000'), animation: 'pulse 0.8s infinite' }}>
              ✕ Fire
            </button>
          )}
          {phase === 'fired' && (
            <p style={{ color: '#333', fontSize: 11, letterSpacing: 4 }}>…</p>
          )}
        </div>
      </div>

      {/* SCOPE OVERLAY */}
      <div ref={scopeRef} style={{
        position: 'fixed', inset: 0,
        opacity: 0, pointerEvents: 'none',
        zIndex: 10,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle 180px at 50% 50%, transparent 178px, rgba(0,0,0,0.94) 182px)',
        }} />
        <svg ref={crosshairRef} viewBox="0 0 400 400" style={{
          position: 'absolute',
          width: 360, height: 360,
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          overflow: 'visible',
        }}>
          <circle cx="200" cy="200" r="178" fill="none" stroke="rgba(200,200,200,0.25)" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="170" fill="none" stroke="rgba(200,200,200,0.1)"  strokeWidth="0.5" />
          <line x1="22"  y1="200" x2="155" y2="200" stroke="rgba(220,50,50,0.8)"  strokeWidth="1" />
          <line x1="245" y1="200" x2="378" y2="200" stroke="rgba(220,50,50,0.8)"  strokeWidth="1" />
          <line x1="200" y1="22"  x2="200" y2="155" stroke="rgba(220,50,50,0.8)"  strokeWidth="1" />
          <line x1="200" y1="245" x2="200" y2="378" stroke="rgba(220,50,50,0.8)"  strokeWidth="1" />
          <circle cx="200" cy="200" r="2.5" fill="rgba(220,50,50,0.9)" />
          {[120, 140, 160, 240, 260, 280].map(x => (
            <circle key={`h${x}`} cx={x} cy="200" r="1.2" fill="rgba(200,200,200,0.5)" />
          ))}
          {[120, 140, 160, 240, 260, 280].map(y => (
            <circle key={`v${y}`} cx="200" cy={y} r="1.2" fill="rgba(200,200,200,0.5)" />
          ))}
          {Array.from({ length: 32 }, (_, i) => {
            const angle = (i / 32) * Math.PI * 2
            const inner = i % 4 === 0 ? 158 : 163
            return (
              <line key={i}
                x1={200 + Math.cos(angle) * inner}
                y1={200 + Math.sin(angle) * inner}
                x2={200 + Math.cos(angle) * 170}
                y2={200 + Math.sin(angle) * 170}
                stroke="rgba(200,200,200,0.3)"
                strokeWidth={i % 4 === 0 ? 1.2 : 0.6}
              />
            )
          })}
          <text x="30"  y="195" fill="rgba(220,50,50,0.7)"  fontSize="8" fontFamily="monospace">SCORE</text>
          <text x="30"  y="207" fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="monospace">{TARGET.score}</text>
          <text x="290" y="195" fill="rgba(220,50,50,0.7)"  fontSize="8" fontFamily="monospace">SIZE</text>
          <text x="290" y="207" fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="monospace">{TARGET.size}</text>
          <text x="200" y="375" fill={phase === 'locked' ? 'rgba(255,30,30,1)' : 'rgba(220,50,50,0.5)'}
            fontSize={phase === 'locked' ? '11' : '8'} fontFamily="monospace" textAnchor="middle"
            style={{ animation: phase === 'locked' ? 'svgPulse 0.7s infinite' : 'none' }}>
            {phase === 'locked' ? '[ CLICK ANYWHERE TO FIRE ]' : 'ACQUIRING TARGET…'}
          </text>
          {/* Lock indicator — ring turns red when locked */}
          <circle cx="200" cy="200" r="178" fill="none"
            stroke={phase === 'locked' ? 'rgba(255,30,30,0.6)' : 'rgba(200,200,200,0.25)'}
            strokeWidth={phase === 'locked' ? '2' : '1.5'} />
        </svg>
      </div>

      {/* MUZZLE FLASH */}
      <div ref={flashRef} style={{
        position: 'fixed', inset: 0,
        background: 'white',
        opacity: 0, pointerEvents: 'none',
        zIndex: 20,
      }} />

      {/* DEATH SCREEN */}
      {phase === 'dead' && (
        <div style={{
          position: 'fixed', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 30,
          animation: 'fadeIn 0.6s ease-out forwards',
        }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🐟</div>
          <p style={{ color: '#8b0000', fontSize: 13, letterSpacing: 8, margin: 0 }}>SLEEPS WITH THE FISHES</p>
          <p style={{ color: '#555',    fontSize: 11, letterSpacing: 4, margin: '12px 0 0' }}>
            {TARGET.title.toUpperCase()} · {TARGET.size} RECLAIMED
          </p>
          <button onClick={handleReset} style={{ ...btnStyle('#1a1a1a'), marginTop: 40, fontSize: 10 }}>
            ↺ New Target
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        @keyframes fadeIn   { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        @keyframes svgPulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </div>
  )
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: '#ccc',
    border: '1px solid #333',
    padding: '10px 28px',
    fontSize: 11,
    letterSpacing: 4,
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    fontFamily: "'Georgia', serif",
  }
}
