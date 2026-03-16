import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicTimeline, verifyPublicChain, verifyPublicHash } from "../api/public";
import { formatDate, formatCurrency, truncateHash } from "../utils/format";
import { env } from "../config/env";

interface PublicDecision {
  id: string;
  sequence_number: number;
  decision_type: string;
  title: string;
  description: string;
  justification: string;
  cost_impact: number | null;
  risk_level: string | null;
  record_hash: string;
  previous_hash: string;
  tx_hash: string | null;
  block_number: number | null;
  chain_verified: boolean;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  scope_change: "Scope Change", cost_revision: "Cost Revision", assumption_change: "Assumption Change",
  contractor_change: "Contractor Change", schedule_change: "Schedule Change",
  risk_acceptance: "Risk Acceptance", approval: "Approval",
};

export default function PublicTimelinePage() {
  const { id } = useParams<{ id: string }>();
  const [decisions, setDecisions] = useState<PublicDecision[]>([]);
  const [costTrajectory, setCostTrajectory] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chainResult, setChainResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [verifyingHash, setVerifyingHash] = useState<string | null>(null);
  const [hashResult, setHashResult] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPublicTimeline(id)
      .then((data) => {
        setDecisions(data.decisions || []);
        setCostTrajectory(data.cost_trajectory || []);
      })
      .catch(() => setError("Project not found or not publicly accessible."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleVerifyChain = async () => {
    if (!id) return;
    setVerifyingChain(true);
    try {
      const result = await verifyPublicChain(id);
      setChainResult(result);
    } catch {
      setChainResult({ valid: false, message: "Verification failed." });
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleVerifyHash = async (hash: string) => {
    setVerifyingHash(hash);
    try {
      const result = await verifyPublicHash(hash);
      setHashResult(result);
    } catch {
      setHashResult({ error: "Hash not found or verification failed." });
    } finally {
      setVerifyingHash(null);
    }
  };

  // Standalone page — no auth, no sidebar, own styling
  const bg = "#1C1C1E";
  const card = "rgba(58, 58, 60, 0.28)";
  const border = "rgba(255, 255, 255, 0.08)";
  const text = "rgba(255, 255, 255, 0.88)";
  const textSec = "rgba(255, 255, 255, 0.50)";
  const textMuted = "rgba(255, 255, 255, 0.24)";
  const accent = "#0A84FF";
  const green = "#32D74B";
  const red = "#FF453A";
  const amber = "#FF9F0A";

  const glass: React.CSSProperties = {
    background: card, backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
    border: `1px solid ${border}`, borderRadius: 16, padding: "20px",
  };

  if (loading) {
    return (
      <div style={{ background: bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${border}`, borderTopColor: accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ ...glass, maxWidth: 420, textAlign: "center", padding: "48px 32px" }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>🔒</div>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: text, marginBottom: 8 }}>Not Available</h2>
          <p style={{ fontSize: 13, color: textSec }}>{error}</p>
        </div>
      </div>
    );
  }

  const totalCost = costTrajectory.length > 0 ? costTrajectory[costTrajectory.length - 1] : 0;
  const baseBudget = costTrajectory.length > 0 ? costTrajectory[0] : 0;
  const drift = baseBudget > 0 ? ((totalCost - baseBudget) / baseBudget * 100) : 0;

  return (
    <div style={{ background: bg, minHeight: "100vh", color: text, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Header */}
      <div style={{ padding: "24px 32px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: accent, marginBottom: 4 }}>Public Transparency Portal</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: text }}>InfraTrace — Decision Audit Trail</h1>
        </div>
        <div style={{ fontSize: 11, color: textMuted }}>Powered by InfraTrace</div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div style={glass}>
            <div style={{ fontSize: 11, color: textSec, marginBottom: 6 }}>Decisions</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{decisions.length}</div>
          </div>
          <div style={glass}>
            <div style={{ fontSize: 11, color: textSec, marginBottom: 6 }}>Current Budget</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(totalCost)}</div>
          </div>
          <div style={glass}>
            <div style={{ fontSize: 11, color: textSec, marginBottom: 6 }}>Budget Drift</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: drift > 15 ? red : drift > 5 ? amber : green }}>
              {drift >= 0 ? "+" : ""}{drift.toFixed(1)}%
            </div>
          </div>
          <div style={glass}>
            <div style={{ fontSize: 11, color: textSec, marginBottom: 6 }}>On-Chain Anchored</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: green }}>
              {decisions.filter(d => d.tx_hash).length}/{decisions.length}
            </div>
          </div>
        </div>

        {/* Chain Verification */}
        <div style={glass}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Chain Integrity Verification</h2>
            <button onClick={handleVerifyChain} disabled={verifyingChain}
              style={{ padding: "8px 16px", background: accent, border: "none", borderRadius: 8, color: "#FFF", fontSize: 12, fontWeight: 600, cursor: verifyingChain ? "not-allowed" : "pointer", opacity: verifyingChain ? 0.6 : 1, fontFamily: "inherit" }}>
              {verifyingChain ? "Verifying..." : "Verify Hash Chain"}
            </button>
          </div>
          <p style={{ fontSize: 12, color: textSec, margin: 0 }}>
            Independently verify that no decision records have been altered by recomputing the SHA-256 hash chain.
          </p>
          {chainResult && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: chainResult.valid ? "rgba(50,215,75,0.12)" : "rgba(255,69,58,0.12)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, color: chainResult.valid ? green : red }}>{chainResult.valid ? "✓" : "✗"}</span>
              <span style={{ fontSize: 13, color: text }}>{chainResult.message}</span>
            </div>
          )}
        </div>

        {/* Hash verification result */}
        {hashResult && (
          <div style={glass}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Hash Verification Result</h3>
              <button onClick={() => setHashResult(null)} style={{ background: "none", border: "none", color: textMuted, cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
            {"error" in hashResult ? (
              <p style={{ fontSize: 12, color: red }}>{hashResult.error}</p>
            ) : (
              <div style={{ fontSize: 12, color: textSec, display: "flex", flexDirection: "column", gap: 6 }}>
                <div><strong style={{ color: text }}>Title:</strong> {hashResult.title}</div>
                <div><strong style={{ color: text }}>Type:</strong> {hashResult.decision_type}</div>
                <div><strong style={{ color: text }}>Created:</strong> {formatDate(hashResult.created_at)}</div>
                <div><strong style={{ color: text }}>Chain Verified:</strong> <span style={{ color: hashResult.chain_verified ? green : amber }}>{hashResult.chain_verified ? "Yes" : "Pending"}</span></div>
                {hashResult.tx_hash && (
                  <div><strong style={{ color: text }}>TX:</strong> <a href={`${env.POLYGONSCAN_URL}/tx/${hashResult.tx_hash}`} target="_blank" rel="noopener noreferrer" style={{ color: accent, fontFamily: "monospace", fontSize: 11 }}>{truncateHash(hashResult.tx_hash, 10)} ↗</a></div>
                )}
                {hashResult.blockchain_verification && (
                  <div><strong style={{ color: text }}>Blockchain Match:</strong> <span style={{ color: hashResult.blockchain_verification.verified ? green : red }}>{hashResult.blockchain_verification.verified ? "Confirmed ✓" : "Not verified"}</span></div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Decision Timeline */}
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: textSec, marginBottom: 12, letterSpacing: "0.05em", textTransform: "uppercase" }}>Decision Timeline</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {decisions.map((d, i) => (
              <div key={d.id} style={{ ...glass, animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontFamily: "monospace", fontWeight: 700,
                    background: "rgba(10,132,255,0.12)", color: accent, border: `1px solid ${border}`,
                  }}>{d.sequence_number}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: "rgba(10,132,255,0.12)", color: accent }}>{TYPE_LABELS[d.decision_type] || d.decision_type}</span>
                      {d.risk_level && <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: d.risk_level === "critical" || d.risk_level === "high" ? "rgba(255,69,58,0.12)" : "rgba(255,159,10,0.10)", color: d.risk_level === "critical" || d.risk_level === "high" ? red : amber }}>{d.risk_level}</span>}
                      {d.tx_hash && <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: "rgba(50,215,75,0.12)", color: green }}>On-chain ✓</span>}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, margin: "4px 0", color: text }}>{d.title}</h3>
                    <p style={{ fontSize: 12, color: textSec, margin: "4px 0 8px", lineHeight: 1.5 }}>{d.description}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", fontSize: 11, color: textMuted }}>
                      <span>{formatDate(d.created_at)}</span>
                      {d.cost_impact !== null && d.cost_impact !== 0 && (
                        <span style={{ color: (d.cost_impact ?? 0) > 0 ? red : green }}>{(d.cost_impact ?? 0) > 0 ? "+" : ""}{formatCurrency(d.cost_impact ?? 0)}</span>
                      )}
                      <span style={{ fontFamily: "monospace" }}>{truncateHash(d.record_hash, 8)}</span>
                      <button onClick={() => handleVerifyHash(d.record_hash)} disabled={verifyingHash === d.record_hash}
                        style={{ background: "none", border: `1px solid ${border}`, borderRadius: 6, padding: "2px 8px", fontSize: 10, color: accent, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
                        {verifyingHash === d.record_hash ? "..." : "Verify"}
                      </button>
                      {d.tx_hash && (
                        <a href={`${env.POLYGONSCAN_URL}/tx/${d.tx_hash}`} target="_blank" rel="noopener noreferrer"
                          style={{ color: accent, textDecoration: "none", fontSize: 10, fontFamily: "monospace" }}>
                          {truncateHash(d.tx_hash, 6)} ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "32px 0 16px", borderTop: `1px solid ${border}` }}>
          <p style={{ fontSize: 11, color: textMuted }}>
            This data is cryptographically verified. Each decision record is SHA-256 hashed, chained to its predecessor, and anchored to the Polygon blockchain.
          </p>
          <p style={{ fontSize: 10, color: textMuted, marginTop: 8 }}>InfraTrace — Infrastructure Decision Accountability Platform</p>
        </div>
      </div>
    </div>
  );
}
