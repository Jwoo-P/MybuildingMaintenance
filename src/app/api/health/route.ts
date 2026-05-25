import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/** 배포 환경 Supabase 연결 확인 (민감 정보 노출 없음) */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url?.trim() || !key?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        supabase: "missing_env",
        hint: "NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
      },
      { status: 503 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("households").select("room_no").limit(1);
    if (error) {
      return NextResponse.json(
        { ok: false, supabase: "db_error", message: error.message },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true, supabase: "connected" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json(
      { ok: false, supabase: "error", message },
      { status: 503 },
    );
  }
}
