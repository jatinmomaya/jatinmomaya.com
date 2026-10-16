import type { Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import ConditionalHeader from '../components/ConditionalHeader';
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConditionalHeader />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
