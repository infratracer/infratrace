import { useState } from "react";
import { useParams } from "react-router-dom";
import { verifyChain, verifyBlockchain } from "../api/verification";
import { getDecisions } from "../api/decisions";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { Shield, Link2, Check, X, ExternalLink } from "lucide-react";
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

  const handleVerifyChain = async () => {
    if (!id) return;
    setVerifyingChain(true);
    setChainResult(null);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 15, 90));
    }, 200);

    try {
      const result = await verifyChain(id);
      setProgress(100);
      setTimeout(() => setChainResult(result), 300);
    } catch (err) {
      console.error("Chain verification failed:", err);
      setChainResult({ valid: false, total_records: 0, message: "Verification failed" });
    } finally {
      clearInterval(interval);
      setVerifyingChain(false);
    }
  };

  const handleVerifyBlockchain = async () => {
    if (!id) return;
    setVerifyingBlockchain(true);
    setBlockchainResults([]);

    try {
      const decisions = await getDecisions(id);
      const results: BlockchainVerification[] = [];

      for (const d of decisions) {
        try {
          const result = await verifyBlockchain(id, d.id);
          results.push(result);
        } catch {
          results.push({
            decision_id: d.id,
            on_chain: false,
            hash_match: false,
            tx_hash: null,
            block_number: null,
          });
        }
      }

      setBlockchainResults(results);
    } catch (err) {
      console.error("Blockchain verification failed:", err);
    } finally {
      setVerifyingBlockchain(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Local Chain Verification */}
      <GlassCard padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Link2 size={18} className="text-accent" />
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Local Hash Chain Verification
          </h2>
        </div>
        <p className="text-[12px] mb-4" style={{ color: "var(--text-secondary)" }}>
          Recomputes SHA-256 hashes for all decisions and verifies chain integrity.
        </p>

        {verifyingChain && (
          <div className="mb-4">
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-divider)" }}>
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
              Verifying records...
            </p>
          </div>
        )}

        {chainResult && (
          <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${chainResult.valid ? "bg-neon-green-dim" : "bg-neon-red-dim"}`}>
            {chainResult.valid ? (
              <Check size={18} className="text-neon-green" />
            ) : (
              <X size={18} className="text-neon-red" />
            )}
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {chainResult.valid ? "Chain Intact" : "Chain Broken"}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {chainResult.message}
              </p>
            </div>
          </div>
        )}

        <Button onClick={handleVerifyChain} loading={verifyingChain}>
          <Link2 size={14} /> Verify Hash Chain
        </Button>
      </GlassCard>

      {/* Blockchain Verification */}
      <GlassCard padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-accent" />
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Blockchain Verification
          </h2>
        </div>
        <p className="text-[12px] mb-4" style={{ color: "var(--text-secondary)" }}>
          Verifies each decision against on-chain anchors on Polygon Amoy.
        </p>

        {blockchainResults.length > 0 && (
          <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
            {blockchainResults.map((r, i) => (
              <div
                key={r.decision_id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{ backgroundColor: "var(--bg-card)" }}
              >
                <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                  #{i + 1}
                </span>
                {r.on_chain ? (
                  <Badge variant="chain-verified">Verified</Badge>
                ) : (
                  <Badge variant="chain-pending">Not Anchored</Badge>
                )}
                {r.tx_hash && (
                  <a
                    href={`${env.POLYGONSCAN_URL}/tx/${r.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent text-[10px] font-mono inline-flex items-center gap-1 hover:underline ml-auto"
                  >
                    {truncateHash(r.tx_hash, 6)} <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleVerifyBlockchain} loading={verifyingBlockchain} variant="secondary">
          <Shield size={14} /> Verify On-Chain
        </Button>
      </GlassCard>
    </div>
  );
}
