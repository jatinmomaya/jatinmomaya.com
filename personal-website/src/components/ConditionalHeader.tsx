'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

/**
 * The starter site chrome. Hidden on the homepage so the room scene
 * renders full-viewport with no chrome breaking the immersion.
 */
export default function ConditionalHeader() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return <Header />;
}
