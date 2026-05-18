import { http, HttpResponse } from 'msw';
import type { GetPublishedPostsResponse } from '@/lib/notion';

// GET /api/posts 목 핸들러
export const handlers = [
  http.get('/api/posts', () => {
    const response: GetPublishedPostsResponse = {
      posts: [],
      hasMore: false,
      nextCursor: null,
    };
    return HttpResponse.json(response);
  }),
];
