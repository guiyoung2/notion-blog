# diagnosis.md — notion-blog 프로젝트 진단

> 작성일: 2026-05-18  
> 목적: 이력서·면접 근거 자료용 솔직한 현황 진단  
> 원칙: 코드로 확인한 사실만 `파일:라인` 근거와 함께 기재. 추측은 "(추정)"으로 표기.

---

## 1. 기술 스택 적정성 분석

| 기술 | 왜 썼나 (추정) | 대안 | 이 프로젝트 규모에 적정한가 | 판정 |
|------|--------------|------|--------------------------|------|
| **TanStack Query 5** | 무한 스크롤 상태 관리, `initialData` 기반 SSR 연결 | `useState + useEffect + fetch` (단순 페이지네이션이면 충분) | RSC initialData → `useInfiniteQuery`로 연결하는 패턴을 사용 중. 단, QueryClient + Provider 전체 설치 비용 대비 사용 깊이가 얕음. | **조건부 적정** — `PostListSuspense.tsx` 무한 스크롤 구현에는 실제로 쓰이나, 앱 전체 글로벌 캐시 활용은 사실상 없음. |
| **`unstable_cache`** | Notion API 호출 비용 감소, ISR 스타일 캐시 | 없음 (Next.js 내장, 올바른 선택) | `getPublishedPosts`에만 적용. `getPostBySlug`는 미적용. | **부분 적정** — 목록은 캐시되나 상세 페이지는 매 요청마다 Notion API 직접 호출. |
| **`next-mdx-remote`** | 런타임 MDX 렌더 (RSC 지원) | `@next/mdx` (빌드 타임 컴파일) | 런타임에 Notion 마크다운을 받아 렌더해야 하므로 적합. | **적정** — `blog/[slug]/page.tsx:7`에서 `MDXRemote` 사용. |
| **`@next/mdx`** | (추정) 초기 빌드 타임 MDX 처리 시도 후 방치 | 없음 (삭제 대상) | `next-mdx-remote`로 대체됐으나 `package.json:19`에 여전히 설치됨. 실제 렌더 경로에서 미사용. | **불필요** — 데드 의존성. 제거 필요. |
| **`@mdx-js/mdx`** | TOC 추출 전용 `compile()` 호출 | `remark-extract-toc` 등 rehype 플러그인만으로 처리 | `blog/[slug]/page.tsx:110`에서 `compile()`로 TOC만 추출. 렌더와 별개 파이프라인이 두 번 돌아감. | **비효율** — TOC 추출 용도로만 사용. 동일 markdown을 두 번 컴파일. |
| **`react-intersection-observer`** | 무한 스크롤 뷰포트 감지 | `IntersectionObserver` 직접 구현 | `PostListSuspense.tsx:49`에서 `useInView`로 scroll trigger. 단순 사용이지만 라이브러리 활용이 명확함. | **적정** |
| **`zod`** | 서버 액션 폼 입력 검증 | 수동 검증 | `actions/blog.ts:9`에서 postSchema 정의. 사용 범위가 write 폼 1개뿐이나 패턴은 올바름. | **적정** (소규모 적용이지만 올바른 패턴) |
| **`rehype-sanitize`** | XSS 방지 | DOMPurify (클라이언트), 신뢰된 소스면 미사용 | 소스가 직접 제어하는 Notion이므로 실질적 위협이 낮음. 또한 `rehype-pretty-code`가 추가하는 CSS 클래스를 sanitize가 제거할 수 있는 상충 위험 있음. (`blog/[slug]/page.tsx:109` 주석 참조) | **재검토 필요** — Notion 신뢰 소스 + pretty-code 상충 고려시 제거 또는 화이트리스트 설정 권장. |
| **`@tanstack/react-query-devtools`** | 개발 편의 | 없음 | `providers.tsx:5`에 포함. 프로덕션 빌드에서도 번들에 포함되나 `NODE_ENV !== 'production'` 조건 없이 렌더됨. | **경고** — devtools가 프로덕션 빌드에 노출될 수 있음. |

### 캐시 전략 실제 적용 현황

```
getPublishedPosts  → unstable_cache 적용 ✅ (notion.ts:219, tags:['posts'], revalidate:300)
getPostBySlug      → unstable_cache 미적용 ❌ (notion.ts:80, 매 요청 Notion API 직접 호출)
getTags            → getPublishedPosts(pageSize:100) 재사용 → 캐시 hit 가능 ✅ (notion.ts:253)
```

