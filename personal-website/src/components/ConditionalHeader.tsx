'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

// The starter site chrome, loaded only where it's shown. Hidden on the
// homepage so the room scene renders full-viewport with no chrome breaking
// the immersion — and never parsed on first paint.
const Header = dynamic(() => import('./Header'), { ssr: false });

export default function ConditionalHeader() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return <Header />;
}
