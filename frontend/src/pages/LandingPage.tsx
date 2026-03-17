import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useEffect, useRef } from "react";

export default function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }
    // Animate sections on scroll
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-section").forEach((el) => {
      observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, [isAuthenticated, navigate]);

  return (
    <div style={{ background: "#0A0A0F", color: "rgba(255,255,255,0.88)", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif", overflowX: "hidden" }}>
      <style>{`
        .fade-section { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .fade-section.visible { opacity: 1; transform: translateY(0); }
        .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; }
        .glow-green { box-shadow: 0 0 60px rgba(50,215,75,0.15); }
        .glow-blue { box-shadow: 0 0 60px rgba(10,132,255,0.15); }
        .glow-red { box-shadow: 0 0 60px rgba(255,69,58,0.12); }
        .btn-primary { padding: 14px 32px; background: linear-gradient(135deg, #0A84FF, #64D2FF); border: none; border-radius: 14px; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.3s; box-shadow: 0 4px 20px rgba(10,132,255,0.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(10,132,255,0.4); }
        .btn-ghost { padding: 14px 32px; background: transparent; border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; color: rgba(255,255,255,0.88); font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.3s; }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.04); }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulse-glow { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        @keyframes hash-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(10,10,15,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo-dark.png" alt="InfraTrace" style={{ height: 32, width: "auto" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" style={{ padding: "10px 20px", fontSize: 13 }} onClick={() => navigate("/login")}>Sign In</button>
          <button className="btn-primary" style={{ padding: "10px 20px", fontSize: 13 }} onClick={() => navigate("/register")}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative" }}>
        {/* Ambient orbs */}
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(10,132,255,0.08) 0%, transparent 70%)", top: "10%", left: "10%", filter: "blur(80px)", pointerEvents: "none", animation: "pulse-glow 6s ease infinite" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(50,215,75,0.06) 0%, transparent 70%)", bottom: "20%", right: "15%", filter: "blur(80px)", pointerEvents: "none", animation: "pulse-glow 8s ease infinite 2s" }} />

        <div style={{ maxWidth: 800, position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#0A84FF", marginBottom: 24 }}>Infrastructure Decision Accountability</div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 700, lineHeight: 1.1, margin: "0 0 24px", letterSpacing: "-1px" }}>
            Every decision.<br />
            <span style={{ background: "linear-gradient(135deg, #0A84FF, #64D2FF, #32D74B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Tamper-proof.</span>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(255,255,255,0.55)", maxWidth: 600, margin: "0 auto 40px" }}>
            InfraTrace creates an unalterable record of every infrastructure decision — who made it, when, why, and what happened as a result. Cryptographically sealed. Blockchain verified. AI analyzed.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => navigate("/register")}>Start Free</button>
            <button className="btn-ghost" onClick={() => navigate("/login")}>Try Demo</button>
            <button className="btn-ghost" onClick={() => navigate("/public/ed01bdb4-e9b3-4948-9c85-53a48adcac2b")}>View Public Audit Trail</button>
          </div>
        </div>
      </section>

      {/* Hash chain animation */}
      <div style={{ overflow: "hidden", padding: "20px 0", borderTop: "1px solid rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
        <div style={{ display: "flex", gap: 24, animation: "hash-scroll 30s linear infinite", width: "200%", fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.12)" }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} style={{ whiteSpace: "nowrap" }}>
              {`SHA-256: ${Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")}`}
            </span>
          ))}
        </div>
      </div>

      {/* Problem */}
      <section className="fade-section" style={{ padding: "100px 24px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#FF453A", marginBottom: 12 }}>The Problem</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, lineHeight: 1.2, margin: 0 }}>$2.5 trillion spent annually.<br />30% lost.</h2>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(255,255,255,0.50)", marginTop: 20, maxWidth: 650, marginLeft: "auto", marginRight: "auto" }}>
            Infrastructure projects worldwide lose roughly 30% of their budgets to corruption, mismanagement, and poor decision-making. The records live in spreadsheets and emails — editable, deletable, and lost by the time anyone asks questions.
          </p>
        </div>
      </section>

      {/* Three Technologies */}
      <section className="fade-section" style={{ padding: "60px 24px 100px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#0A84FF", marginBottom: 12 }}>Three Technologies, One Platform</div>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 700, margin: 0 }}>Blockchain + AI + IoT</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {/* Blockchain */}
          <div className="glass glow-blue" style={{ padding: 32, animation: "float 6s ease infinite" }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>&#9939;</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Blockchain Verification</h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.50)", margin: 0 }}>
              Every decision is SHA-256 hashed and anchored on Polygon. Think of it as a public notary that timestamps every record — except the notary is a global network that can't be bribed.
            </p>
            <div style={{ marginTop: 16, fontFamily: "monospace", fontSize: 10, color: "rgba(10,132,255,0.6)", wordBreak: "break-all" }}>
              Contract: 0x393a2A33...aFad1355
            </div>
          </div>

          {/* AI */}
          <div className="glass glow-green" style={{ padding: 32, animation: "float 6s ease infinite 1s" }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>&#9672;</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>AI Risk Analysis</h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.50)", margin: 0 }}>
              Large language models watch the full stream of decisions and flag patterns humans miss — costs doubling overnight, single-person approval chains, assumptions contradicted by sensor data.
            </p>
            <div style={{ marginTop: 16, fontSize: 11, color: "rgba(50,215,75,0.6)" }}>
              Scope creep &middot; Cost anomaly &middot; Assumption drift &middot; Approval risk
            </div>
          </div>

          {/* IoT */}
          <div className="glass glow-red" style={{ padding: 32, animation: "float 6s ease infinite 2s" }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>&#9673;</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Real-Time Sensor Monitoring</h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.50)", margin: 0 }}>
              Live data feeds from commodity markets, weather stations, and supply chains keep project assumptions honest. When reality contradicts the plan, the system alerts before costs escalate.
            </p>
            <div style={{ marginTop: 16, fontSize: 11, color: "rgba(255,69,58,0.6)" }}>
              Steel &middot; Copper &middot; Weather &middot; Labour &middot; Delivery
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="fade-section" style={{ padding: "80px 24px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#FF9F0A", marginBottom: 12 }}>How It Works</div>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 700, margin: 0 }}>From Decision to Proof in Seconds</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[
            { step: "01", title: "Log the Decision", desc: "Project manager records who decided what, when, why, and what alternatives existed.", color: "#0A84FF" },
            { step: "02", title: "Hash Chain Sealed", desc: "SHA-256 hash computed and linked to every previous decision. The chain is tamper-evident.", color: "#32D74B" },
            { step: "03", title: "Anchored on Polygon", desc: "Hash published to Polygon blockchain. Anyone can independently verify the record hasn't been altered.", color: "#8247E5" },
            { step: "04", title: "AI Analyzes Patterns", desc: "Large language models detect scope creep, cost anomalies, and governance risks across the decision chain.", color: "#FF9F0A" },
            { step: "05", title: "Sensors Keep It Honest", desc: "Real-time data feeds compare market conditions against project assumptions. Anomalies trigger alerts.", color: "#FF453A" },
          ].map((s) => (
            <div key={s.step} className="glass" style={{ padding: "24px 28px", display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "monospace", flexShrink: 0, lineHeight: 1 }}>{s.step}</div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>{s.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.50)", margin: 0 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="fade-section" style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 700, margin: 0 }}>Built for Every Stakeholder</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {[
            { role: "Government Agencies", desc: "Defensible audit trails for procurement, change orders, budget revisions.", icon: "&#127963;" },
            { role: "Project Managers", desc: "Track every decision with tamper-evident logs that hold up in arbitration.", icon: "&#128736;" },
            { role: "Investors & Lenders", desc: "Real-time decision health scores and anomaly alerts across portfolios.", icon: "&#128200;" },
            { role: "Auditors", desc: "Independent verification without relying on the project owner for data.", icon: "&#128269;" },
            { role: "Citizens & Media", desc: "Public transparency portals with plain-language AI summaries.", icon: "&#127758;" },
            { role: "Contractors", desc: "Fair procurement, verified submissions, transparent evaluation scoring.", icon: "&#128196;" },
          ].map((s) => (
            <div key={s.role} className="glass" style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: s.icon }} />
              <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>{s.role}</h4>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.45)", margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="fade-section" style={{ padding: "80px 24px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, textAlign: "center" }}>
          {[
            { value: "55+", label: "API Endpoints" },
            { value: "19", label: "Frontend Pages" },
            { value: "21+", label: "Decisions Logged" },
            { value: "SHA-256", label: "Hash Chain" },
            { value: "Polygon", label: "Blockchain Anchoring" },
            { value: "4 LLMs", label: "AI Models" },
          ].map((s) => (
            <div key={s.label} className="glass" style={{ padding: "24px 16px" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#0A84FF", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="fade-section" style={{ padding: "80px 24px 120px", textAlign: "center" }}>
        <div className="glass" style={{ maxWidth: 600, margin: "0 auto", padding: "48px 32px" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 12px" }}>See It Working</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.50)", marginBottom: 32, lineHeight: 1.6 }}>
            InfraTrace is live. Real SHA-256 hashes. Real Polygon transactions. Real AI analysis. Try the demo or view the public audit trail.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => navigate("/login")}>Try Demo</button>
            <button className="btn-ghost" onClick={() => navigate("/public/ed01bdb4-e9b3-4948-9c85-53a48adcac2b")}>Public Audit Trail</button>
            <button className="btn-ghost" onClick={() => window.open("https://amoy.polygonscan.com/address/0x393a2A33aA934CB18d20Fa3C0624399AaFad1355", "_blank")}>View on PolygonScan</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 24px", borderTop: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>
          InfraTrace &mdash; Infrastructure Decision Accountability Platform &middot; Harvard Extension School &middot; Blockchain + AI + IoT
        </p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: 8 }}>
          <a href="https://github.com/infratracer/infratrace" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>GitHub</a>
          {" "}&middot;{" "}
          <a href="https://amoy.polygonscan.com/address/0x393a2A33aA934CB18d20Fa3C0624399AaFad1355" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>Smart Contract</a>
        </p>
      </footer>
    </div>
  );
}
