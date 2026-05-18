# notion-blog — 프로젝트 가드레일

하네스(`value_refactor` 워크플로)의 각 step이 가드레일로 주입하는 프로젝트 규칙 문서다.

## 프로젝트 개요

Notion을 CMS로 활용하는 개인 기술 블로그. Notion 데이터베이스의 페이지를 블로그 포스트로 매핑하고, `notion-to-md` + MDX로 본문을 렌더한다.

- **배포**: Vercel — https://notion-blog-rose-phi.vercel.app
- **저장소**: https://github.com/guiyoung2/notion-blog

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, RSC) |
| 언어 | TypeScript 5 |
| 패키지 매니저 | **pnpm** (`pnpm-lock.yaml`) |
| 데이터 페칭 | TanStack Query 5 + `unstable_cache`(태그 무효화) |
| CMS | Notion API (`@notionhq/client`) + `notion-to-md` + MDX |
| UI | Tailwind CSS 4 + shadcn/ui + Radix UI |
| 검증 | Zod 4 (서버 액션 입력 검증) |
| 댓글 | Giscus |

## 디렉터리 구조

```
src/
├── app/                  App Router 페이지·API route·server action
│   ├── page.tsx          홈
│   ├── blog/             블로그 목록·상세(/blog, /blog/[slug])·작성(/blog/write)
│   ├── about/            소개 페이지
│   ├── actions/blog.ts   서버 액션 (createPostAction)
│   └── api/posts/route.ts  포스트 목록 Route Handler
├── components/           공통 UI · 블로그 기능 컴포넌트
├── lib/                  notion.ts(Notion 연동), date.ts, utils.ts
└── types/                blog 관련 타입
```

## 핵심 규칙

- **`any` 금지.** 타입을 정확히 명시한다.
- 모든 변경 후 `npx tsc -b` 타입 에러 0, `pnpm build` 성공, `pnpm lint` 경고 0을 유지한다.
- 패키지 명령은 **pnpm**을 쓴다 (`pnpm install`, `pnpm build`, `pnpm dev`).
- Notion API 호출은 서버 전용이다. 클라이언트 컴포넌트에서 직접 호출하지 않는다.
- 외과적 변경: 요청과 무관한 코드·주석·포맷팅을 임의로 바꾸지 않는다.

## 추가 규칙

상세 규칙은 `.claude/rules/`를 따른다.

- `git-commit-convention.md` — 커밋 메시지 형식(`feat.`/`fix.`/`refactor.`), 커밋 후 `git push`, Co-Authored-By 미사용.
- `karpathy-guidelines.md` — 가정 명시·단순함 우선·외과적 변경·목표 기반 실행.
