import BlogSearch from './BlogSearch';
// import SortSelect from './SortSelect';

interface HeaderSectionProps {
  selectedTag: string;
  /** URL `q` 검색어 (없으면 빈 문자열) */
  searchQuery: string;
}

export default function HeaderSection({ selectedTag, searchQuery }: HeaderSectionProps) {
  const trimmedQ = searchQuery.trim();
  const title = selectedTag === '전체' ? '블로그 목록' : `${selectedTag} 관련 글`;

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-0.5">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {trimmedQ && (
          <p className="text-muted-foreground truncate text-sm">
            <span className="text-foreground font-medium">&ldquo;{trimmedQ}&rdquo;</span> 검색 결과
          </p>
        )}
      </div>
      <BlogSearch initialQuery={searchQuery} />
      {/* 최신, 오래된순 정렬 기능*/}
      {/* <SortSelect /> */}
    </div>
  );
}
