import type { NextConfig } from 'next';
import createMDX from '@next/mdx';
import bundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        hostname: 'picsum.photos',
      },
      {
        hostname: 'images.unsplash.com',
      },
      {
        hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com',
      },
      {
        hostname: 'www.notion.so',
      },
      {
        hostname: 'app.notion.com',
      },
      {
        hostname: 'secure.notion-static.com',
      },
    ],
  },
  pageExtensions: ['ts', 'tsx', 'jsx', 'js', 'md', 'mdx'],
};

const withMDX = createMDX({
  // 필요한 마크다운 플러그인을 추가할 수 있음
  options: {
    // remarkPlugins: [remarkGfm],
    remarkPlugins: [['remark-gfm']],
  },
});

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});

export default withBundleAnalyzer(withMDX(nextConfig));
