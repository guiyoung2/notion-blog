import Link from 'next/link';
import { FileText, ChevronRight } from 'lucide-react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

function isChildPageLink(children: ReactNode): boolean {
  if (typeof children === 'string') return children.startsWith('📄');
  if (Array.isArray(children) && typeof children[0] === 'string') return children[0].startsWith('📄');
  return false;
}

function getChildPageTitle(children: ReactNode): string {
  const text = typeof children === 'string' ? children : Array.isArray(children) ? children.join('') : '';
  return text.replace(/^📄\s*/, '');
}

export function ChildPageLink({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href && isChildPageLink(children)) {
    const title = getChildPageTitle(children);
    return (
      <Link href={href} className="not-prose group my-3 block no-underline">
        <span className="border-border bg-card hover:bg-muted flex items-center gap-3 rounded-lg border p-4 transition-colors">
          <FileText className="text-primary h-5 w-5 shrink-0" />
          <span className="group-hover:text-primary flex-1 font-medium transition-colors">
            {title}
          </span>
          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    );
  }

  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