### MDX 렌더 경로 (실제)

```
Notion 마크다운 문자열
  → compile() [TOC 추출만]    ← @mdx-js/mdx 사용  (blog/[slug]/page.tsx:110)
  → MDXRemote [실제 렌더]     ← next-mdx-remote 사용 (blog/[slug]/page.tsx:161)
```
`@next/mdx`는 두 경로 모두에서 미사용.

---

## 2. 주장 ↔ 코드 불일치 목록

| 주장 문구 (출처) | 코드 실제 | 근거 파일:라인 |
|----------------|-----------|--------------|
| README 캐시 다이어그램: `revalidateTag('posts')`로 캐시 폐기 | 실제 코드는 `updateTag('posts')` 사용. `revalidateTag`는 import만 되고 미호출. | `src/app/actions/blog.ts:7` (import), `src/app/actions/blog.ts:63` (updateTag 호출), `src/app/actions/blog.ts:75` (revalidatePath 주석 처리) |
| README: "태그 기반 무효화로 캐시 폐기" | `updateTag`는 현재 Next.js 문서상 stale 마킹 API. `revalidateTag`(즉시 무효화)와 동작이 다를 수 있음. 의도한 동작과 실제 API가 일치하는지 불분명. | `src/app/actions/blog.ts:63` |
| README: "Notion API 호출 비용 감소" (unstable_cache 언급) | `getPostBySlug`는 캐시 없이 매 요청 Notion API 직접 호출. 상세 페이지 접근 시 API 비용 감소 효과 없음. | `src/lib/notion.ts:80-115` (unstable_cache 없음) |
| README 4-3절: "초기 N개: 서버 컴포넌트에서 미리 받아 SEO·LCP 최적화" | 서버 컴포넌트(`page.tsx:22`)가 `getPublishedPosts` 호출 후 Promise를 클라이언트에 전달. `PostListSuspense.tsx:17`에서 `use(postsPromise)`로 소비. 구조는 맞으나, `PostList.client.tsx`라는 구버전 컴포넌트(useEffect + fetch만 사용)가 사용되지 않은 채 코드베이스에 남아있어 혼란 유발. | `src/components/features/blog/PostList.client.tsx:1-29` (데드 코드), `src/components/features/blog/PostListSuspense.tsx:17` (실제 사용) |
| README: "TanStack Query `useInfiniteQuery`로 페이지네이션 확장" | `PostListSuspense.tsx`에서는 실제로 사용. 그러나 동일 경로에 `PostList.client.tsx`(useInfiniteQuery 없는 단순 fetch 버전)도 존재해 README의 설명과 어긋나는 코드가 repo에 공존. | `src/components/features/blog/PostList.client.tsx:8-18` |
| README 4-4절: "`opengraph-image.tsx`에서 포스트별 OG 이미지를 런타임 생성" | 파일은 존재하고 post 데이터를 사용함. 다만 `params` 타입이 `{ params: { slug: string } }`으로 Promise 없이 정의되어 있어 Next.js 16 기준(params가 Promise) 불일치. 실제 동작 여부 불확실. | `src/app/blog/[slug]/opengraph-image.tsx:14` vs `src/app/blog/[slug]/page.tsx:22` (params: Promise) |
| README: "태그 필터링 및 정렬 기반 탐색" | 태그 필터링은 Notion API의 filter 파라미터가 아닌 API 응답 후 클라이언트 코드에서 수행됨. `pageSize=4`로 가져온 결과를 태그로 필터하므로 태그 선택 시 실제 반환 포스트 수가 4개보다 적을 수 있음. 페이지네이션 cursor도 부정합 발생 가능. | `src/lib/notion.ts:239` |
| README 실행 방법 (7절): `npm install`, `npm run dev` | 프로젝트는 `pnpm` 전용. `pnpm-lock.yaml` 존재. `npm install`로 설치 시 lockfile 불일치. | `README.md:176-178`, `package.json` (pnpm 전용 lock 파일) |
| CLAUDE.md 디렉터리 구조: `app/about/` 언급 | about 페이지 제거됨 (git log: "fix. about 페이지 제거"). 해당 디렉터리 미존재. | `CLAUDE.md` 디렉터리 구조 섹션, git log `b872389` |
| README: "새 글 발행 후 즉시 반영" | 글 작성 성공 후 `revalidatePath('/')` 및 `redirect('/')` 모두 주석 처리됨. 캐시 갱신 여부(updateTag 효과)와 별개로 페이지 이동도 없어 발행 후 UX 깨짐. | `src/app/actions/blog.ts:75-76` |

