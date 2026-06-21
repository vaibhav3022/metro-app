import React, { useState } from 'react';
import { Map, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

// ─── Exact stations from React Native MetroMapScreen.js ──────────────────────
const PURPLE = [
  "PCMC", "Sant Tukaram Nagar", "Bhosari (Nashik Phata)", "Kasarwadi",
  "Phugewadi", "Dapodi", "Bopodi", "Khadki", "Range Hills",
  "Shivaji Nagar", "Civil Court", "Budhwar Peth", "Mandai", "Swargate"
];
const AQUA = [
  "Vanaz", "Anand Nagar", "Ideal Colony", "Nal Stop",
  "Garware College", "Deccan Gymkhana", "Chhatrapati Sambhaji Udyan",
  "PMC", "Civil Court", "Mangalwar Peth", "Pune Railway Station",
  "Ruby Hall Clinic", "Bund Garden", "Yerawada", "Kalyani Nagar", "Ramwadi"
];
const RED = [
  "Megapolis Circle", "Hinjawadi", "Wakad", "Balewadi",
  "Baner", "University", "Shivaji Nagar", "Civil Court"
];

// ─── Fixed coordinate layout ─────────────────────────────────────────────────
// Purple: vertical at x=680, starting y=60, step=65
const PX    = 680;
const PY0   = 60;
const PSTEP = 65;

const SHIVAJI_Y = PY0 + 9  * PSTEP;  // index 9  → 645
const CIVIL_Y   = PY0 + 10 * PSTEP;  // index 10 → 710

// Aqua: horizontal at y=CIVIL_Y, Civil Court at index 8, step=75
const AQUA_STEP     = 75;
const CIVIL_IDX_A   = 8;
const AQ_X0         = PX - CIVIL_IDX_A * AQUA_STEP; // 680 - 600 = 80
const AQ_XN         = AQ_X0 + (AQUA.length - 1) * AQUA_STEP;

// Red: diagonal from top-left ending at Civil Court
// We fix: index 6 (Shivaji Nagar) → (PX, SHIVAJI_Y), index 7 (Civil Court) → (PX, CIVIL_Y)
// Each step before Shivaji Nagar goes: -95 in X, -62 in Y
const R_DX = 95, R_DY = 62;
const redPts = RED.map((_, i) => {
  const steps = i - 6; // relative to Shivaji Nagar (index 6)
  if (i === 6) return { x: PX, y: SHIVAJI_Y };
  if (i === 7) return { x: PX, y: CIVIL_Y };
  return { x: PX + steps * R_DX, y: SHIVAJI_Y + steps * R_DY };
});

const SVG_W = Math.max(AQ_XN + 150, 1260);
const SVG_H = PY0 + 13 * PSTEP + 120;

const isXchg = (n) => n === "Civil Court" || n === "Shivaji Nagar";

export default function MetroMap() {
  const [scale, setScale] = useState(1);
  const [tip, setTip]     = useState(null);

  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>
        Interactive Route Map
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Pune Metro — 3 Lines · 38 Stations · 2 Interchange Nodes
      </p>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: 24, position: 'relative' }}>

        {/* Zoom */}
        <div style={{ position:'absolute', right:16, top:16, zIndex:20, display:'flex', flexDirection:'column', gap:8 }}>
          {[
            { label: '+', fn: () => setScale(p => Math.min(p+0.2, 3)) },
            { label: '⊙', fn: () => setScale(1) },
            { label: '−', fn: () => setScale(p => Math.max(p-0.2, 0.4)) },
          ].map((b,i) => (
            <button key={i} onClick={b.fn} className="btn" style={{
              background:'var(--bg-secondary)', width:40, height:40, borderRadius:12,
              border:'1px solid var(--glass-border)', color:'var(--text-primary)', fontSize:18, fontWeight:700,
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>{b.label}</button>
          ))}
        </div>

        {/* Tooltip */}
        {tip && (
          <div style={{
            position:'absolute', top:16, left:16, zIndex:30,
            background:'var(--bg-secondary)', border:'1px solid var(--glass-border)',
            borderRadius:14, padding:'12px 18px', pointerEvents:'none',
            boxShadow: 'var(--box-shadow)'
          }}>
            <div style={{ fontWeight:800, fontSize:14, color:'var(--text-primary)' }}>{tip.name}</div>
            <div style={{ fontSize:11, color:'var(--text-secondary)', marginTop:3 }}>{tip.line}</div>
            {isXchg(tip.name) && <div style={{ fontSize:11, color:'#F57C00', marginTop:4, fontWeight:700 }}>⇄ Interchange</div>}
          </div>
        )}

        {/* Map */}
        <div style={{ width:'100%', height:660, overflow:'auto',
          background:'var(--bg-primary)', cursor:'grab' }}>
          <div style={{ transform:`scale(${scale})`, transformOrigin:'0 0',
            width:SVG_W, height:SVG_H, transition:'transform 0.2s' }}>
            <svg width={SVG_W} height={SVG_H}>

              {/* ═══ TRACKS (drawn first, stations on top) ═════════════════ */}

              {/* Purple — vertical */}
              <line
                x1={PX} y1={PY0}
                x2={PX} y2={PY0 + 13 * PSTEP}
                stroke="#800080" strokeWidth={10} strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px #800080)' }}
              />

              {/* Aqua — horizontal */}
              <line
                x1={AQ_X0} y1={CIVIL_Y}
                x2={AQ_XN}  y2={CIVIL_Y}
                stroke="#00A3E0" strokeWidth={10} strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px #00A3E0)' }}
              />

              {/* Red — diagonal polyline */}
              <polyline
                points={redPts.map(p=>`${p.x},${p.y}`).join(' ')}
                fill="none" stroke="#EE2A24" strokeWidth={10}
                strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 6px #EE2A24)' }}
              />

              {/* ═══ PURPLE STATIONS ════════════════════════════════════════ */}
              {PURPLE.map((name, i) => {
                const x = PX, y = PY0 + i * PSTEP;
                if (isXchg(name)) return null;
                return (
                  <g key={`p${i}`} style={{ cursor:'pointer' }}
                    onMouseEnter={() => setTip({ name, line:'Line 1 — Purple  (PCMC ↔ Swargate)' })}
                    onMouseLeave={() => setTip(null)}>
                    {/* dot */}
                    <circle cx={x} cy={y} r={8} fill="var(--bg-secondary)" stroke="#800080" strokeWidth={3}/>
                    <circle cx={x} cy={y} r={3} fill="#800080"/>
                    {/* label right */}
                    <text x={x+18} y={y+5} fill="var(--text-primary)" fontSize={13} fontWeight="500">{name}</text>
                  </g>
                );
              })}

              {/* ═══ AQUA STATIONS ══════════════════════════════════════════ */}
              {AQUA.map((name, i) => {
                const x = AQ_X0 + i * AQUA_STEP, y = CIVIL_Y;
                if (isXchg(name)) return null;
                const above = i % 2 === 0;
                return (
                  <g key={`a${i}`} style={{ cursor:'pointer' }}
                    onMouseEnter={() => setTip({ name, line:'Line 2 — Aqua  (Vanaz ↔ Ramwadi)' })}
                    onMouseLeave={() => setTip(null)}>
                    <circle cx={x} cy={y} r={8} fill="var(--bg-secondary)" stroke="#00A3E0" strokeWidth={3}/>
                    <circle cx={x} cy={y} r={3} fill="#00A3E0"/>
                    {/* tick */}
                    <line x1={x} y1={y} x2={x} y2={above ? y-22 : y+22}
                      stroke="#00A3E0" strokeWidth={1.5} strokeOpacity={0.4}/>
                    <text x={x} y={above ? y-29 : y+36}
                      fill="var(--text-primary)" fontSize={11} fontWeight="500" textAnchor="middle">{name}</text>
                  </g>
                );
              })}

              {/* ═══ RED STATIONS ═══════════════════════════════════════════ */}
              {RED.map((name, i) => {
                const { x, y } = redPts[i];
                if (isXchg(name)) return null;
                // Label to upper-left (no rotation, always readable)
                return (
                  <g key={`r${i}`} style={{ cursor:'pointer' }}
                    onMouseEnter={() => setTip({ name, line:'Line 3 — Red  (Megapolis Circle ↔ Civil Court)' })}
                    onMouseLeave={() => setTip(null)}>
                    <circle cx={x} cy={y} r={8} fill="var(--bg-secondary)" stroke="#EE2A24" strokeWidth={3}/>
                    <circle cx={x} cy={y} r={3} fill="#EE2A24"/>
                    {/* tick upper-left */}
                    <line x1={x} y1={y} x2={x-10} y2={y-14}
                      stroke="#EE2A24" strokeWidth={1.5} strokeOpacity={0.5}/>
                    <text x={x-14} y={y-18}
                      fill="var(--text-primary)" fontSize={12} fontWeight="600" textAnchor="end">{name}</text>
                  </g>
                );
              })}

              {/* ═══ INTERCHANGE NODES (topmost layer) ════════════════════════ */}
              {[
                { name:"Civil Court",   x:PX, y:CIVIL_Y,   sub:"Purple + Aqua + Red" },
                { name:"Shivaji Nagar", x:PX, y:SHIVAJI_Y, sub:"Purple + Red" },
              ].map(({ name, x, y, sub }) => (
                <g key={name} style={{ cursor:'pointer' }}
                  onMouseEnter={() => setTip({ name, line:`Interchange — ${sub}` })}
                  onMouseLeave={() => setTip(null)}>
                  {/* outer pulse ring */}
                  <circle cx={x} cy={y} r={24} fill="none"
                    stroke="#FFD700" strokeWidth={2.5} strokeDasharray="6 3" opacity={0.9}/>
                  {/* inner fill */}
                  <circle cx={x} cy={y} r={14} fill="#FFD700"
                    style={{ filter:'drop-shadow(0 0 8px #FFD700)' }}/>
                  {/* label */}
                  <text x={x+30} y={y-4}  fill="var(--text-primary)" fontSize={14} fontWeight="900">{name}</text>
                  <text x={x+30} y={y+12} fill="var(--text-secondary)" fontSize={10}>{sub}</text>
                </g>
              ))}

            </svg>
          </div>
        </div>

        {/* ═══ LEGEND ═════════════════════════════════════════════════════════ */}
        <div style={{ padding:'18px 28px', background:'var(--bg-secondary)',
          borderTop:'1px solid var(--glass-border)' }}>
          <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
            {[
              { color:'#800080', label:'Line 1 — Purple', sub:'PCMC ↔ Swargate  •  14 Stations' },
              { color:'#00A3E0', label:'Line 2 — Aqua',   sub:'Vanaz ↔ Ramwadi  •  16 Stations' },
              { color:'#EE2A24', label:'Line 3 — Red',    sub:'Megapolis ↔ Civil Court  •  8 Stations' },
              { color:'#FFD700', label:'Interchange',     sub:'Civil Court, Shivaji Nagar' },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, minWidth:220 }}>
                <div style={{ width:14, height:14, borderRadius:'50%', flexShrink:0,
                  background:item.color, boxShadow:`0 0 8px ${item.color}` }}/>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize:11, color:'var(--text-secondary)', marginTop:1 }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
