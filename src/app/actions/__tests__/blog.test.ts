import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPostAction, type PostFormState } from '@/app/actions/blog';
import { createPost } from '@/lib/notion';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

vi.mock('@/lib/notion', () => ({
  createPost: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

const initialState: PostFormState = { message: '' };

// FormData 생성 헬퍼
function makeFormData(title: string, tag: string, content: string): FormData {
  const fd = new FormData();
  fd.set('title', title);
  fd.set('tag', tag);
  fd.set('content', content);
  return fd;
}

describe('createPostAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('제목 누락 시 errors.title와 메시지 반환', async () => {
    const result = await createPostAction(
      initialState,
      makeFormData('', '기술', '충분한 내용입니다 hello world test')
    );
    expect(result.errors?.title).toBeDefined();
    expect(result.errors?.title?.length).toBeGreaterThan(0);
    expect(result.message).toBe('입력 값을 확인해주세요.');
  });

  it('태그 누락 시 errors.tag와 메시지 반환', async () => {
    const result = await createPostAction(
      initialState,
      makeFormData('테스트 제목', '', '충분한 내용입니다 hello world test')
    );
    expect(result.errors?.tag).toBeDefined();
    expect(result.errors?.tag?.length).toBeGreaterThan(0);
    expect(result.message).toBe('입력 값을 확인해주세요.');
  });

  it('내용 10자 미만 시 errors.content와 메시지 반환', async () => {
    const result = await createPostAction(
      initialState,
      makeFormData('테스트 제목', '기술', '짧음')
    );
    expect(result.errors?.content).toBeDefined();
    expect(result.errors?.content?.length).toBeGreaterThan(0);
    expect(result.message).toBe('입력 값을 확인해주세요.');
  });

  it('유효한 입력 시 createPost 호출 및 redirect("/") 실행', async () => {
    vi.mocked(createPost).mockResolvedValueOnce(undefined as never);

    await createPostAction(
      initialState,
      makeFormData('테스트 제목', '기술', '충분한 내용입니다 hello world test')
    );

    expect(createPost).toHaveBeenCalledWith({
      title: '테스트 제목',
      tag: '기술',
      content: '충분한 내용입니다 hello world test',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('createPost throw 시 실패 메시지 반환', async () => {
    vi.mocked(createPost).mockRejectedValueOnce(new Error('Notion API 오류'));

    const result = await createPostAction(
      initialState,
      makeFormData('테스트 제목', '기술', '충분한 내용입니다 hello world test')
    );

    expect(result.message).toBe('블로그 포스트 생성에 실패했습니다.');
    expect(result.success).toBeUndefined();
    expect(redirect).not.toHaveBeenCalled();
  });
});