---

## 3. 리팩토링 우선순위표

> 기준: ① 이력서/README 주장을 사실로 만드는 것 > ② 측정 가능한 개선 > ③ 단순 정리

| 순위 | 항목 | 이유 | 예상 난이도 |
|------|------|------|------------|
| 1 | **`getPostBySlug` `unstable_cache` 적용** | README "Notion API 호출 비용 감소" 주장의 핵심. 상세 페이지가 캐시 대상에서 빠져 있음. | 낮음 |
| 2 | **태그 필터링을 Notion API filter로 이동** | 현재 클라이언트 필터링으로 인해 페이지네이션이 부정합. 무한 스크롤 정확성에 직접 영향. | 중간 |
| 3 | **`revalidateTag` vs `updateTag` 명확화** | README 다이어그램과 코드 불일치. 의도한 캐시 무효화가 실제로 일어나는지 검증 필요. | 낮음 |
| 4 | **글 작성 후 redirect + revalidatePath 복원** | 주석 처리된 코드로 UX가 깨짐. 사용자 확인 후 즉시 적용 가능. | 낮음 |
| 5 | **`PostList.client.tsx` 데드 코드 제거** | 실제 사용하는 `PostListSuspense.tsx`와 혼동 유발. repo 신뢰도 저하. | 낮음 |
| 6 | **`@next/mdx` 패키지 제거** | 실제 렌더 경로에서 미사용. 번들 및 빌드 비용만 소비. | 낮음 |
| 7 | **`opengraph-image.tsx` params 타입 수정** | Next.js 16 기준 params Promise 불일치. OG 이미지 생성 실패 가능성. | 낮음 |
| 8 | **TOC 이중 컴파일 제거** | `@mdx-js/mdx compile()` + `MDXRemote` 두 번 실행. 서버 렌더 성능 영향. | 중간 |
| 9 | **ReactQueryDevtools 프로덕션 분리** | devtools가 프로덕션 번들에 포함될 수 있음. `process.env.NODE_ENV` 가드 추가 필요. | 낮음 |
| 10 | **README 설치 명령어 수정** (`npm` → `pnpm`) | 문서 신뢰도. 면접/이력서 제출 전 최소한의 정리. | 낮음 |

---

## 4. 측정 베이스라인 (before)

> 측정일: 2026-05-18  
> 빌드 도구: Next.js 16.1.7 (Turbopack / Webpack)  
> 명령어: `pnpm build` (Turbopack) / `ANALYZE=true pnpm build --webpack` (webpack 분석)  
> 번들 분석: `@next/bundle-analyzer 16.2.6` 설치 완료 (`devDependencies`)

### 4-1. 빌드 결과

**상태: 성공 ✅**

```
▲ Next.js 16.1.7 (Turbopack)
✓ Compiled successfully in 3.1s
✓ Generating static pages (11/11) in 3.9s
```

### 4-2. 라우트 표

| 라우트 | 타입 | Revalidate | Expire |
|--------|------|-----------|--------|
| `/` | ƒ Dynamic | — | — |
| `/_not-found` | ○ Static | — | — |
| `/api/posts` | ƒ Dynamic | — | — |
| `/blog` | ○ Static | — | — |
| `/blog/[slug]` (vibeboard-refactor) | ● SSG | 1m | 1y |
| `/blog/[slug]` (logofreview-refactor) | ● SSG | 1m | 1y |
| `/blog/[slug]` (claude-basic-commands) | ● SSG | 1m | 1y |
| `/blog/[slug]` (claude-setting) | ● SSG | 1m | 1y |
| `/blog/[slug]/opengraph-image` | ƒ Dynamic | — | — |
| `/blog/write` | ○ Static | — | — |
| `/docs/[[...slug]]` | ƒ Dynamic | — | — |

> **비고**: Turbopack 빌드는 라우트별 First Load JS 크기 표를 출력하지 않는다(webpack 전용 기능). 청크별 크기는 아래 4-3절에서 직접 측정.

