import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter, useSearchParams } from 'next/navigation';
import SortSelect from '../SortSelect';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('SortSelect', () => {
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

  it('기본 정렬값(최신순)이 선택 상태로 표시됨', () => {
    render(<SortSelect />);
    expect(screen.getByRole('combobox')).toHaveTextContent('최신순');
  });

  it('sort=oldest 쿼리값이 선택 상태(오래된순)로 표시됨', () => {
    setupNavigation(new URLSearchParams('sort=oldest'));
    render(<SortSelect />);
    expect(screen.getByRole('combobox')).toHaveTextContent('오래된순');
  });

  it('정렬 옵션 변경 시 sort 쿼리 포함 URL로 push 호출', async () => {
    const user = userEvent.setup();
    render(<SortSelect />);
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: '오래된순' }));
    expect(mockPush).toHaveBeenCalledWith('?sort=oldest');
  });
});
