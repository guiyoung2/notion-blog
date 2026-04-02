import { Client } from '@notionhq/client';
import { unstable_cache } from 'next/cache';
import type { Post, TagFilterItem } from '@/types/blog';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionToMarkdown } from 'notion-to-md';

type UserWithName = { name?: string | null };

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const n2m = new NotionToMarkdown({
  notionClient: notion,
  config: { parseChildPages: false },
});

function getCoverImage(cover: PageObjectResponse['cover']): string {
  if (!cover) return '';
  switch (cover.type) {
    case 'external':
      return cover.external.url;
    case 'file':
      return cover.file.url;
    default:
      return '';
  }
}

function getPostMetadata(page: PageObjectResponse): Post {
  const { properties } = page;

  return {
    id: page.id,
    title: properties.Title.type === 'title' ? (properties.Title.title[0]?.plain_text ?? '') : '',
    description:
      properties.Description.type === 'rich_text'
        ? (properties.Description.rich_text[0]?.plain_text ?? '')
        : '',
    coverImage: getCoverImage(page.cover),
    tags:
      properties.Tags.type === 'multi_select'
        ? properties.Tags.multi_select.map((tagItem) => tagItem.name)
        : [],
    author:
      properties.Author.type === 'people'
        ? ((properties.Author.people[0] as UserWithName | undefined)?.name ?? '')
        : '',
    date: properties.Date.type === 'date' ? (properties.Date.date?.start ?? '') : '',
    modifiedDate: page.last_edited_time,
    slug:
      properties.Slug.type === 'rich_text'
        ? (properties.Slug.rich_text[0]?.plain_text ?? page.id)
        : page.id,
  };
}

async function getChildPageLinks(pageId: string): Promise<string> {
  const blocks = await notion.blocks.children.list({ block_id: pageId });
  const links = blocks.results
    .filter(
      (block): block is Extract<(typeof blocks.results)[number], { type: 'child_page' }> =>
        'type' in block && block.type === 'child_page'
    )
    .map((block) => `[📄 ${block.child_page.title}](/blog/${block.id})`);

  return links.join('\n\n');
}

async function buildPageMarkdown(pageId: string): Promise<string> {
  const [mdblocks, childPageLinks] = await Promise.all([
    n2m.pageToMarkdown(pageId),
    getChildPageLinks(pageId),
  ]);

  const { parent } = n2m.toMarkdownString(mdblocks);
  return [parent, childPageLinks].filter(Boolean).join('\n\n');
}

export const getPostBySlug = async (
  slug: string
): Promise<{ markdown: string; post: Post | null }> => {
  const response = await notion.dataSources.query({
    data_source_id: process.env.NOTION_DATA_SOURCE_ID!,
    filter: {
      and: [
        {
          property: 'Slug',
          rich_text: {
            equals: slug,
          },
        },
        {
          property: 'Status',
          select: {
            equals: 'Published',
          },
        },
      ],
    },
  });

  if (response.results[0]) {
    const pageId = response.results[0].id;
    const markdown = await buildPageMarkdown(pageId);

    return {
      markdown,
      post: getPostMetadata(response.results[0] as PageObjectResponse),
    };
  }

  // 폴백: slug가 하위 페이지의 page ID인 경우
  return getChildPage(slug);
};

async function getChildPage(
  pageId: string
): Promise<{ markdown: string; post: Post | null }> {
  try {
    const page = (await notion.pages.retrieve({ page_id: pageId })) as PageObjectResponse;
    const parent = await buildPageMarkdown(pageId);

    // 하위 페이지의 title 프로퍼티 추출
    const titleProp = Object.values(page.properties).find((p) => p.type === 'title');
    const title =
      titleProp?.type === 'title' ? (titleProp.title[0]?.plain_text ?? '제목 없음') : '제목 없음';

    return {
      markdown: parent,
      post: {
        id: page.id,
        title,
        description: '',
        coverImage: getCoverImage(page.cover),
        tags: [],
        author: '',
        date: page.created_time,
        modifiedDate: page.last_edited_time,
        slug: page.id,
      },
    };
  } catch {
    return { markdown: '', post: null };
  }
}

export interface GetPublishedPostsParams {
  tag?: string;
  sort?: string;
  pageSize?: number;
  startCursor?: string;
}

export interface GetPublishedPostsResponse {
  posts: Post[];
  hasMore: boolean;
  nextCursor: string | null;
}

export const getPublishedPosts = unstable_cache(
  async ({
    tag = '전체',
    sort = 'latest',
    pageSize = 4,
    startCursor,
  }: GetPublishedPostsParams = {}): Promise<GetPublishedPostsResponse> => {
    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_DATA_SOURCE_ID!,
      filter: {
        property: 'Status',
        select: {
          equals: 'Published',
        },
      },
      sorts: [
        {
          property: 'Date',
          direction: sort === 'latest' ? 'descending' : 'ascending',
        },
      ],
      page_size: pageSize,
      start_cursor: startCursor,
    });

    const allPosts = response.results
      .filter((page): page is PageObjectResponse => 'properties' in page)
      .map(getPostMetadata);

    const posts =
      !tag || tag === '전체'
        ? allPosts
        : allPosts.filter((post) => post.tags?.includes(tag));

    return {
      posts,
      hasMore: response.has_more,
      nextCursor: response.next_cursor,
    };
  },
  ['posts'],
  {
    tags: ['posts'],
  }
);

export const getTags = async (): Promise<TagFilterItem[]> => {
  const { posts } = await getPublishedPosts({ pageSize: 100 });

  // 모든 태그를 추출하고 각 태그의 출현 횟수를 계산
  const tagCount = posts.reduce(
    (acc, post) => {
      post.tags?.forEach((tagItem) => {
        acc[tagItem] = (acc[tagItem] || 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );

  // TagFilterItem 형식으로 변환
  const tags: TagFilterItem[] = Object.entries(tagCount).map(([name, count]) => ({
    id: name,
    name,
    count,
  }));

  // "전체" 태그 추가
  tags.unshift({
    id: 'all',
    name: '전체',
    count: posts.length,
  });

  // 태그 이름 기준으로 정렬 ("전체" 태그는 항상 첫 번째에 위치하도록 제외)
  const [allTag, ...restTags] = tags;
  const sortedTags = restTags.sort((a, b) => a.name.localeCompare(b.name));

  return [allTag, ...sortedTags];
};

export interface CreatePostParams {
  title: string;
  tag: string;
  content: string;
}

export const createPost = async ({ title, tag, content }: CreatePostParams) => {
  const response = await notion.pages.create({
    parent: {
      database_id: process.env.NOTION_DATABASE_ID!,
    },
    properties: {
      Title: {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      },
      Description: {
        rich_text: [
          {
            text: {
              content: content,
            },
          },
        ],
      },
      Tags: {
        multi_select: [{ name: tag }],
      },
      Status: {
        select: {
          name: 'Published',
        },
      },
      Date: {
        date: {
          start: new Date().toISOString(),
        },
      },
    },
  });

  return response;
};
