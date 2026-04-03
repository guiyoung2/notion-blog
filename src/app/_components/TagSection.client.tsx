'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { TagFilterItem } from '@/types/blog';
import { cn } from '@/lib/utils';
import { use } from 'react';
import { useSearchParams } from 'next/navigation';

interface TagSectionProps {
  tags: Promise<TagFilterItem[]>;
  selectedTag: string;
}

export default function TagSection({ tags, selectedTag }: TagSectionProps) {
  const allTags = use(tags);
  const searchParams = useSearchParams();

  const hrefForTag = (name: string) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('tag', name);
    // 태그 변경 시 검색어 초기화
    p.delete('q');
    return `?${p.toString()}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>태그 목록</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {allTags.map((tag) => (
            <Link href={hrefForTag(tag.name)} key={tag.name}>
              <div
                className={cn(
                  'hover:bg-muted-foreground/10 text-muted-foreground flex items-center justify-between rounded-md p-1.5 text-sm transition-colors',
                  selectedTag === tag.name && 'bg-muted-foreground/10 text-foreground font-medium'
                )}
              >
                <span>{tag.name}</span>
                <span>{tag.count}</span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
