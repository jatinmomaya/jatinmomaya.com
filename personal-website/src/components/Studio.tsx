'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import type { ShelfBook } from '../lib/books';
import type { Print } from '../data/board';
import { AboutCard, LinkCard, Masthead, PhotoPrint, ResumeCard, WritingPage, type Post } from './BoardItems';
import ReadingShelf from './ReadingShelf';
import { getChapter, warmChapterPhotos } from './photobook/chapters';
import studio from '../app/studio.module.css';
import board from '../app/board.module.css';

// Overlays only exist after a tap, so they stay out of first paint.
const PhotobookOverlay = dynamic(() => import('./PhotobookOverlay'), { ssr: false });
const AboutOverlay = dynamic(() => import('./AboutOverlay'), { ssr: false });

interface StudioProps {
  /** recent books for the shelf, in shelf order */
  shelfBooks: ShelfBook[];
  totalBooks: number;
  prints: Print[];
  posts: Post[];
}

type Origin = { x: number; y: number };

function originOf(el: HTMLElement): Origin {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * The homepage: a corkboard of things pinned up, and a shelf of books under
 * it. Everything on the board is also navigation: photographs open the
 * photobook, the About card opens About, the rest are links.
 */
export default function Studio({ shelfBooks, totalBooks, prints, posts }: StudioProps) {
  const [mounted, setMounted] = useState(false);
  const [photobookOpen, setPhotobookOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  // Intent preloading: the first photos of the book are warm by the time
  // someone taps a print.
  useEffect(() => {
    const chapter = getChapter('mexico');
    if (chapter) warmChapterPhotos(chapter, [0, 1]);
  }, []);

  // Focus contract: closing an overlay returns focus to what opened it.
  const restoreFocus = useCallback(() => {
    const el = opener.current;
    window.setTimeout(() => {
      if (el?.isConnected) el.focus();
    }, 0);
  }, []);

  const openPhotobook = useCallback((e: MouseEvent<HTMLElement>) => {
    opener.current = e.currentTarget;
    setOrigin(originOf(e.currentTarget));
    setPhotobookOpen(true);
  }, []);
  const closePhotobook = useCallback(() => {
    setPhotobookOpen(false);
    restoreFocus();
  }, [restoreFocus]);

  const openAbout = useCallback((e: MouseEvent<HTMLElement>) => {
    opener.current = e.currentTarget;
    setOrigin(originOf(e.currentTarget));
    setAboutOpen(true);
  }, []);
  const closeAbout = useCallback(() => {
    setAboutOpen(false);
    restoreFocus();
  }, [restoreFocus]);

  const chapter = getChapter('mexico');
  const hasWriting = posts.length > 0;
  // The first four prints are the main cluster. The rest fill the middle of
  // the board, and the Writing page goes between them in reading order.
  const mainPrints = prints.slice(0, 4);
  const restPrints = prints.slice(4);

  return (
    <div className={studio.studio}>
      <main className={studio.stage}>
        <div className={studio.wallFx} aria-hidden="true" />
        <div className={board.board}>
          <div className={board.frame} aria-hidden="true" />
          <div className={board.cork} aria-hidden="true" />
          <div className={board.pins}>
            <Masthead />
            {mainPrints.map((p, i) => (
              <PhotoPrint
                key={p.index}
                print={p}
                position={i}
                // an odd landscape print out on its own row takes the full phone width
                span={i === prints.length - 1 && prints.length % 2 === 1 && p.slot.w > p.slot.h ? 2 : undefined}
                onOpen={openPhotobook}
              />
            ))}
            {hasWriting && <WritingPage posts={posts} />}
            {restPrints.map((p, i) => (
              <PhotoPrint key={p.index} print={p} position={mainPrints.length + i} onOpen={openPhotobook} />
            ))}
            <AboutCard onOpen={openAbout} />
            <LinkCard id="linkedin" />
            <LinkCard id="github" />
            <ResumeCard />
          </div>
        </div>
        <ReadingShelf books={shelfBooks} total={totalBooks} />
      </main>
      <div className={studio.baseboard} aria-hidden="true" />
      <div className={studio.floor} aria-hidden="true" />
      <div className={studio.vignette} aria-hidden="true" />
      {mounted &&
        photobookOpen &&
        chapter &&
        createPortal(<PhotobookOverlay chapter={chapter} origin={origin} onClose={closePhotobook} />, document.body)}
      {mounted && aboutOpen && createPortal(<AboutOverlay origin={origin} onClose={closeAbout} />, document.body)}
    </div>
  );
}
