import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter, useSearchParams } from 'next/navigation';
import BlogSearch from '../BlogSearch';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('BlogSearch', () => {
  const mockPush = vi.fn();

  // next/navigation 모킹 헬퍼
  function setupNavigation(params = new URLSearchParams()) {
    vi.mocked(useRouter).mockReturnValue(
      { push: mockPush } as unknown as ReturnType<typeof useRouter>
    );
    vi.mocked(useSearchParams).mockReturnValue(
      params as unknown as ReturnType<typeof useSearchParams>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    setupNavigation();
  });

  it('initialQuery가 입력 초기값에 반영됨', () => {
    render(<BlogSearch initialQuery="Next.js" />);
    expect(screen.getByDisplayValue('Next.js')).toBeInTheDocument();
  });

  it('검색어 입력 후 폼 제출 시 q 쿼리 포함 URL로 push 호출', async () => {
    const user = userEvent.setup();
    render(<BlogSearch initialQuery="" />);
    await user.type(screen.getByRole('searchbox'), 'TypeScript');
    await user.click(screen.getByRole('button'));
    expect(mockPush).toHaveBeenCalledWith('/?q=TypeScript');
  });

  it('빈 검색어 제출 시 q 없이 push 호출', async () => {
    const user = userEvent.setup();
    render(<BlogSearch initialQuery="" />);
    await user.click(screen.getByRole('button'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
