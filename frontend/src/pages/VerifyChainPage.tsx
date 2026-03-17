import { useState } from "react";
import { useParams } from "react-router-dom";
import { verifyChain } from "../api/verification";
import { getDecisions } from "../api/decisions";
import { useTheme } from "../hooks/useTheme";
import { useToastStore } from "../store/toastStore";
import { truncateHash } from "../utils/format";
import { env } from "../config/env";
import type { ChainVerification, BlockchainVerification } from "../types";

export default function VerifyChainPage() {
  const { id } = useParams<{ id: string }>();
  const [chainResult, setChainResult] = useState<ChainVerification | null>(null);
  const [blockchainResults, setBlockchainResults] = useState<BlockchainVerification[]>([]);
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [verifyingBlockchain, setVerifyingBlockchain] = useState(false);
  const [progress, setProgress] = useState(0);
  const t = useTheme();
  const addToast = useToastStore((s) => s.addToast);

  const handleVerifyChain = async () => {
    if (!id) return;
    setVerifyingChain(true);
    setChainResult(null);
    setProgress(0);

    try {
      const result = await verifyChain(id);
      setProgress(100);
      setChainResult(result);
      addToast(result.valid ? "Chain verification passed!" : "Chain integrity issue detected.", result.valid ? "success" : "error");
    } catch (err) {
      console.error("Chain verification failed:", err);
      setChainResult({ valid: false, total_records: 0, message: "Verification request failed. Check your connection." });
      addToast("Chain verification failed.", "error");
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleVerifyBlockchain = async () => {
    if (!id) return;
    setVerifyingBlockchain(true);
    setBlockchainResults([]);

    try {
      const decisions = await getDecisions(id);

      // Show blockchain status from the database (tx_hash + chain_verified)
      // This is the source of truth — on-chain verification is an extra check
      const results: BlockchainVerification[] = decisions.map((d) => ({
        decision_id: d.id,
        on_chain: d.chain_verified || false,
        hash_match: d.chain_verified || false,
        tx_hash: (d as any).tx_hash || d.blockchain_tx || null,
        block_number: d.block_number || null,
      }));

      setBlockchainResults(results);
      const anchored = results.filter(r => r.on_chain).length;
      const withTx = results.filter(r => r.tx_hash).length;
      addToast(
        `${anchored} of ${results.length} decisions anchored on Polygon.${withTx > anchored ? ` ${withTx - anchored} pending.` : ""}`,
        anchored > 0 ? "success" : "info"
      );
    } catch (err) {
      console.error("Blockchain verification failed:", err);
      addToast("Blockchain verification failed.", "error");
    } finally {
      setVerifyingBlockchain(false);
    }
  };

  const glassCard: React.CSSProperties = {
    background: t.bgCard,
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 16,
    boxShadow: `${t.glassShadow}, ${t.glassInnerGlow}`,
    padding: "20px",
  };

  const buttonPrimary: React.CSSProperties = {
    padding: "10px 20px", background: t.accent, border: "none", borderRadius: 10,
    color: "#FFF", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
    display: "flex", alignItems: "center", gap: 6, boxShadow: t.btnShadow,
  };

  const buttonSecondary: React.CSSProperties = {
    ...buttonPrimary,
    background: "transparent", border: `1px solid ${t.glassBorder}`, color: t.textPrimary,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 768 }}>
      {/* Local Chain Verification */}
      <div style={{ ...glassCard, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18, color: t.accent }}>{"\u26D3"}</span>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, margin: 0 }}>Local Hash Chain Verification</h2>
        </div>
        <p style={{ fontSize: 12, marginBottom: 16, color: t.textSecondary }}>
          Recomputes SHA-256 hashes for all decisions and verifies chain integrity.
        </p>

        {verifyingChain && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 8, borderRadius: 9999, overflow: "hidden", backgroundColor: t.divider }}>
              <div style={{
                height: "100%", borderRadius: 9999, background: t.accent,
                transition: "all 0.3s", width: `${progress}%`,
              }} />
            </div>
            <p style={{ fontSize: 11, marginTop: 4, color: t.textMuted }}>Verifying records...</p>
          </div>
        )}

        {chainResult && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: 12,
            borderRadius: 12, marginBottom: 16,
            background: chainResult.valid ? t.neonGreenDim : t.neonRedDim,
          }}>
            <span style={{ fontSize: 18, color: chainResult.valid ? t.neonGreen : t.neonRed }}>
              {chainResult.valid ? "\u2713" : "\u2715"}
            </span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, margin: 0 }}>
                {chainResult.valid ? "Chain Intact" : "Chain Broken"}
              </p>
              <p style={{ fontSize: 11, color: t.textSecondary, margin: 0 }}>{chainResult.message}</p>
            </div>
          </div>
        )}

        <button onClick={handleVerifyChain} disabled={verifyingChain}
          style={{ ...buttonPrimary, opacity: verifyingChain ? 0.6 : 1, cursor: verifyingChain ? "not-allowed" : "pointer" }}>
          <span>{"\u26D3"}</span> {verifyingChain ? "Verifying..." : "Verify Hash Chain"}
        </button>
      </div>

      {/* Blockchain Verification */}
      <div style={{ ...glassCard, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18, color: t.accent }}>{"\uD83D\uDEE1"}</span>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, margin: 0 }}>Blockchain Verification</h2>
        </div>
        <p style={{ fontSize: 12, marginBottom: 16, color: t.textSecondary }}>
          Verifies each decision against on-chain anchors on Polygon Amoy.
        </p>

        {blockchainResults.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, maxHeight: 300, overflowY: "auto" }}>
            {blockchainResults.map((r, i) => (
              <div key={r.decision_id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "8px 12px", borderRadius: 8, backgroundColor: t.bgCard,
              }}>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: t.textMuted }}>#{i + 1}</span>
                {r.on_chain ? (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                    background: t.neonGreenDim, color: t.neonGreen,
                  }}>Verified</span>
                ) : (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                    background: t.neonAmberDim, color: t.neonAmber,
                  }}>Not Anchored</span>
                )}
                {r.tx_hash && (
                  <a href={`${env.POLYGONSCAN_URL}/tx/${r.tx_hash}`} target="_blank" rel="noopener noreferrer"
                    style={{
                      color: t.accent, fontSize: 10, fontFamily: "monospace",
                      display: "inline-flex", alignItems: "center", gap: 4,
                      textDecoration: "none", marginLeft: "auto",
                    }}>
                    {truncateHash(r.tx_hash, 6)} <span>{"\u2197"}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <button onClick={handleVerifyBlockchain} disabled={verifyingBlockchain}
          style={{ ...buttonSecondary, opacity: verifyingBlockchain ? 0.6 : 1, cursor: verifyingBlockchain ? "not-allowed" : "pointer" }}>
          <span>{"\uD83D\uDEE1"}</span> {verifyingBlockchain ? "Verifying..." : "Verify On-Chain"}
        </button>
      </div>
    </div>
  );
}
