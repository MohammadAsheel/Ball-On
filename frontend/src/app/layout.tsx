import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { PageContainer } from '@/components/layout/PageContainer';
import { ThemeProvider } from '@/context/ThemeContext';
import { BottomNav } from '@/components/layout/BottomNav';
import { TopScoresTicker } from '@/components/layout/TopScoresTicker';

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
      data-theme="dark"
      className={`dark ${sansFont.variable} ${displayFont.variable} ${monoFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('ballon-theme');
                if (stored === 'light') {
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className="antialiased min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-200 transition-colors duration-300"
        suppressHydrationWarning
      >
        {/* Ambient atmospheric glow elements */}
        <div className="fixed top-0 left-1/4 w-[600px] h-[350px] bg-[var(--glow-1)] blur-[140px] pointer-events-none rounded-full transition-colors duration-500" />
        <div className="fixed top-1/3 right-10 w-[500px] h-[400px] bg-[var(--glow-2)] blur-[160px] pointer-events-none rounded-full transition-colors duration-500" />
        <div className="fixed bottom-10 left-10 w-[450px] h-[350px] bg-[var(--glow-3)] blur-[140px] pointer-events-none rounded-full transition-colors duration-500" />

        <ThemeProvider>
          <TopScoresTicker />
          <Navbar />
          <main className="relative z-10 pb-20 sm:pb-24">
            <PageContainer>{children}</PageContainer>
          </main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}


