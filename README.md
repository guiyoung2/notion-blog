# Notion Blog

> **Notion을 CMS처럼 활용해 기술 글을 발행**하고, 태그 필터링·무한 스크롤·동적 SEO·OG 이미지 자동화까지 갖춘 개인 블로그.
> Notion API와 Next.js App Router 기반 CMS 패턴을 학습하기 위해 만든 프로젝트입니다.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery)](https://tanstack.com/query)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Notion API](https://img.shields.io/badge/Notion-API-000000?logo=notion)](https://developers.notion.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://vercel.com/)

**Live**: [notion-blog-rose-phi.vercel.app](https://notion-blog-rose-phi.vercel.app)
**Repo**: [github.com/guiyoung2/notion-blog](https://github.com/guiyoung2/notion-blog)

---

## 1. Highlights

| 영역            | 내용                                                                                  |
| --------------- | ------------------------------------------------------------------------------------- |
| **CMS 연동**    | Notion API + `notion-to-md`로 Notion 페이지를 그대로 블로그 콘텐츠로 변환             |
| **캐시 전략**   | `unstable_cache` + 태그 갱신으로 Notion API 호출 비용 감소, 새 글 발행 시 즉시 동기화 |
| **무한 스크롤** | TanStack Query `useInfiniteQuery`로 페이지네이션 확장                                 |
| **SEO 자동화**  | `generateMetadata` + 동적 OG 이미지로 포스트 단위 메타데이터 자동 생성                |
| **본문 가독성** | MDX + `rehype-pretty-code`로 기술 글 코드 블록 하이라이팅, TOC 자동 생성              |
| **댓글**        | Giscus(GitHub Discussions) 연동                                                       |

---

## 2. 기술 스택과 선택 이유

| 구분              | 기술                                                                 | 역할                                                 |
| ----------------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| **프레임워크**    | Next.js 16 (App Router)                                              | RSC + 동적 메타데이터 + ISR 친화적 환경              |
| **언어**          | TypeScript 5                                                         | Notion API 응답 스키마 보호                          |
| **렌더링**        | Server Components, Suspense                                          | 초기 데이터는 서버, 페이지네이션은 클라이언트로 분리 |
| **데이터 페칭**   | TanStack Query 5 + Next `unstable_cache`                             | 캐시 + 태그 무효화로 외부 CMS 호출 부담 감소         |
| **CMS·콘텐츠**    | Notion API + `notion-to-md` + MDX                                    | Notion 페이지를 마크다운 → MDX로 변환해 렌더         |
| **마크다운 처리** | `remark-gfm`, `rehype-slug`, `rehype-pretty-code`, `rehype-sanitize` | GFM 지원, 헤딩 ID, 코드 하이라이팅, XSS 방지         |
| **UI·스타일**     | Tailwind CSS 4 + shadcn/ui + Radix UI                                | 접근성 보장된 UI 프리미티브 + 유틸리티 스타일        |
| **댓글**          | Giscus                                                               | GitHub Discussions 기반, 별도 DB 불필요              |
| **배포**          | Vercel                                                               | App Router·Edge 런타임·Speed Insights와의 정합성     |

---

## 3. 주요 기능

- Notion 데이터베이스 기반 포스트 목록·상세 조회 (`/`, `/blog/[slug]`)
- 태그 필터링 및 정렬 기반 탐색
- React Query 무한 스크롤 목록
- `notion-to-md` + MDX 본문 렌더
- `rehype-pretty-code` 코드 블록 하이라이팅
- 포스트 제목·설명·태그 기반 동적 메타데이터 + OG 이미지
- Giscus 댓글
- 다크 모드 + 반응형 레이아웃
- 간단한 포스트 작성 페이지 (`/blog/write`) — 서버 액션 + Zod 검증

---

## 4. 학습 포인트 (Key Takeaways)

> 이 프로젝트로 학습한 핵심 패턴 정리.

### 4-1. Notion을 CMS로 쓰는 구조

- Notion 데이터베이스의 페이지 = 블로그 포스트로 1:1 매핑
- 페이지 속성(태그, 발행일, slug)을 통해 필터링·정렬 메타데이터 확보
- `notion-to-md`로 블록 단위 콘텐츠를 마크다운으로 변환 → MDX 파이프라인에 투입
- child page 링크까지 이어 붙여 Notion 문서 구조를 블로그 탐색 흐름으로 연결

### 4-2. 외부 CMS와의 캐시 전략

```
[새 글 작성] → revalidateTag('posts')
                       ↓
[next 요청]   → unstable_cache: 캐시 miss
                       ↓
              Notion API 호출 → 응답 → 캐시 저장
                       ↓
[이후 요청]   → unstable_cache: 캐시 hit (Notion 호출 없음)
```

- 단순 캐시는 새 글 반영이 늦고, 단순 직접 호출은 비용/속도 문제
- **태그 기반 무효화**로 글 작성 시점에 명시적으로 캐시 폐기 → 두 문제 동시 해결

### 4-3. 서버 캐시 + 클라이언트 무한 스크롤 분리

- **초기 N개**: 서버 컴포넌트에서 미리 받아 SEO·LCP 최적화
- **이후 페이지**: 클라이언트에서 `useInfiniteQuery`로 점진 로딩
- 첫 렌더는 빠르게, 인터랙션 후 로딩은 자연스럽게

### 4-4. 포스트 단위 SEO 자동화

- `generateMetadata`로 포스트 제목·설명·태그·canonical URL·OG 정보를 페이지 빌드 시 동적 생성
- `opengraph-image.tsx`에서 포스트별 OG 이미지를 런타임 생성해 공유 미리보기에 포스트 컨텍스트 반영
- 별도 OG 이미지 디자인 작업 없이 글마다 다른 카드가 자동으로 나오게 함

### 4-5. 긴 글 가독성

- `rehype-slug` + TOC 추출 플러그인으로 헤딩 기준 목차 자동 생성
- 모바일: 접이식 목차 / 데스크톱: sticky 목차 — 환경에 맞춰 UX 분리

---

## 5. 트러블슈팅

### 5-1. Notion API 응답 비용

**문제**
블로그 목록과 상세 페이지 모두 외부 CMS 응답 속도에 직접 영향을 받아 사용자 첫 진입 경험이 일관되지 않았습니다.

**해결**
`unstable_cache`로 응답을 캐시하고, 글 작성/수정 시 `revalidateTag`로 명시적 무효화. 사용자 요청에서 Notion API 호출 횟수를 크게 줄이면서도 새 글 발행 후 즉시 반영되는 구조를 유지.

**결과**
동일 조건 재요청 시 Notion API 호출이 거의 발생하지 않음. 운영 응답 안정성 확보.

### 5-2. 긴 기술 글의 탐색성

**문제**
글이 길어지면 원하는 섹션으로 바로 이동하기 어려워 가독성이 떨어졌습니다.

**해결**
헤딩 기반 TOC를 자동 생성하고, 모바일/데스크톱 환경에 맞춰 다른 UI(접이식 / sticky)로 제공.

**결과**
수동 목차 관리 없이 긴 글에서도 탐색 흐름 유지.

### 5-3. 포스트 공유 시 메타데이터 일관성

**문제**
기본 메타데이터만으로는 포스트별 제목·설명이 검색/공유 미리보기에 충분히 반영되지 않았습니다.

**해결**
포스트 단위 `generateMetadata` + 동적 OG 이미지 생성을 추가.

**결과**
SNS 공유·검색 결과에서 문서별 맥락이 그대로 노출.

---

## 6. 프로젝트 구조

```
src/
├── app/                  # App Router 페이지, API route, server action
│   ├── page.tsx          # 홈 (포스트 목록)
│   ├── blog/[slug]/      # 포스트 상세
│   ├── blog/write/       # 포스트 작성 (server action + Zod)
│   └── opengraph-image.tsx
├── components/           # 공통 UI · 블로그 기능 컴포넌트
├── lib/                  # Notion 연동, 날짜 포맷, 유틸
├── types/                # 블로그 관련 타입
└── app/providers.tsx     # React Query / Theme Provider
```

---

## 7. 실행 방법

### 환경 변수

`.env.local`:

```env
NOTION_TOKEN=
NOTION_DATA_SOURCE_ID=
NOTION_DATABASE_ID=
```

### 설치·실행

```bash
npm install
npm run dev
```

`http://localhost:3000`
