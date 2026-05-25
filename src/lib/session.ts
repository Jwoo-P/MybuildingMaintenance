"use client";

import { ADMIN_ROOM } from "./types";
import type { Session } from "./types";

const SESSION_KEY = "building-maintenance-session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as Session;
}

export function setSession(session: Session): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/** 세대원 화면·데이터 조회에 쓰는 호수 */
export function getActiveRoom(session: Session): string {
  if (session.is_admin && session.view_as_room) {
    return session.view_as_room;
  }
  return session.room_no;
}

export function setAdminViewRoom(room_no: string): void {
  const session = getSession();
  if (!session?.is_admin) return;
  setSession({ ...session, view_as_room: room_no });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("admin-view-room-changed"));
  }
}

/** 관리자 세대원 화면 진입 시 보기 호수가 없으면 기본값 설정 */
export function ensureAdminViewRoom(
  defaultRoom?: string,
): string {
  const fallback = defaultRoom ?? ADMIN_ROOM;
  const session = getSession();
  if (!session?.is_admin) return session?.room_no ?? "";
  if (!session.view_as_room) {
    setSession({ ...session, view_as_room: fallback });
    return fallback;
  }
  return session.view_as_room;
}
