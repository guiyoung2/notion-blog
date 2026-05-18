import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getPostBySlug } from '@/lib/notion';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypePrettyCode from 'rehype-pretty-code';
import { ChildPageLink } from '@/components/features/blog/ChildPageCard';
import { compile } from '@mdx-js/mdx';
import withSlugs from 'rehype-slug';
import withToc from '@stefanprobst/rehype-extract-toc';
import withTocExport from '@stefanprobst/rehype-extract-toc/mdx';
import { notFound } from 'next/navigation';
import { getPublishedPosts } from '@/lib/notion';
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await getPostBySlug(slug);

  if (!post) {
    return {
      title: '포스트를 찾을 수 없습니다',
      description: '요청하신 블로그 포스트를 찾을 수 없습니다.',
    };
  }

  return {
    title: post.title,
    description: post.description || `${post.title} - guiyoung의 개발 블로그`,
    keywords: post.tags,
    authors: [{ name: post.author || 'guiyoung' }],
    publisher: 'guiyoung',
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.modifiedDate,
      authors: post.author || 'guiyoung',
      tags: post.tags,
    },
  };
}

interface TocEntry {
  value: string;
  depth: number;
  id?: string;
  children?: Array<TocEntry>;
}

type Toc = Array<TocEntry>;

// 빌드 타임 Notion API 실패 시 동적 렌더로 폴백
export const generateStaticParams = async () => {
  try {
    const { posts } = await getPublishedPosts();
    return posts.map((post) => ({
      slug: post.slug,
    }));
  } catch {
    return [];
  }
};

export const revalidate = 60;

function TableOfContentsLink({ item }: { item: TocEntry }) {
  return (
    <div className="space-y-2">
      <Link
        key={item.id}
        href={`#${item.id}`}
        className={`hover:text-foreground text-muted-foreground block font-medium transition-colors`}
      >
        {item.value}
      </Link>
      {item.children && item.children.length > 0 && (
        <div className="space-y-2 pl-4">
          {item.children.map((subItem) => (
            <TableOfContentsLink key={subItem.id} item={subItem} />
          ))}
        </div>
      )}
    </div>
  );
}

interface BlogPostProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPost({ params }: BlogPostProps) {
  const { slug } = await params;
  const { markdown, post } = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // TOC 추출 전용: rehypeSanitize가 id 속성을 제거하므로 제외
  const { data } = await compile(markdown, {
    rehypePlugins: [withSlugs, withToc, withTocExport],
  });

  const toc = (data as { toc?: Toc }).toc ?? [];

  return (
    <div className="container py-6 md:py-8 lg:py-12">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr_240px] md:gap-8">
        <aside className="hidden md:block">{/* 추후 콘텐츠 추가 */}</aside>
        <section className="min-w-0">
          {/* 블로그 헤더 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                {post.tags?.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <h1 className="text-3xl font-bold md:text-4xl">{post.title}</h1>
            </div>

            {/* 메타 정보 */}
            {/* <div className="text-muted-foreground flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                <span>{formatDate(post.date)}</span>
              </div>
            </div> */}
          </div>

          <Separator className="my-8" />

          {/* 모바일 전용 목차 */}
          <div className="sticky top-(--sticky-top) mb-6 md:hidden">
            <details className="bg-muted/60 rounded-lg p-4 backdrop-blur-sm">
              <summary className="cursor-pointer text-lg font-semibold">목차</summary>
              <nav className="mt-3 space-y-3 text-sm">
                {data?.toc?.map((item) => (
                  <TableOfContentsLink key={item.id} item={item} />
                ))}
              </nav>
            </details>
          </div>

          {/* 블로그 본문 */}
          <div className="prose prose-neutral dark:prose-invert prose-headings:scroll-mt-(--header-height) max-w-none">
            <MDXRemote
              source={markdown}
              components={{ a: ChildPageLink }}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [rehypeSanitize, rehypePrettyCode, withSlugs],
                },
              }}
            />
          </div>

          <Separator className="my-16" />

          {/* Giscus 댓글 */}
          {/* <GiscusComments /> */}
        </section>
        <aside className="relative hidden md:block">
          <div className="sticky top-(--sticky-top)">
            <div className="bg-muted/60 space-y-4 rounded-lg p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold">목차</h3>
              <nav className="space-y-3 text-sm">
                {toc.map((item) => (
                  <TableOfContentsLink key={item.id} item={item} />
                ))}
              </nav>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