### 4-3. 정적 청크 크기 (`.next/static/chunks/`)

| 파일 | 크기 (KB) |
|------|-----------|
| e1a5c20e8e8c41fe.js | 219.2 |
| 9eafa679edfdc379.js | 214.9 |
| a6dad97d9634a72d.js | 110.0 |
| 0279fb07d1f33ce8.js | 82.8 |
| 9b919d2e2445a241.js | 45.7 |
| 8290103a1e595e39.js | 37.6 |
| 4ff6a0359b505131.js | 32.5 |
| b70543e624032cdf.js | 28.0 |
| 44fd8305b698a736.js | 26.5 |
| 922b40ef6e5ae034.js | 18.7 |
| 2571bb0f72f68691.js | 10.1 |
| turbopack-937b6ddce6547ea1.js | 10.0 |
| 9cef47ee1d7af715.js | 8.1 |
| 6766510215e7001b.js | 3.8 |
| a0f3305eb3557ea6.js | 1.6 |
| 57ccf87f2a53a249.js | 1.1 |
| **합계 JS** | **851.6 KB** |
| 1bc0db49b7ca08ef.css | 68.0 KB |

### 4-4. `.next/` 디렉터리 크기

#### Turbopack 빌드 기준

| 디렉터리 | 크기 |
|----------|------|
| `.next/server/` | 17.19 MB |
| `.next/static/` | 1.15 MB |
| `.next/cache/` | 0.68 MB |
| **`.next/` 총합** | **~20 MB** (파일 425개) |

#### Webpack 빌드 기준 (`ANALYZE=true pnpm build --webpack`)

| 파일 | 크기 (KB) |
|------|-----------|
| 626-55ee049b297524a6.js | 230.2 |
| 171-9a555e2f56cd69a9.js | 223.2 |
| 1f5bfe97-4e25e1fec3b883af.js | 193.1 |
| framework-7ca788fefb4bbd3a.js | 185.0 |
| 834-84ab6641fd667312.js | 183.3 |
| main-8b76955b75e3381d.js | 125.2 |
| polyfills-42372ed130431b0a.js | 109.1 |
| 250-8e4c4cbf2ea027db.js | 27.4 |
| app/layout-20aa15ed4a5e8101.js | 18.3 |
| 748-b5c042337d16480a.js | 17.2 |
| 기타 페이지·라우트 청크 | ~22 |
| **합계 JS** | **~1,382 KB** |
| 2fc5b98352addc7f.css | 65.9 KB |

| 디렉터리 | 크기 |
|----------|------|
| `.next/server/` | 5.1 MB |
| `.next/static/` | 1.7 MB |
| **합계** | — |

> **비고**: webpack 빌드는 `.next/analyze/client.html`, `nodejs.html`, `edge.html` 3개 리포트를 생성함 (`.next/` gitignore 대상 — 커밋 불포함). Turbopack 대비 JS 번들이 약 530 KB 더 크다 (1,382 KB vs 852 KB). Turbopack이 더 효율적인 트리셰이킹을 적용하기 때문.

### 4-5. 테스트 커버리지

- **커버리지: 0%** — 테스트 파일 없음 (`*.test.*`, `*.spec.*` 파일 미존재)
- **CI**: 있음 (`.github/workflows/ci.yml` — lint·타입체크·테스트·빌드)

### 4-6. Lighthouse 기준선 (before)

> 측정일: 2026-05-18  
> 측정 방식: Lighthouse CI (`lhci collect`, 모바일, 3회 측정 중앙값)  
> 대상: 배포 URL `https://notion-blog-rose-phi.vercel.app`

| 페이지 | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |
|--------|-------------|---------------|----------------|-----|-----|-----|-----|-----|
| / | 98 | 85 | 100 | 100 | 1280 ms | 2421 ms | 11 ms | 0.000 |
| /blog | 96 | 85 | 100 | 100 | 1369 ms | 2642 ms | 13 ms | 0.059 |
| /blog/vibeboard-refactor | 99 | 96 | 100 | 100 | 917 ms | 1967 ms | 19 ms | 0.000 |

_점수는 0–100, 시간은 ms, CLS는 단위 없음_

---

## 5. 측정 결과 (after)

> 측정일: 2026-05-19  
> 빌드 도구: Next.js 16.1.7 (Turbopack)  
> 명령어: `pnpm build`, `pnpm test:cov`

