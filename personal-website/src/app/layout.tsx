import type { Viewport } from 'next';
import { Caveat } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import ConditionalHeader from '../components/ConditionalHeader';
import "./globals.css";

// Handwriting for captions and tape labels. Self-hosted at build time.
const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-caveat',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={caveat.variable}>
      <body>
        <ConditionalHeader />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
