'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BlogSearchProps {
  /** URL `q`와 동기화되는 초기값 (서버에서 전달) */
  initialQuery: string;
}

export default function BlogSearch({ initialQuery }: BlogSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : '/');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-lg items-center gap-2"
      role="search"
      aria-label="블로그 제목·요약 검색"
    >
      <Input
        type="search"
        placeholder="제목·요약 검색"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="min-w-0 flex-1"
        autoComplete="off"
        enterKeyHint="search"
      />
      <Button type="submit" variant="secondary" className="shrink-0">
        <Search className="size-4 sm:mr-1.5" aria-hidden />
        <span className="hidden sm:inline">검색</span>
      </Button>
    </form>
  );
}