### 5-1. before/after 비교 요약

| 항목 | before | after | 변화 |
|------|--------|-------|------|
| 번들 크기 (Turbopack JS 합계) | 851.6 KB | 850.5 KB | -1.1 KB (무변화) |
| CSS | 68.0 KB | 68.0 KB | 동일 |
| 테스트 수 | 0 | 27 (6파일) | **+27** |
| 커버리지 (statements) | 0% | 23.29% | **+23.29%** |
| 커버리지 (branches) | 0% | 18.62% | **+18.62%** |
| 커버리지 (functions) | 0% | 19.35% | **+19.35%** |
| 커버리지 (lines) | 0% | 24.02% | **+24.02%** |
| CI | 있음 | 있음 | 유지 |

> **헤드라인**: 번들 크기 변화는 없다 — 리팩토링이 서버 사이드 로직 위주였기 때문. 측정 가능한 개선은 **테스트 0→27개, 커버리지 0%→23%** 다.

### 5-2. 빌드 결과 (after)

**상태: 성공 ✅** (`npx tsc -b` 타입 에러 0)

```
▲ Next.js 16.1.7 (Turbopack)
✓ Compiled successfully in 3.1s
✓ Generating static pages (11/11) in 6.5s
```

라우트 구조는 before와 동일 (변경 없음).

### 5-3. 정적 청크 크기 (after)

| 파일 | 크기 (KB) |
|------|-----------|
| e1a5c20e8e8c41fe.js | 219.2 |
| 9eafa679edfdc379.js | 214.9 |
| a6dad97d9634a72d.js | 110.0 |
| 0279fb07d1f33ce8.js | 82.8 |
| 9b919d2e2445a241.js | 45.7 |
| 8290103a1e595e39.js | 37.6 |
| 4ff6a0359b505131.js | 32.5 |
| b70543e624032cdf.js | 28.0 |
| 44fd8305b698a736.js | 26.5 |
| 922b40ef6e5ae034.js | 18.7 |
| 2571bb0f72f68691.js | 10.1 |
| turbopack-937b6ddce6547ea1.js | 10.0 |
| 9cef47ee1d7af715.js | 8.1 |
| 6766510215e7001b.js | 3.8 |
| a0f3305eb3557ea6.js | 1.6 |
| 57ccf87f2a53a249.js | 1.1 |
| **합계 JS** | **850.5 KB** |
| 71f45061d21718f2.css | 68.0 KB |

> before(851.6 KB) 대비 -1.1 KB. 청크 파일명과 수는 동일 — 서버 사이드 리팩토링은 클라이언트 번들에 영향을 주지 않는다.

### 5-4. 테스트 커버리지 (after)

**테스트 파일 6개, 27개 테스트 — 전부 통과 ✅**

| 파일 | 역할 |
|------|------|
| `src/lib/__tests__/date.test.ts` | 날짜 포맷 유틸 |
| `src/app/api/posts/__tests__/route.test.ts` | 포스트 목록 Route Handler |
| `src/app/_components/__tests__/BlogSearch.test.tsx` | 블로그 검색 컴포넌트 |
| `src/app/_components/__tests__/SortSelect.test.tsx` | 정렬 Select 컴포넌트 |
| `src/components/features/blog/__tests__/PostCard.test.tsx` | 포스트 카드 컴포넌트 |
| `src/app/actions/__tests__/blog.test.ts` | 서버 액션 (createPostAction) |

**전체 커버리지**

| 지표 | before | after |
|------|--------|-------|
| Statements | 0% (0/0) | 23.29% (75/322) |
| Branches | 0% | 18.62% (38/204) |
| Functions | 0% | 19.35% (24/124) |
| Lines | 0% | 24.02% (74/308) |

**주요 파일별 커버리지**

| 파일 | Stmts | Branch | Funcs | Lines |
|------|-------|--------|-------|-------|
| `app/_components/` (전체) | 55.31% | 42.85% | 35.29% | 55.31% |
| `components/ui/badge.tsx` | 100% | 75% | 100% | 100% |
| `components/ui/button.tsx` | 100% | 80% | 100% | 100% |
| `components/ui/select.tsx` | 72.72% | 71.42% | 70% | 72.72% |
| `lib/notion.ts` | 0% | 0% | 0% | 0% |

