import client from "./client";
import type { ChainVerification, BlockchainVerification } from "../types";

export async function verifyChain(projectId: string): Promise<ChainVerification> {
  const res = await client.post(`/projects/${projectId}/verify/chain`);
  return res.data;
}

export async function verifyBlockchain(
  projectId: string,
  decisionId: string
): Promise<BlockchainVerification> {
  const res = await client.post(`/projects/${projectId}/verify/blockchain`, {
    decision_id: decisionId,
  });
  return res.data;
}
