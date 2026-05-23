# 건물 관리비 체크 (프론트 데모)

PRD 전체 플로우를 **Mock DB(localStorage)** 로 체험하는 Next.js 프론트엔드입니다.

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
| 관리자 | **401** | 1234 |

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

## 다음 단계

Supabase 연동 시 `src/lib/store.ts` 를 API/Server Actions 로 교체하면 됩니다.