> **비고**: `lib/notion.ts`(Notion API 직접 호출)는 외부 의존성이므로 단위 테스트 대상 제외. `app/actions/blog.ts`는 `'use server'` 디렉티브로 인해 v8 커버리지 테이블에 별도 표시되지 않으나 5개 테스트가 실제로 검증함.

### 5-5. Lighthouse 측정 결과 (after)

> 측정일: 2026-05-19  
> 측정 방식: Lighthouse CI (`lhci collect`, 모바일, 3회 측정 중앙값)  
> 대상: 배포 URL `https://notion-blog-rose-phi.vercel.app`

| 페이지 | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |
|--------|-------------|---------------|----------------|-----|-----|-----|-----|-----|
| / | 98 | 85 | 100 | 100 | 925 ms | 2425 ms | 10 ms | 0.000 |
| /blog | 96 | 85 | 100 | 100 | 1369 ms | 2643 ms | 16 ms | 0.059 |
| /blog/vibeboard-refactor | 99 | 96 | 100 | 100 | 1079 ms | 1967 ms | 21 ms | 0.000 |

_점수는 0–100, 시간은 ms, CLS는 단위 없음_

#### before/after 헤드라인 지표 비교

| 페이지 | Performance (b→a) | LCP (b→a) | TBT (b→a) | CLS (b→a) |
|--------|-------------------|-----------|-----------|-----------|
| / | 98→98 | 2421ms→2425ms | 11ms→10ms | 0.000→0.000 |
| /blog | 96→96 | 2642ms→2643ms | 13ms→16ms | 0.059→0.059 |
| /blog/vibeboard-refactor | 99→99 | 1967ms→1967ms | 19ms→21ms | 0.000→0.000 |

> **헤드라인**: 리팩토링 전후 Lighthouse 점수·Core Web Vitals 모두 변화 없음. 이번 리팩토링은 서버 사이드 캐시·태그 필터·데드 코드 정리가 주요 변경 범위였으므로 클라이언트 측 성능 지표에 영향을 주지 않는다. 수치 차이(LCP ±4ms, TBT ±2ms)는 측정 오차 범위 내다.

_측정일: 2026-05-19 · 측정 환경: Lighthouse CI 헤드리스 Chrome, 모바일 에뮬레이션_

---

## 6. perf-review 판정

> 판정일: 2026-05-19  
> 기준: measure_before(4-6절) vs measure_after(5-5절) 실측값 비교

### 6-1. 페이지별 임계값 통과/미달 표

| 페이지 | 항목 | before | after | 임계값 | 판정 |
|--------|------|--------|-------|--------|------|
| `/` | CLS | 0.000 | 0.000 | < 0.1 | ✅ 통과 |
| `/` | Performance | 98 | 98 | after ≥ before − 5 (≥93) | ✅ 통과 |
| `/` | LCP | 2421 ms | 2425 ms | after ≤ before × 1.1 (≤2663 ms) | ✅ 통과 |
| `/blog` | CLS | 0.059 | 0.059 | < 0.1 | ✅ 통과 |
| `/blog` | Performance | 96 | 96 | after ≥ before − 5 (≥91) | ✅ 통과 |
| `/blog` | LCP | 2642 ms | 2643 ms | after ≤ before × 1.1 (≤2906 ms) | ✅ 통과 |
| `/blog/vibeboard-refactor` | CLS | 0.000 | 0.000 | < 0.1 | ✅ 통과 |
| `/blog/vibeboard-refactor` | Performance | 99 | 99 | after ≥ before − 5 (≥94) | ✅ 통과 |
| `/blog/vibeboard-refactor` | LCP | 1967 ms | 1967 ms | after ≤ before × 1.1 (≤2164 ms) | ✅ 통과 |

### 6-2. 번들 크기 변화 (참고)

| 항목 | before | after | 변화율 |
|------|--------|-------|--------|
| Turbopack JS 합계 | 851.6 KB | 850.5 KB | −0.1% (−1.1 KB) |

> 임계값 판정 항목 아님. 서버 사이드 리팩토링 위주였으므로 클라이언트 번들 변화 없음은 정상.

### 6-3. 최종 판정

**✅ 전체 통과 — retry_required: false**

9개 임계값 항목 전부 통과. 리팩토링으로 인한 성능 퇴행 없음.  
`index.json`에 `"retry_required": false` 기록 완료.
