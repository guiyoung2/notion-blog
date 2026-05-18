# Notion Blog

> **Notion을 CMS처럼 활용해 기술 글을 발행**하고, 태그·키워드 필터링·무한 스크롤·동적 SEO·OG 이미지 자동화까지 갖춘 개인 블로그.
> Notion API와 Next.js App Router 기반 CMS 패턴을 학습하기 위해 만든 프로젝트입니다.

![CI](https://github.com/guiyoung2/notion-blog/actions/workflows/ci.yml/badge.svg)

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
| **캐시 전략**   | 목록·상세 모두 `unstable_cache`(revalidate: 300) + 글 작성 시 `revalidateTag`로 명시적 무효화 |
| **무한 스크롤** | TanStack Query `useInfiniteQuery`로 페이지네이션 확장                                 |
| **SEO 자동화**  | `generateMetadata` + 동적 OG 이미지로 포스트 단위 메타데이터 자동 생성                |
| **본문 가독성** | MDX + `rehype-pretty-code`로 기술 글 코드 블록 하이라이팅, TOC 자동 생성              |
| **댓글**        | Giscus(GitHub Discussions) 연동                                                       |

---

## 2. 기술 스택과 선택 이유

| 구분              | 기술                                                                 | 선택 근거                                                                                                                |
| ----------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **프레임워크**    | Next.js 16 (App Router)                                              | RSC + 동적 메타데이터 + `unstable_cache` ISR 친화적 환경. Pages Router는 `unstable_cache` 태그 무효화 미지원.            |
| **언어**          | TypeScript 5                                                         | Notion API 응답 스키마(`PageObjectResponse`)를 타입으로 보호. 런타임 에러를 컴파일 타임에 차단.                          |
| **렌더링**        | Server Components, Suspense                                          | 초기 데이터는 서버 컴포넌트에서, 이후 무한 스크롤은 클라이언트에서 분리. SEO·LCP를 서버 렌더로 보장.                    |
| **데이터 페칭**   | TanStack Query 5                                                     | 무한 스크롤 목록의 클라이언트 페이지네이션 상태 관리에만 사용. RSC의 초기 데이터를 `initialData`로 전달해 SSR 연결. 글로벌 캐시 역할은 없음. — `useState+useEffect`로도 가능하나 `useInfiniteQuery`의 커서 추적과 SSR `initialData` 통합으로 선택. |
| **서버 캐시**     | Next.js `unstable_cache`                                             | 목록(`getPublishedPosts`, 캐시 키: tag·sort·cursor·query)과 상세(`getPostBySlug`, 캐시 키: slug) 모두 `tags` + `revalidate: 300` 적용. 글 작성 시 `revalidateTag('posts', 'max')` + `revalidateTag(postId, 'max')` + `revalidatePath('/')` 호출로 즉시 무효화. — `fetch` 캐시는 서버 액션에서 태그 단위 무효화 불가. |
| **CMS·콘텐츠**    | Notion API + `notion-to-md` + MDX                                    | Notion 페이지를 마크다운 → MDX로 변환해 렌더. 런타임에 Notion 마크다운을 받아 렌더해야 하므로 빌드 타임 `@next/mdx`는 부적합. |
| **마크다운 처리** | `remark-gfm`, `rehype-slug`, `rehype-pretty-code`                   | GFM 지원, 헤딩 ID, 코드 하이라이팅. `rehype-sanitize`는 신뢰된 소스(Notion)와 pretty-code CSS 클래스 상충 문제로 제외.  |
| **UI·스타일**     | Tailwind CSS 4 + shadcn/ui + Radix UI                                | 접근성 보장된 UI 프리미티브 + 유틸리티 스타일. Chakra UI 대비 번들 오버헤드 적음.                                       |
| **댓글**          | Giscus                                                               | GitHub Discussions 기반, 별도 DB 불필요. utterances 대비 스레드 지원.                                                   |
| **배포**          | Vercel                                                               | App Router·Edge 런타임과의 정합성. `unstable_cache` 태그 무효화 API도 Vercel 환경에서 지원.                             |

---

## 3. 측정 결과

> 측정일: 2026-05-19 · Lighthouse CI 헤드리스 Chrome, 모바일 에뮬레이션

### 빌드·테스트

| 항목 | 값 |
| ---- | -- |
| 테스트 | 27개 (6파일), 전체 통과 ✅ |
| 커버리지 (statements / lines) | 23.29% / 24.02% |
| First Load JS (Turbopack) | 850.5 KB |
| CSS | 68.0 KB |
| CI | GitHub Actions — lint · 타입체크 · 테스트 · 빌드 |

### Lighthouse (모바일, 배포 URL 기준)

| 페이지 | Performance | Accessibility | Best Practices | SEO |
| ------ | ----------- | ------------- | -------------- | --- |
| `/` | 98 | 85 | 100 | 100 |
| `/blog` | 96 | 85 | 100 | 100 |
| `/blog/[slug]` | 99 | 96 | 100 | 100 |

---

## 4. 주요 기능

- Notion 데이터베이스 기반 포스트 목록·상세 조회 (`/`, `/blog/[slug]`)
- 태그·키워드 필터링 및 정렬 — Notion API `filter` 파라미터로 DB 쿼리 단에서 처리
- React Query 무한 스크롤 목록
- `notion-to-md` + MDX 본문 렌더
- `rehype-pretty-code` 코드 블록 하이라이팅
- 포스트 제목·설명·태그 기반 동적 메타데이터 + OG 이미지
- Giscus 댓글
- 다크 모드 + 반응형 레이아웃
- 간단한 포스트 작성 페이지 (`/blog/write`) — 서버 액션 + Zod 검증

---

## 5. 학습 포인트 (Key Takeaways)

> 이 프로젝트로 학습한 핵심 패턴 정리.

### 5-1. Notion을 CMS로 쓰는 구조

- Notion 데이터베이스의 페이지 = 블로그 포스트로 1:1 매핑
- 페이지 속성(태그, 발행일, slug)을 통해 필터링·정렬 메타데이터 확보
- `notion-to-md`로 블록 단위 콘텐츠를 마크다운으로 변환 → MDX 파이프라인에 투입
- child page 링크까지 이어 붙여 Notion 문서 구조를 블로그 탐색 흐름으로 연결

### 5-2. 외부 CMS와의 캐시 전략

```
[새 글 작성] → revalidateTag('posts', 'max')   ← 목록 캐시 무효화
             → revalidateTag(postId, 'max')    ← 해당 포스트 캐시 무효화
             → revalidatePath('/')             ← 홈 페이지 즉시 갱신
                       ↓
[next 요청]   → unstable_cache: 캐시 miss
                       ↓
              Notion API 호출 → 응답 → 캐시 저장 (revalidate: 300)
                       ↓
[이후 요청]   → unstable_cache: 캐시 hit (Notion 호출 없음)
```

- 목록(`getPublishedPosts`)과 상세(`getPostBySlug`) 모두 `unstable_cache` 적용
- 캐시 키는 쿼리 파라미터(태그·정렬·커서·키워드·slug) 포함 — 파라미터가 다른 요청은 별도 캐시 엔트리
- **태그 기반 무효화**로 글 작성 시점에 명시적으로 캐시 폐기 → 단순 캐시(새 글 반영 지연)와 직접 호출(비용 문제) 동시 해결

### 5-3. 서버 캐시 + 클라이언트 무한 스크롤 분리

- **초기 N개**: 서버 컴포넌트에서 `getPublishedPosts`를 호출해 Promise를 클라이언트에 전달, `use(postsPromise)`로 소비
- **이후 페이지**: 클라이언트에서 `useInfiniteQuery`로 점진 로딩
- 첫 렌더는 빠르게(SEO·LCP), 인터랙션 후 로딩은 자연스럽게

### 5-4. 포스트 단위 SEO 자동화

- `generateMetadata`로 포스트 제목·설명·태그·canonical URL·OG 정보를 페이지 빌드 시 동적 생성
- `opengraph-image.tsx`에서 포스트별 OG 이미지를 런타임 생성해 공유 미리보기에 포스트 컨텍스트 반영
- 별도 OG 이미지 디자인 작업 없이 글마다 다른 카드가 자동으로 나오게 함

### 5-5. 긴 글 가독성

- `rehype-slug` + TOC 추출 플러그인으로 헤딩 기준 목차 자동 생성
- 모바일: 접이식 목차 / 데스크톱: sticky 목차 — 환경에 맞춰 UX 분리

---

## 6. 트러블슈팅

### 6-1. 상세 페이지도 Notion API를 매 요청 직접 호출하던 문제

**문제**
목록 페이지는 `unstable_cache`로 캐시했지만, `getPostBySlug`에는 캐시가 없어 상세 페이지 접근 시마다 Notion API를 직접 호출했습니다. "Notion API 호출 비용 감소"를 표방하면서 상세 페이지는 캐시 대상에서 빠져 있었습니다.

**해결**
`getPostBySlug`에 `unstable_cache`를 적용. 캐시 키는 `['post', slug]`, 태그 `['post', slug]`, `revalidate: 300`. 글 작성 시 `revalidateTag(created.id, 'max')`로 해당 포스트의 캐시도 함께 무효화.

**결과**
목록과 상세 모두 `unstable_cache` + 태그 무효화 전략이 일관되게 적용됨. README에 기술한 "Notion API 호출 비용 감소"가 상세 페이지에도 실제로 적용.

### 6-2. 태그 필터링 시 페이지네이션 부정합

**문제**
태그 필터링을 Notion API 응답 후 클라이언트 코드에서 처리했습니다. `pageSize=4`로 가져온 결과를 태그로 필터하므로, 태그 선택 시 반환 포스트 수가 4개보다 적고 무한 스크롤 cursor도 부정합이 발생했습니다.

**해결**
`buildPublishedPostsFilter` 함수로 태그·키워드 조건을 Notion API의 `filter` 파라미터로 이동. Notion DB 쿼리 단에서 필터링하므로 `pageSize`가 실제 결과 수와 일치.

**결과**
태그 선택 시 항상 `pageSize`만큼의 결과를 반환. 무한 스크롤 cursor 부정합 해소.

### 6-3. 긴 기술 글의 탐색성

**문제**
글이 길어지면 원하는 섹션으로 바로 이동하기 어려워 가독성이 떨어졌습니다.

**해결**
헤딩 기반 TOC를 자동 생성하고, 모바일/데스크톱 환경에 맞춰 다른 UI(접이식 / sticky)로 제공.

**결과**
수동 목차 관리 없이 긴 글에서도 탐색 흐름 유지.

### 6-4. 포스트 공유 시 메타데이터 일관성

**문제**
기본 메타데이터만으로는 포스트별 제목·설명이 검색/공유 미리보기에 충분히 반영되지 않았습니다.

**해결**
포스트 단위 `generateMetadata` + 동적 OG 이미지 생성을 추가.

**결과**
SNS 공유·검색 결과에서 문서별 맥락이 그대로 노출.

---

## 7. 프로젝트 구조

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

## 8. 실행 방법

### 환경 변수

`.env.local`:

```env
NOTION_TOKEN=
NOTION_DATA_SOURCE_ID=
NOTION_DATABASE_ID=
```

### 설치·실행

```bash
pnpm install
pnpm dev
```

`http://localhost:3000`
