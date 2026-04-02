import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import Providers from '@/app/providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | guiyoung의 개발 블로그',
    default: 'guiyoung의 개발 블로그',
  },
  description: 'guiyoung의 개발 블로그',
  keywords: ['Next.js', '프론트엔드', '웹개발', '코딩', '프로그래밍', '리액트'],
  authors: [{ name: 'guiyoung', url: 'https://github.com/guiyoung2' }],
  creator: 'guiyoung',
  publisher: 'guiyoung',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  metadataBase: new URL('https://notion-blog-rose-phi.vercel.app/'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'guiyoung의 개발 블로그',
    description: 'guiyoung의 개발 블로그',
    images: ['/thumbnail.jpg'],
  },
  other: {
    google: 'notranslate',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="scroll-smooth"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            {/* Header 영역 */}
            <Header />
            {/* Main 영역 */}
            <main className="flex-1">{children}</main>

            {/* Footer 영역 */}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
