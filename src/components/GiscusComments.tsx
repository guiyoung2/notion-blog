'use client';

import Giscus from '@giscus/react';
import { useTheme } from 'next-themes';

export default function GiscusComments() {
  const { theme } = useTheme();
  return (
    <Giscus
      repo="guiyoung2/notion-blog"
      repoId="R_kgDORqwrbw"
      category="Announcements"
      category-id="DIC_kwDORqwrb84C52g6"
      mapping="pathname"
      strict="0"
      reactions-enabled="1"
      emit-metadata="0"
      input-position="top"
      theme={theme === 'dark' ? 'dark' : 'light'}
      lang="ko"
    />
  );
}
