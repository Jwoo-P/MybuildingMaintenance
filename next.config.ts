import type { NextConfig } from "next";

const REQUIRED_VERCEL_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

if (process.env.VERCEL === "1") {
  const missing = REQUIRED_VERCEL_ENV.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Vercel 배포에 필수 환경 변수가 없습니다: ${missing.join(", ")}. ` +
        "Dashboard → Settings → Environment Variables 에 .env.local 과 동일하게 추가한 뒤 Redeploy 하세요.",
    );
  }
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/icon.svg" },
    ];
  },
};

export default nextConfig;
