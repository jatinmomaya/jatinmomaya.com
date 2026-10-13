'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playCloseAnimation, playOpenAnimation } from './anim';
import styles from '../app/about.module.css';

interface AboutOverlayProps {
  /** Viewport point the page grows from (the About book's position). */
  origin: { x: number; y: number } | null;
  onClose: () => void;
}

const WORK = [
  {
    org: 'ZS Associates',
    dates: 'Jun 2025 \u2013 present',
    role: 'Associate Consultant, Strategy Insights & Planning',
    body: 'Led digital marketing operations for Amgen\u2019s biggest brands \u2014 campaign strategy and execution across Salesforce Marketing Cloud and Data 360. Now I work on strategy for AI tools built for Amgen\u2019s field team.',
  },
  {
    org: 'Molina Healthcare',
    dates: 'Aug 2024 \u2013 May 2025',
    role: 'Senior Business Analyst / Product Owner',
    body: 'Worked on digital channels \u2014 care coordination portal, digitizing prior auth.',
  },
  {
    org: 'Infosys',
    dates: 'Jan 2021 \u2013 Aug 2024',
    role: 'Technology Analyst / Senior Associate Software Engineer',
    body: 'Started as a software engineer, ended up co-leading a 10-person team maintaining Molina\u2019s systems.',
  },
];

/**
 * The About book, opened: an "About the Author" page that grows out of
 * the book's position on the shelf.
 *
 * Focus contract: focus moves into the dialog on open, Tab cycles inside
 * it, and focus returns to the About book on close (handled by the caller).
 */
export default function AboutOverlay({ origin, onClose }: AboutOverlayProps) {
  const [closing, setClosing] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(rm.matches);
    sync();
    rm.addEventListener('change', sync);
    return () => rm.removeEventListener('change', sync);
  }, []);

  const requestClose = useCallback(() => {
    if (reducedMotion) {
      onClose();
      return;
    }
    setClosing(true);
    const sheet = dialogRef.current;
    if (sheet) playCloseAnimation(sheet).then(onClose);
    else onClose();
  }, [onClose, reducedMotion]);

  // 3D book-opening animation on mount (anime.js timeline).
  useEffect(() => {
    if (dialogRef.current) playOpenAnimation(dialogRef.current, origin);
    // origin is fixed for the overlay's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock body scroll, focus the dialog, close on Escape, trap Tab inside.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        requestClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const scope = dialogRef.current;
      if (!scope) return;
      const focusables = Array.from(
        scope.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'),
      ).filter((el) => el.getClientRects().length > 0);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [requestClose]);

  return (
    <div
      className={`${styles.overlay}${closing ? ` ${styles.closing}` : ''}`}
    >
      <div className={styles.scrim} onClick={requestClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="About the author"
        tabIndex={-1}
        className={styles.sheet}
      >
        <button type="button" className={styles.close} onClick={requestClose} aria-label="Back to the shelf">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M2 2 L14 14 M14 2 L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <p className={styles.kicker}>About the Author</p>
        <p className={styles.lede}>
          I’m Jatin. I was born in India and moved to the US when I was 7. I grew up in
          Houston and Southern California.
        </p>
        <div className={styles.rule} aria-hidden="true" />
        <h2 className={styles.section}>Work</h2>
        <ul className={styles.work}>
          {WORK.map((job) => (
            <li key={job.org} className={styles.job}>
              <div className={styles.jobHead}>
                <span className={styles.org}>{job.org}</span>
                <span className={styles.dates}>{job.dates}</span>
              </div>
              <div className={styles.role}>{job.role}</div>
              <p className={styles.jobBody}>{job.body}</p>
            </li>
          ))}
        </ul>
        <div className={styles.rule} aria-hidden="true" />
        <h2 className={styles.section}>Correspondence</h2>
        <p className={styles.contact}>
          You can find me on{' '}
          <a
            href="https://www.linkedin.com/in/jatin-momaya/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          . The best way to reach me is email:{' '}
          <a href="mailto:momayajatin@gmail.com">momayajatin@gmail.com</a>
        </p>
        <button type="button" className={styles.back} onClick={requestClose}>
          Back to the shelf
        </button>
      </div>
    </div>
  );
}
