import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import DrawerWrapper from '@/components/DrawerWrapper';
import { AuthProvider } from '@/context/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Alpha Signal App',
  description: 'AI 기반 투자 시그널 앱',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-gray-50 min-h-screen flex justify-center`}>
        <AuthProvider>
          <DrawerWrapper>{children}</DrawerWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}