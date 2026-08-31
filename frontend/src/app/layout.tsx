import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { PageContainer } from '@/components/layout/PageContainer';

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const displayFont = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BALLON PRO — Football Transfer Intelligence & Valuation Platform',
  description:
    'Explore player performance, live transfer market signals, and machine-learning transfer fee valuations.',
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
    <html
      lang="en"
      className={`dark ${sansFont.variable} ${displayFont.variable} ${monoFont.variable}`}
      suppressHydrationWarning
    >
      <body
        className="antialiased min-h-screen bg-[#07080c] text-[#f1f5f9] font-sans overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-200"
        suppressHydrationWarning
      >
        {/* Ambient atmospheric glow elements */}
        <div className="fixed top-0 left-1/4 w-[600px] h-[350px] bg-cyan-500/5 blur-[140px] pointer-events-none rounded-full" />
        <div className="fixed top-1/3 right-10 w-[500px] h-[400px] bg-emerald-500/5 blur-[160px] pointer-events-none rounded-full" />
        <div className="fixed bottom-10 left-10 w-[450px] h-[350px] bg-amber-500/3 blur-[140px] pointer-events-none rounded-full" />

        <Navbar />
        <main className="relative z-10">
          <PageContainer>{children}</PageContainer>
        </main>
      </body>
    </html>
  );
}
