# notion-blog

Notion을 CMS처럼 활용해 포스트를 발행하고, 태그 필터링과 무한 스크롤로 콘텐츠를 탐색할 수 있는 개인 기술 블로그입니다.

## 1. 프로젝트 개요

- 목적: Notion에서 작성한 글을 서비스 화면에 자연스럽게 연결하고, 개인 블로그 운영에 필요한 조회 경험과 SEO 구성을 함께 구현
- 핵심 포인트: Notion API 연동, App Router 기반 서버 렌더링, React Query 무한 스크롤, MDX/코드 하이라이팅, SEO/OG 자동화
- 개발 형태: 개인 프로젝트

## 2. 링크

- 배포: <https://notion-blog-rose-phi.vercel.app/>
- 저장소: <https://github.com/guiyoung2/notion-blog>

## 3. 주요 기능

- Notion 데이터베이스 기반 포스트 목록/상세 조회 (`/`, `/blog/[slug]`)
- 태그 필터링 및 정렬 기반 포스트 탐색
- React Query 기반 무한 스크롤 목록 조회
- `notion-to-md` + MDX 기반 본문 렌더링
- `rehype-pretty-code` 기반 코드 블록 하이라이팅
- 포스트 제목/설명/태그 기반 동적 SEO 메타데이터 및 OG 이미지 생성
- Giscus 기반 댓글 시스템 연동
- 다크 모드 지원 및 반응형 레이아웃
- 간단한 포스트 작성 페이지 (`/blog/write`)

## 4. 기술 스택

- Frontend: Next.js 16, React 19, TypeScript 5
- Routing / Rendering: App Router, Server Components, Suspense
- State / Fetching: TanStack Query 5, Next Cache (`unstable_cache`)
- CMS / Content: Notion API, `notion-to-md`, MDX
- Content Processing: `remark-gfm`, `rehype-slug`, `rehype-pretty-code`, `rehype-sanitize`
- UI / Styling: Tailwind CSS 4, shadcn/ui, Radix UI
- Comment: Giscus
- Deploy: Vercel

## 5. 기술 선택과 구현 포인트

### Notion 기반 CMS 구성

- 별도 관리자 페이지 없이 Notion을 작성 환경으로 사용하고, 서비스에서는 Notion API 응답을 블로그 데이터로 변환해 렌더링했습니다.
- `notion-to-md`를 사용해 블록 콘텐츠를 마크다운으로 변환하고, child page 링크도 함께 이어 붙여 Notion 문서 구조를 블로그 탐색 흐름으로 연결했습니다.

### 서버 캐시와 클라이언트 무한 스크롤의 역할 분리

- 초기 포스트 목록은 서버에서 가져오고, 이후 페이지네이션은 React Query `useInfiniteQuery`로 확장하도록 구성했습니다.
- `unstable_cache`와 태그 기반 갱신 흐름을 함께 사용해 Notion API 호출 부담을 줄이면서도 새 글 발행 이후 목록 동기화를 유지했습니다.

### 포스트 단위 SEO 자동화

- `generateMetadata`를 통해 포스트 제목, 설명, 태그, canonical URL, Open Graph 정보를 동적으로 생성했습니다.
- `opengraph-image.tsx`에서 포스트별 OG 이미지를 생성해 공유 시 문서별 맥락이 드러나도록 구성했습니다.

### 긴 글을 위한 가독성 개선

- `rehype-slug`와 TOC 추출 플러그인을 조합해 본문 헤딩 기준의 목차를 자동 생성했습니다.
- 모바일에서는 접이식 목차, 데스크톱에서는 sticky 목차를 분리 제공해 긴 글 탐색 경험을 개선했습니다.

## 6. 구현 포인트

### 홈 화면

- 좌측 태그 필터, 중앙 포스트 목록, 우측 프로필/연락처 영역으로 구성해 블로그 탐색과 개인 브랜딩 정보를 함께 배치했습니다.

### 상세 페이지

- 태그, 제목, 본문, 목차, 댓글까지 한 화면에서 이어지는 읽기 흐름을 구성했습니다.
- 포스트가 없거나 slug가 유효하지 않은 경우 `notFound()`로 예외를 안전하게 처리했습니다.

### 작성 플로우

- 서버 액션과 Zod 검증을 조합해 제목, 태그, 본문 입력 오류를 필드 단위로 안내합니다.
- 작성 완료 후 캐시를 갱신하고 메인 목록으로 자연스럽게 복귀하도록 설계했습니다.

## 7. 프로젝트 구조

```text
src/
├── app/                # App Router 페이지, API route, server action
├── components/         # 공통 UI 및 블로그 기능 컴포넌트
├── lib/                # Notion 연동, 날짜 포맷, 유틸 함수
├── types/              # 블로그 관련 타입 정의
└── app/providers.tsx   # React Query / Theme Provider 구성
```

## 8. 실행 방법

### 1) 패키지 설치

```bash
npm install
```

### 2) 환경 변수 설정

`.env.local`에 아래 값을 설정합니다.

```env
NOTION_TOKEN=
NOTION_DATA_SOURCE_ID=
NOTION_DATABASE_ID=
```

### 3) 개발 서버 실행

```bash
npm run dev
```

## 9. 트러블슈팅 / 회고 포인트

### 1) Notion API 응답 비용 관리

- 문제: 블로그 목록과 상세 페이지가 모두 외부 CMS 응답 속도에 영향을 받았습니다.
- 해결: 서버 캐시(`unstable_cache`)를 적용하고, 글 작성 이후에는 캐시 태그를 기준으로 갱신하도록 구성했습니다.
- 결과: 동일 조건 재요청에서 불필요한 Notion API 호출을 줄이고, 운영 시 응답 안정성을 높일 수 있었습니다.

### 2) 긴 기술 글의 탐색성 부족

- 문제: 글이 길어질수록 원하는 섹션으로 바로 이동하기 어려웠습니다.
- 해결: 헤딩 기반 TOC를 자동 생성하고, 모바일/데스크톱 환경에 맞게 다른 UI로 제공했습니다.
- 결과: 별도의 수동 목차 관리 없이 긴 글에서도 탐색 흐름을 유지할 수 있게 되었습니다.

### 3) 포스트 공유 시 메타데이터 일관성 부족

- 문제: 기본 메타데이터만으로는 포스트별 제목과 설명이 검색/공유 결과에 충분히 반영되지 않았습니다.
- 해결: 포스트 단위 `generateMetadata`와 동적 OG 이미지 생성을 추가했습니다.
- 결과: 문서별 맥락이 검색 결과와 공유 미리보기에도 그대로 노출되도록 개선했습니다.
