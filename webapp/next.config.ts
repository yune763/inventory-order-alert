import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DBドライバはバンドルせず、Node側でそのまま読み込ませる
  // （PGlite は WASM を同梱しており、バンドルすると読み込みに失敗する）
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  experimental: {
    // CSV取込は本文をServer Actionに丸ごと渡す。旧スプレッドシート（1000行×42列）を
    // 一度に移せるように、既定の1MBでは足りないので広げてある。
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
