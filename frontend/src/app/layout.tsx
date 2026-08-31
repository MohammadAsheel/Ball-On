import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { PageContainer } from '@/components/layout/PageContainer';

export const metadata: Metadata = {
  title: 'BALLON PRO — Football Transfer Intelligence',
  description:
    'Explore player performance, historical transfers, and machine-learning transfer fee valuations.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-[#080808] text-[#f0f0f0] font-sans overflow-x-hidden" suppressHydrationWarning>
        <Navbar />
        <main>
          <PageContainer>{children}</PageContainer>
        </main>
      </body>
    </html>
  );
}
