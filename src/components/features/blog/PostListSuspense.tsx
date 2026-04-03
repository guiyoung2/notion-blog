'use client';

import Link from 'next/link';
import { PostCard } from '@/components/features/blog/PostCard';
import { Loader2 } from 'lucide-react';
import { GetPublishedPostsResponse, POSTS_LOAD_MORE_PAGE_SIZE } from '@/lib/notion';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { use, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

interface PostListProps {
  postsPromise: Promise<GetPublishedPostsResponse>;
}

export default function PostList({ postsPromise }: PostListProps) {
  const initialData = use(postsPromise);
  const searchParams = useSearchParams();
  const tag = searchParams.get('tag');
  const sort = searchParams.get('sort');
  const q = searchParams.get('q');

  const fetchPosts = async ({ pageParam }: { pageParam: string | undefined }) => {
    const params = new URLSearchParams();
    if (tag) params.set('tag', tag);
    if (sort) params.set('sort', sort);
    if (q) params.set('q', q);
    params.set('pageSize', String(POSTS_LOAD_MORE_PAGE_SIZE));
    if (pageParam) params.set('startCursor', pageParam);

    const response = await fetch(`/api/posts?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    return response.json();
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['posts', tag, sort, q ?? '', 'infinite', POSTS_LOAD_MORE_PAGE_SIZE],
    queryFn: fetchPosts,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: {
      pages: [initialData],
      pageParams: [undefined],
    },
  });

  const { ref, inView } = useInView({
    threshold: 1,
  });
  // 더보기 버튼으로 구현하는 방식
  //   const handleLoadMore = () => {
  //     if (hasNextPage && !isFetchingNextPage) {
  //       fetchNextPage();
  //     }
  //   };
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {allPosts.map((post, index) => (
          <Link href={`/blog/${post.slug}`} key={post.id}>
            {/* 검색 중에는 priority preload를 사용하지 않아 불일치 경고 방지 */}
            <PostCard post={post} isFirst={index === 0 && !q} />
          </Link>
        ))}
      </div>
      {hasNextPage && !isFetchingNextPage && <div ref={ref} className="h-10"></div>}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          <span className="text-muted-foreground text-sm">로딩중...</span>
        </div>
      )}
      {/*  더보기 버튼으로 구현하는 방식 */}
      {/* {hasNextPage && (
        <div>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? '로딩중...' : '더보기'}
          </Button>
        </div>
      )} */}
    </div>
  );
}
