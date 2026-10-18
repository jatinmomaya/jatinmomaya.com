'use client';

import { useOverlayDialog } from './useOverlayDialog';
import { ABOUT_LEDE, WORK } from '../data/about';
import { SITE } from '../data/site';
import styles from '../app/about.module.css';

interface AboutOverlayProps {
  /** Viewport point the page grows from (the About card's position). */
  origin: { x: number; y: number } | null;
  onClose: () => void;
}

/**
 * The About card, opened: an "About the Author" page that grows out of the
 * card's position on the board.
 *
 * Focus contract: focus moves into the dialog on open, Tab cycles inside
 * it, and focus returns to the About card on close (handled by the caller).
 */
export default function AboutOverlay({ origin, onClose }: AboutOverlayProps) {
  const { closing, dialogRef, requestClose } = useOverlayDialog(origin, onClose);

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
        <button type="button" className={styles.close} onClick={requestClose} aria-label="Back to the board">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M2 2 L14 14 M14 2 L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <p className={styles.kicker}>About the Author</p>
        <p className={styles.lede}>{ABOUT_LEDE}</p>
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
          <a href={SITE.links[0].href} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          . The best way to reach me is email:{' '}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </p>
        <button type="button" className={styles.back} onClick={requestClose}>
          Back to the board
        </button>
      </div>
    </div>
  );
}
