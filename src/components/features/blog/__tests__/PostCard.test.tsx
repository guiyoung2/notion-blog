import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { Post } from '@/types/blog';
import { PostCard } from '../PostCard';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const mockPost: Post = {
  id: 'post-1',
  slug: 'test-post',
  title: 'TypeScript 활용법',
  description: 'TypeScript를 활용하는 방법을 알아봅니다.',
  tags: ['TypeScript', 'JavaScript'],
  coverImage: '/images/cover.jpg',
};

describe('PostCard', () => {
  it('제목이 화면에 표시됨', () => {
    render(<PostCard post={mockPost} />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'TypeScript 활용법' })
    ).toBeInTheDocument();
  });

  it('태그가 화면에 표시됨', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('description이 화면에 표시됨', () => {
    render(<PostCard post={mockPost} />);
    expect(
      screen.getByText('TypeScript를 활용하는 방법을 알아봅니다.')
    ).toBeInTheDocument();
  });

  it('description 없으면 표시 안 됨', () => {
    const postWithoutDesc: Post = { ...mockPost, description: undefined };
    render(<PostCard post={postWithoutDesc} />);
    expect(
      screen.queryByText('TypeScript를 활용하는 방법을 알아봅니다.')
    ).not.toBeInTheDocument();
  });
});
