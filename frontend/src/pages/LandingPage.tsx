import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useEffect, useRef, useState, useCallback } from "react";
import { useIsMobile } from "../hooks/useIsMobile";

export default function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMobile = useIsMobile();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [activeScreen, setActiveScreen] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const handleScroll = useCallback(() => setScrollY(window.scrollY), []);
  const handleMouse = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
  }, []);

  useEffect(() => {
    if (isAuthenticated) { navigate("/dashboard"); return; }

    // Staggered reveal observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger children
            const children = entry.target.querySelectorAll(".stagger-child");
            children.forEach((child, i) => {
              setTimeout(() => child.classList.add("visible"), i * 120);
            });
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(".fade-section").forEach((el) => observerRef.current?.observe(el));

    window.addEventListener("scroll", handleScroll, { passive: true });
    if (!isMobile) window.addEventListener("mousemove", handleMouse, { passive: true });

    // Auto-advance screenshots
    const interval = setInterval(() => setActiveScreen((p) => (p + 1) % 4), 5000);

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouse);
      clearInterval(interval);
    };
  }, [isAuthenticated, navigate, handleScroll, handleMouse, isMobile]);

  // Parallax helpers
  const parallax = (speed: number) => isMobile ? 0 : scrollY * speed;
  const tilt = (intensity: number) => isMobile ? {} : {
    transform: `perspective(1000px) rotateY(${(mousePos.x - 0.5) * intensity}deg) rotateX(${(0.5 - mousePos.y) * intensity}deg)`,
  };

  const screens = [
    { id: "dashboard", label: "Dashboard", src: "/screenshots/dashboard.png", caption: "Portfolio overview with cost trajectory, project health metrics, and recent decision activity." },
    { id: "blockchain", label: "Blockchain Proof", src: "/screenshots/blockchain-proof.png", caption: "Every decision shows its SHA-256 hash, chain position, and Polygon transaction." },
    { id: "verify", label: "Chain Verification", src: "/screenshots/chain-verification.png", caption: "One-click verification of all decisions against the Polygon blockchain." },
    { id: "sensors", label: "Live Sensors", src: "/screenshots/sensors.png", caption: "Real-time commodity prices, weather, and delivery data keeping assumptions honest." },
  ];

  return (
    <div style={{ background: "#08080D", color: "rgba(255,255,255,0.90)", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif", overflowX: "hidden" }}>
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes pulse-glow { 0%,100% { opacity: 0.3; } 50% { opacity: 0.7; } }
        @keyframes hash-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes draw-line { from { height: 0; } to { height: 100%; } }
        @keyframes count-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

        .fade-section { opacity: 0; transform: translateY(50px); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1); }
        .fade-section.visible { opacity: 1; transform: translateY(0); }
        .stagger-child { opacity: 0; transform: translateY(24px); transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1); }
        .stagger-child.visible { opacity: 1; transform: translateY(0); }

        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease, border-color 0.4s ease; }
        .glass:hover { border-color: rgba(255,255,255,0.10); box-shadow: 0 8px 40px rgba(0,0,0,0.3); }
        .glass-lift:hover { transform: translateY(-4px) !important; }

        .btn-primary { padding: 15px 34px; background: linear-gradient(135deg, #0A84FF, #5AC8FA); border: none; border-radius: 14px; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.35s cubic-bezier(0.16,1,0.3,1); box-shadow: 0 4px 24px rgba(10,132,255,0.25); position: relative; overflow: hidden; }
        .btn-primary::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); background-size: 200% 100%; animation: shimmer 3s ease infinite; }
        .btn-primary:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 12px 40px rgba(10,132,255,0.35); }

        .btn-ghost { padding: 15px 34px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.10); border-radius: 14px; color: rgba(255,255,255,0.85); font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.35s cubic-bezier(0.16,1,0.3,1); }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.06); transform: translateY(-2px); }

        .showcase-tab { padding: 10px 22px; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; background: transparent; color: rgba(255,255,255,0.35); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all 0.35s; white-space: nowrap; }
        .showcase-tab:hover { border-color: rgba(255,255,255,0.15); color: rgba(255,255,255,0.7); }
        .showcase-tab.active { background: rgba(10,132,255,0.10); border-color: rgba(10,132,255,0.25); color: #5AC8FA; }

        .step-line { position: absolute; left: 19px; top: 0; width: 2px; background: linear-gradient(180deg, rgba(10,132,255,0.3), rgba(50,215,75,0.3), rgba(130,71,229,0.3), rgba(255,159,10,0.3), rgba(255,69,58,0.3)); }

        .scroll-progress { position: fixed; top: 0; left: 0; height: 2px; background: linear-gradient(90deg, #0A84FF, #5AC8FA, #32D74B); z-index: 200; transition: width 0.1s linear; }

        .label-tag { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; }
      `}</style>

      {/* Scroll progress bar */}
      <div className="scroll-progress" style={{ width: `${Math.min(100, (scrollY / (document.body.scrollHeight - window.innerHeight || 1)) * 100)}%` }} />

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: isMobile ? "12px 16px" : "14px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: scrollY > 50 ? "rgba(8,8,13,0.85)" : "transparent", backdropFilter: scrollY > 50 ? "blur(20px)" : "none", borderBottom: scrollY > 50 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "all 0.4s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo-dark.png" alt="InfraTrace" style={{ height: 30, width: "auto" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" style={{ padding: "9px 20px", fontSize: 13 }} onClick={() => navigate("/login")}>Sign In</button>
          <button className="btn-primary" style={{ padding: "9px 22px", fontSize: 13 }} onClick={() => navigate("/register")}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative" }}>
        {/* Parallax ambient orbs */}
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(10,132,255,0.07) 0%, transparent 70%)", top: "5%", left: "5%", filter: "blur(100px)", pointerEvents: "none", animation: "pulse-glow 7s ease infinite", transform: `translateY(${parallax(-0.08)}px)` }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(50,215,75,0.05) 0%, transparent 70%)", bottom: "15%", right: "10%", filter: "blur(100px)", pointerEvents: "none", animation: "pulse-glow 9s ease infinite 3s", transform: `translateY(${parallax(-0.05)}px)` }} />
        <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(130,71,229,0.04) 0%, transparent 70%)", top: "40%", right: "30%", filter: "blur(80px)", pointerEvents: "none", animation: "pulse-glow 11s ease infinite 1s" }} />

        <div style={{ maxWidth: 820, position: "relative", zIndex: 1, animation: "fade-up 1s cubic-bezier(0.16,1,0.3,1)" }}>
          <div className="label-tag" style={{ background: "rgba(10,132,255,0.08)", color: "#5AC8FA", marginBottom: 28 }}>Infrastructure Decision Accountability</div>
          <h1 style={{ fontSize: "clamp(38px, 6.5vw, 72px)", fontWeight: 800, lineHeight: 1.05, margin: "0 0 28px", letterSpacing: "-2px" }}>
            Every decision.<br />
            <span style={{ background: "linear-gradient(135deg, #0A84FF 0%, #5AC8FA 40%, #32D74B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Tamper-proof.</span>
          </h1>
          <p style={{ fontSize: isMobile ? 16 : 19, lineHeight: 1.75, color: "rgba(255,255,255,0.50)", maxWidth: 580, margin: "0 auto 44px", letterSpacing: "0.01em" }}>
            InfraTrace creates an unalterable record of every infrastructure decision — who made it, when, why, and what happened as a result.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => navigate("/register")}>Start Free</button>
            <button className="btn-ghost" onClick={() => navigate("/login")}>Try Demo</button>
            <button className="btn-ghost" onClick={() => navigate("/public/ed01bdb4-e9b3-4948-9c85-53a48adcac2b")}>Public Audit Trail</button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", opacity: scrollY > 100 ? 0 : 0.3, transition: "opacity 0.5s" }}>
          <div style={{ width: 24, height: 40, borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.2)", display: "flex", justifyContent: "center", paddingTop: 8 }}>
            <div style={{ width: 3, height: 8, borderRadius: 2, background: "rgba(255,255,255,0.4)", animation: "float 2s ease infinite" }} />
          </div>
        </div>
      </section>

      {/* Hash chain ticker */}
      <div style={{ overflow: "hidden", padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.03)", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ display: "flex", gap: 40, animation: "hash-scroll 40s linear infinite", width: "200%", fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 11, color: "rgba(255,255,255,0.08)", letterSpacing: "0.05em" }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} style={{ whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "rgba(10,132,255,0.2)" }}>BLOCK</span>
              {`${35300000 + i * 47}`}
              <span style={{ color: "rgba(50,215,75,0.15)" }}>SHA-256</span>
              {Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")}
            </span>
          ))}
        </div>
      </div>

      {/* Video Explainer */}
      <section className="fade-section" style={{ padding: "100px 24px 60px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="label-tag" style={{ background: "rgba(50,215,75,0.08)", color: "#32D74B", marginBottom: 16 }}>2 Minutes. Full Picture.</div>
          <h2 style={{ fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 800, margin: "0 0 14px", letterSpacing: "-1px" }}>What is InfraTrace?</h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.40)", maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
            How blockchain, AI, and real-time data come together to make every infrastructure decision transparent and verifiable.
          </p>
        </div>
        <div style={{ ...tilt(3), transition: "transform 0.3s ease" }}>
          <div className="glass" style={{ padding: isMobile ? 6 : 12, boxShadow: "0 20px 80px rgba(0,0,0,0.4), 0 0 100px rgba(50,215,75,0.06)" }}>
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: isMobile ? 8 : 14, overflow: "hidden" }}>
              <iframe
                src="https://www.youtube.com/embed/XJwX2TxVhls?rel=0&modestbranding=1&color=white"
                title="What is InfraTrace"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem — Big statement */}
      <section className="fade-section" style={{ padding: "80px 24px 100px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <div className="label-tag" style={{ background: "rgba(255,69,58,0.08)", color: "#FF453A", marginBottom: 20 }}>The Problem</div>
        <h2 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 24px", letterSpacing: "-1.5px" }}>
          $2.5 trillion spent.<br />
          <span style={{ color: "rgba(255,69,58,0.9)" }}>30% lost.</span>
        </h2>
        <p style={{ fontSize: 17, lineHeight: 1.8, color: "rgba(255,255,255,0.45)", maxWidth: 620, margin: "0 auto" }}>
          Infrastructure projects worldwide lose roughly 30% of their budgets to corruption, mismanagement, and poor decision-making. The records live in spreadsheets and emails — editable, deletable, and gone by the time anyone asks questions.
        </p>
      </section>

      {/* Three Technologies — with tilt cards */}
      <section className="fade-section" style={{ padding: "40px 24px 100px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div className="label-tag" style={{ background: "rgba(10,132,255,0.08)", color: "#5AC8FA", marginBottom: 16 }}>Three Technologies, One Platform</div>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, margin: 0, letterSpacing: "-1px" }}>Blockchain + AI + IoT</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "260px" : "300px"}, 1fr))`, gap: isMobile ? 14 : 20 }}>
          {[
            { icon: "\u26D3", title: "Blockchain Verification", desc: "Every decision is SHA-256 hashed and anchored on Polygon. A public notary that timestamps every record — except the notary is a global network that can't be bribed.", detail: "Contract: 0x393a2A33...aFad1355", color: "#0A84FF", glow: "rgba(10,132,255,0.12)" },
            { icon: "\u2B50", title: "AI Risk Analysis", desc: "Large language models watch the full stream of decisions and flag patterns humans miss — costs doubling overnight, single-person approval chains, contradicted assumptions.", detail: "Scope creep \u00B7 Cost anomaly \u00B7 Approval risk", color: "#32D74B", glow: "rgba(50,215,75,0.12)" },
            { icon: "\u2B24", title: "Real-Time Sensors", desc: "Live data feeds from commodity markets, weather stations, and supply chains. When reality contradicts the plan, the system alerts before costs escalate.", detail: "Steel \u00B7 Copper \u00B7 Weather \u00B7 Labour", color: "#FF453A", glow: "rgba(255,69,58,0.10)" },
          ].map((card, i) => (
            <div key={i} className="glass glass-lift stagger-child" style={{ padding: isMobile ? 24 : 32, animation: `float 7s ease infinite ${i * 1.2}s`, boxShadow: `0 0 60px ${card.glow}`, cursor: "default" }}>
              <div style={{ fontSize: 28, marginBottom: 16, filter: "saturate(0.8)" }}>{card.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.3px" }}>{card.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(255,255,255,0.45)", margin: 0 }}>{card.desc}</p>
              <div style={{ marginTop: 16, fontFamily: "monospace", fontSize: 10, color: `${card.color}80`, letterSpacing: "0.02em" }}>{card.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — with connecting timeline */}
      <section className="fade-section" style={{ padding: "80px 24px", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div className="label-tag" style={{ background: "rgba(255,159,10,0.08)", color: "#FF9F0A", marginBottom: 16 }}>How It Works</div>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, margin: 0, letterSpacing: "-1px" }}>From Decision to Proof</h2>
        </div>

        <div style={{ position: "relative" }}>
          {/* Connecting line */}
          <div className="step-line" style={{ height: "calc(100% - 40px)", top: 20 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { step: "01", title: "Log the Decision", desc: "Who decided, what, when, why, and what alternatives existed.", color: "#0A84FF" },
              { step: "02", title: "Hash Chain Sealed", desc: "SHA-256 hash computed and cryptographically linked to every previous decision.", color: "#32D74B" },
              { step: "03", title: "Anchored on Polygon", desc: "Hash published to blockchain. Anyone can independently verify the record.", color: "#8247E5" },
              { step: "04", title: "AI Analyzes Patterns", desc: "LLMs detect scope creep, cost anomalies, and governance risks across the chain.", color: "#FF9F0A" },
              { step: "05", title: "Sensors Keep It Honest", desc: "Real-time data compares market conditions against assumptions. Anomalies trigger alerts.", color: "#FF453A" },
            ].map((s) => (
              <div key={s.step} className="stagger-child" style={{ display: "flex", gap: isMobile ? 16 : 24, alignItems: "flex-start", paddingLeft: 4 }}>
                {/* Step dot */}
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${s.color}18`, border: `2px solid ${s.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, color: s.color, fontFamily: "monospace", position: "relative", zIndex: 1 }}>{s.step}</div>
                <div className="glass glass-lift" style={{ flex: 1, padding: isMobile ? "14px 16px" : "18px 24px" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.2px" }}>{s.title}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.45)", margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase — with auto-advance + perspective */}
      <section className="fade-section" style={{ padding: "80px 24px 100px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div className="label-tag" style={{ background: "rgba(100,210,255,0.08)", color: "#64D2FF", marginBottom: 16 }}>The Platform</div>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, margin: "0 0 10px", letterSpacing: "-1px" }}>See What You're Getting</h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", margin: 0 }}>Real screenshots. Real data. Nothing mocked up.</p>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
          {screens.map((s, i) => (
            <button key={s.id} className={`showcase-tab ${activeScreen === i ? "active" : ""}`} onClick={() => setActiveScreen(i)}>{s.label}</button>
          ))}
        </div>

        {/* Browser frame with perspective tilt */}
        <div style={{ ...tilt(2.5), transition: "transform 0.4s ease" }}>
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 30px 100px rgba(0,0,0,0.5), 0 0 80px rgba(10,132,255,0.04)" }}>
            {/* Browser chrome */}
            <div style={{ padding: "10px 16px", background: "rgba(255,255,255,0.025)", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "5px 14px", fontSize: 11, color: "rgba(255,255,255,0.20)", fontFamily: "monospace", letterSpacing: "0.03em" }}>
                infratrace.xyz/{screens[activeScreen].id === "dashboard" ? "dashboard" : `project/.../\u200B${screens[activeScreen].id}`}
              </div>
            </div>
            {/* Screenshot */}
            <div style={{ position: "relative", background: "#0b0b12", overflow: "hidden" }}>
              {screens.map((s, i) => (
                <img key={s.id} src={s.src} alt={s.label} loading={i === 0 ? "eager" : "lazy"}
                  style={{
                    width: "100%", display: "block",
                    opacity: activeScreen === i ? 1 : 0,
                    position: activeScreen === i ? "relative" : "absolute",
                    top: 0, left: 0,
                    transition: "opacity 0.5s ease",
                    transform: activeScreen === i ? "scale(1)" : "scale(1.02)",
                  }} />
              ))}
            </div>
          </div>
        </div>

        {/* Caption */}
        <div style={{ textAlign: "center", marginTop: 22, minHeight: 36, position: "relative" }}>
          {screens.map((s, i) => (
            <p key={s.id} style={{
              fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.35)", margin: 0,
              transition: "opacity 0.4s, transform 0.4s",
              opacity: activeScreen === i ? 1 : 0,
              transform: activeScreen === i ? "translateY(0)" : "translateY(8px)",
              position: activeScreen === i ? "relative" : "absolute",
              left: 0, right: 0,
            }}>{s.caption}</p>
          ))}
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16 }}>
          {screens.map((_, i) => (
            <div key={i} onClick={() => setActiveScreen(i)} style={{
              width: activeScreen === i ? 24 : 6, height: 6, borderRadius: 3,
              background: activeScreen === i ? "#5AC8FA" : "rgba(255,255,255,0.12)",
              transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)", cursor: "pointer",
            }} />
          ))}
        </div>
      </section>

      {/* Stakeholders */}
      <section className="fade-section" style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, margin: 0, letterSpacing: "-1px" }}>Built for Every Stakeholder</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "240px" : "200px"}, 1fr))`, gap: 14 }}>
          {[
            { role: "Government", desc: "Defensible audit trails for procurement and budget decisions.", icon: "\uD83C\uDFDB" },
            { role: "Project Managers", desc: "Tamper-evident logs that hold up in arbitration.", icon: "\uD83D\uDEE0" },
            { role: "Investors", desc: "Decision health scores and anomaly alerts across portfolios.", icon: "\uD83D\uDCC8" },
            { role: "Auditors", desc: "Independent cryptographic verification of all records.", icon: "\uD83D\uDD0D" },
            { role: "Citizens", desc: "Public transparency portals with AI-generated summaries.", icon: "\uD83C\uDF0D" },
            { role: "Contractors", desc: "Fair procurement with verified submission timestamps.", icon: "\uD83D\uDCC4" },
          ].map((s) => (
            <div key={s.role} className="glass glass-lift stagger-child" style={{ padding: "22px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{s.icon}</div>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 6px", letterSpacing: "0.02em" }}>{s.role}</h4>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.40)", margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities strip */}
      <section className="fade-section" style={{ padding: "60px 24px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${isMobile ? 2 : 3}, 1fr)`, gap: 12, textAlign: "center" }}>
          {[
            { value: "SHA-256", label: "Tamper-Evident Hashing", color: "#0A84FF" },
            { value: "Polygon", label: "On-Chain Verification", color: "#8247E5" },
            { value: "4 LLMs", label: "AI Risk Analysis", color: "#32D74B" },
            { value: "Live", label: "Real-Time Sensors", color: "#FF9F0A" },
            { value: "RBAC", label: "Multi-Stakeholder Access", color: "#5AC8FA" },
            { value: "CSV/PDF", label: "Audit Export", color: "#FF453A" },
          ].map((s) => (
            <div key={s.label} className="glass stagger-child" style={{ padding: "20px 12px" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginBottom: 4, letterSpacing: "-0.5px" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="fade-section" style={{ padding: "60px 24px 100px", textAlign: "center" }}>
        <div className="glass" style={{ maxWidth: 620, margin: "0 auto", padding: isMobile ? "40px 24px" : "56px 40px", boxShadow: "0 0 120px rgba(10,132,255,0.06)" }}>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 800, margin: "0 0 14px", letterSpacing: "-0.8px" }}>See It Working</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginBottom: 36, lineHeight: 1.7, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
            Real SHA-256 hashes. Real Polygon transactions. Real AI analysis. The platform is live — try it yourself.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => navigate("/login")}>Try Demo</button>
            <button className="btn-ghost" onClick={() => navigate("/public/ed01bdb4-e9b3-4948-9c85-53a48adcac2b")}>Public Audit Trail</button>
            <button className="btn-ghost" onClick={() => window.open("https://amoy.polygonscan.com/address/0x393a2A33aA934CB18d20Fa3C0624399AaFad1355", "_blank")}>PolygonScan</button>
          </div>
        </div>
      </section>

      {/* Footer — structured */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: isMobile ? "40px 24px" : "56px 40px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr 1fr", gap: isMobile ? 32 : 24 }}>
          <div>
            <img src="/logo-dark.png" alt="InfraTrace" style={{ height: 24, marginBottom: 12 }} />
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.30)", margin: 0, maxWidth: 280 }}>
              Infrastructure Decision Accountability Platform. Tamper-evident logging with blockchain verification, AI analysis, and real-time sensors.
            </p>
          </div>
          <div>
            <h5 style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.50)", margin: "0 0 12px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Platform</h5>
            {["Dashboard", "Public Portal", "API Docs"].map((l) => (
              <a key={l} href={l === "Dashboard" ? "/login" : l === "Public Portal" ? "/public/ed01bdb4-e9b3-4948-9c85-53a48adcac2b" : "/login"} style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.25)", textDecoration: "none", marginBottom: 8, transition: "color 0.2s" }} onMouseEnter={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.6)"} onMouseLeave={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.25)"}>{l}</a>
            ))}
          </div>
          <div>
            <h5 style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.50)", margin: "0 0 12px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Verify</h5>
            {[
              { label: "Smart Contract", url: "https://amoy.polygonscan.com/address/0x393a2A33aA934CB18d20Fa3C0624399AaFad1355" },
              { label: "GitHub", url: "https://github.com/infratracer/infratrace" },
            ].map((l) => (
              <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.25)", textDecoration: "none", marginBottom: 8, transition: "color 0.2s" }} onMouseEnter={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.6)"} onMouseLeave={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.25)"}>{l.label}</a>
            ))}
          </div>
          <div>
            <h5 style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.50)", margin: "0 0 12px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Project</h5>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", margin: "0 0 8px" }}>Harvard Extension School</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", margin: "0 0 8px" }}>Blockchain + AI + IoT</p>
          </div>
        </div>
        <div style={{ maxWidth: 1000, margin: "32px auto 0", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", margin: 0 }}>&copy; 2026 InfraTrace. All rights reserved.</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", margin: 0 }}>Built with FastAPI + React + Polygon + OpenRouter</p>
        </div>
      </footer>
    </div>
  );
}
