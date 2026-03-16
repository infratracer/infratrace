export const env = {
  API_URL: import.meta.env.VITE_API_URL || "",
  WS_URL: import.meta.env.VITE_WS_URL || "",
  POLYGON_RPC: import.meta.env.VITE_POLYGON_RPC || "https://rpc-amoy.polygon.technology",
  CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || "",
  POLYGONSCAN_URL: import.meta.env.VITE_POLYGONSCAN_URL || "https://amoy.polygonscan.com",
} as const;

if (!env.API_URL && typeof window !== "undefined") {
  console.warn("[InfraTrace] VITE_API_URL is not set — API calls will use relative URLs");
}
