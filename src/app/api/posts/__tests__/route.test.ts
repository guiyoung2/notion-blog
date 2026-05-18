import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/posts/route';
import { getPublishedPosts } from '@/lib/notion';
import type { GetPublishedPostsResponse } from '@/lib/notion';

vi.mock('@/lib/notion', () => ({
  getPublishedPosts: vi.fn(),
}));

const mockResponse: GetPublishedPostsResponse = {
  posts: [],
  hasMore: false,
  nextCursor: null,
};

describe('GET /api/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublishedPosts).mockResolvedValue(mockResponse);
  });

  it('tag 파라미터가 getPublishedPosts에 전달됨', async () => {
    const req = new NextRequest('http://localhost/api/posts?tag=기술');
    await GET(req);
    expect(getPublishedPosts).toHaveBeenCalledWith(
      expect.objectContaining({ tag: '기술' })
    );
  });

  it('sort 파라미터가 getPublishedPosts에 전달됨', async () => {
    const req = new NextRequest('http://localhost/api/posts?sort=oldest');
    await GET(req);
    expect(getPublishedPosts).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'oldest' })
    );
  });

  it('pageSize가 숫자로 파싱되어 전달됨', async () => {
    const req = new NextRequest('http://localhost/api/posts?pageSize=5');
    await GET(req);
    expect(getPublishedPosts).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 5 })
    );
  });

  it('pageSize 미입력 시 undefined 전달', async () => {
    const req = new NextRequest('http://localhost/api/posts');
    await GET(req);
    expect(getPublishedPosts).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: undefined })
    );
  });

  it('공백만 있는 q는 undefined로 정규화', async () => {
    const req = new NextRequest('http://localhost/api/posts?q=%20%20%20');
    await GET(req);
    expect(getPublishedPosts).toHaveBeenCalledWith(
      expect.objectContaining({ query: undefined })
    );
  });

  it('유효한 q는 trim 후 전달됨', async () => {
    const req = new NextRequest('http://localhost/api/posts?q=Next.js');
    await GET(req);
    expect(getPublishedPosts).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'Next.js' })
    );
  });

  it('startCursor 파라미터가 getPublishedPosts에 전달됨', async () => {
    const req = new NextRequest('http://localhost/api/posts?startCursor=abc123');
    await GET(req);
    expect(getPublishedPosts).toHaveBeenCalledWith(
      expect.objectContaining({ startCursor: 'abc123' })
    );
  });

  it('응답이 getPublishedPosts 반환값을 JSON으로 포함', async () => {
    const req = new NextRequest('http://localhost/api/posts');
    const response = await GET(req);
    const data = await response.json();
    expect(data).toEqual(mockResponse);
  });
});
