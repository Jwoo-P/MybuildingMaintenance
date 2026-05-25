# 건물 관리비 체크

PRD 전체 플로우를 **Supabase(PostgreSQL)** 로 운영하는 Next.js 앱입니다.

## 사전 준비 (Supabase)

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/20260525000000_initial.sql` 실행 (테이블 + 9세대 시드)
3. Project Settings → API에서 URL·anon key·service role key 복사
4. 프로젝트 루트에 `.env.local` 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> DB 접근은 **Server Actions**(`src/lib/actions.ts`)만 사용합니다. `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용이며 Git에 올리지 마세요.

5. (선택) 홈 화면 **데모 데이터 초기화**로 샘플 입금·지출을 채울 수 있습니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 데모 계정

| 역할 | 호수 | 비밀번호 |
|------|------|----------|
| 세대원 | B01~B02, 101~302 | 1234 |
| 관리자 | **401** (초기 시드) | 1234 |

관리자 호수는 **세입자 정보 관리**에서 다른 호수로 이전할 수 있습니다.

## 화면 맵

| 경로 | 설명 |
|------|------|
| `/` | 플로우 개요·진입 |
| `/login` | 3×3 호수 + PIN |
| `/dashboard` | 세대원 메인 (지출·입금·알림) |
| `/admin` | 9세대 카드 총괄 |
| `/admin/expenses` | 당월 지출 등록 |
| `/admin/households/[room_no]` | 세대 상세·독촉 |
| `/payments/yearly` | 연도별 전 세대 입금 현황 (1~12월, 미래 월 제외) |

## 아키텍처

| 레이어 | 파일 |
|--------|------|
| 스키마 | `supabase/migrations/` |
| DB 쿼리 | `src/lib/db.ts` |
| Server Actions | `src/lib/db.ts` |
| 세션(브라우저) | `src/lib/session.ts` (sessionStorage) |
