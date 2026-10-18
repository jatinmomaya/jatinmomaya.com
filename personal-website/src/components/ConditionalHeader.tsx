'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

// The plain page chrome, loaded only where it is shown (the resume). The
// shelf and the trips page have their own full-screen layouts, so it never
// loads there.
const Header = dynamic(() => import('./Header'), { ssr: false });

export default function ConditionalHeader() {
  const pathname = usePathname();
  if (pathname === '/' || pathname?.startsWith('/trips')) return null;
  return <Header />;
}
