/* Shared page shell for About / Practices / Info / Consultation */
import { useNavigate } from "react-router-dom";

const A = "#3b82f6";
const BG1 = "#0d1117";
const TXT = "#f1f5f9";
const GRID = `linear-gradient(rgba(59,130,246,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.05) 1px,transparent 1px)`;

export default function GamePageShell({ eyebrow, title, tabs, activeId, children }) {
  const navigate = useNavigate();
  return (
    <div style={{ paddingTop:64, background:BG1, minHeight:"100vh", backgroundImage:GRID, backgroundSize:"60px 60px" }}>
      <div style={{ background:"rgba(10,15,28,0.85)", backdropFilter:"blur(10px)", borderBottom:"1px solid rgba(59,130,246,0.1)", padding:"48px clamp(20px,6vw,100px) 0" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <p style={{ fontSize:10, letterSpacing:"0.22em", color:A, textTransform:"uppercase", fontWeight:700, marginBottom:12 }}>{eyebrow}</p>
          <h1 style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:700, color:TXT, marginBottom:40 }}>{title}</h1>
          {tabs && (
            <div style={{ display:"flex", gap:0, borderBottom:"1px solid rgba(59,130,246,0.12)", overflowX:"auto" }}>
              {tabs.map(t=>(
                <button key={t.id} onClick={()=>navigate(t.path)}
                  style={{ padding:"12px 24px", fontSize:13, fontWeight:activeId===t.id?700:400, color:activeId===t.id?"#fff":"rgba(241,245,249,0.35)", background:"none", border:"none", cursor:"pointer", whiteSpace:"nowrap", borderBottom:activeId===t.id?`2px solid ${A}`:"2px solid transparent", marginBottom:-1, transition:"color .15s" }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding:"60px clamp(20px,6vw,100px)", maxWidth:1100, margin:"0 auto" }}>
        {children}
      </div>
    </div>
  );
}
