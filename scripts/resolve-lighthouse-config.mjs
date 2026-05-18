/* eslint-disable no-console */
// Lighthouse CI 측정용 config 생성 — 동적 상세 페이지 URL 주입
//
// lighthouserc.json(정적 베이스)을 읽어, 배포본 /api/posts에서 실제 발행된
// 글 slug를 받아 /blog/<slug> URL을 추가한 lighthouserc.generated.json을 만든다.
// slug를 정적 config에 박으면 글 삭제 시 깨지므로 런타임에 해석한다.

import { readFile, writeFile } from 'node:fs/promises';

const BASE_CONFIG_PATH = 'lighthouserc.json';
const GENERATED_CONFIG_PATH = 'lighthouserc.generated.json';

// 베이스 config를 읽어 파싱
async function readBaseConfig() {
  const raw = await readFile(BASE_CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

// 배포 origin에서 첫 발행 글 slug 조회 (실패 시 null)
async function fetchSampleSlug(origin) {
  try {
    const res = await fetch(`${origin}/api/posts`);
    if (!res.ok) {
      console.warn(`[resolve-lighthouse-config] /api/posts 응답 실패: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const slug = data?.posts?.[0]?.slug;

    if (typeof slug !== 'string' || slug.length === 0) {
      console.warn('[resolve-lighthouse-config] 발행된 글이 없어 상세 페이지를 건너뜁니다.');
      return null;
    }

    return slug;
  } catch (error) {
    console.warn(`[resolve-lighthouse-config] slug 조회 중 오류: ${String(error)}`);
    return null;
  }
}

// generated config 생성 — 상세 페이지 URL을 url 목록에 추가
async function generateConfig() {
  const config = await readBaseConfig();
  const urls = config?.ci?.collect?.url;

  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error('lighthouserc.json에 ci.collect.url 배열이 없습니다.');
  }

  const origin = new URL(urls[0]).origin;
  const slug = await fetchSampleSlug(origin);

  if (slug) {
    const detailUrl = `${origin}/blog/${slug}`;
    if (!urls.includes(detailUrl)) {
      urls.push(detailUrl);
    }
    console.log(`[resolve-lighthouse-config] 상세 페이지 추가: ${detailUrl}`);
  }

  await writeFile(GENERATED_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
  console.log(`[resolve-lighthouse-config] ${GENERATED_CONFIG_PATH} 생성 완료 (URL ${urls.length}개)`);
}

generateConfig().catch((error) => {
  console.error(`[resolve-lighthouse-config] 실패: ${String(error)}`);
  process.exit(1);
});
