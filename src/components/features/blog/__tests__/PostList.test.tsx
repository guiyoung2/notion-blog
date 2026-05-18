import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { server } from '@/test/mocks/server';
import type { Post } from '@/types/blog';
import type { GetPublishedPostsResponse } from '@/lib/notion';
import PostList from '../PostList.client';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockPosts: Post[] = [
  { id: '1', slug: 'first-post', title: '첫 번째 포스트', tags: ['기술'] },
  { id: '2', slug: 'second-post', title: '두 번째 포스트', tags: ['React'] },
];

describe('PostList', () => {
  it('API 응답 포스트가 화면에 렌더됨', async () => {
    server.use(
      http.get('/api/posts', () => {
        const response: GetPublishedPostsResponse = {
          posts: mockPosts,
          hasMore: false,
          nextCursor: null,
        };
        return HttpResponse.json(response);
      })
    );

    render(<PostList />);

    expect(await screen.findByText('첫 번째 포스트')).toBeInTheDocument();
    expect(await screen.findByText('두 번째 포스트')).toBeInTheDocument();
  });
});
