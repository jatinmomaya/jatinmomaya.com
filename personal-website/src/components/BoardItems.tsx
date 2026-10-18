import type { MouseEvent } from 'react';
import { WORK } from '../data/about';
import { SLOTS, type Print } from '../data/board';
import { SITE } from '../data/site';
import Pinned, { type PinColor } from './Pinned';
import styles from '../app/board.module.css';

export function Masthead() {
  return (
    <Pinned slot={SLOTS.masthead} className={styles.masthead} pin="red">
      <h1>{SITE.name}</h1>
    </Pinned>
  );
}

const PIN_ORDER: PinColor[] = ['red', 'blue', 'green', 'brass', 'red', 'blue', 'green'];

interface PhotoPrintProps {
  print: Print;
  position: number;
  /** columns in the phone grid */
  span?: 1 | 2;
  onOpen: (e: MouseEvent<HTMLElement>, index: number) => void;
}

/** A photograph pinned up. Opens the photobook. The first print carries the section label. */
export function PhotoPrint({ print, position, span, onOpen }: PhotoPrintProps) {
  return (
    <Pinned
      as="button"
      slot={print.slot}
      span={span}
      className={styles.print}
      pin={PIN_ORDER[position % PIN_ORDER.length]}
      label={position === 0 ? { text: 'Photographs', dx: 18, dy: -36, rot: -2 } : undefined}
      aria-label={`${print.caption}. Open the Mexico photobook.`}
      onClick={(e) => onOpen(e, print.index)}
    >
      <span className={styles.printFrame}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={print.src}
          alt=""
          width={print.width}
          height={print.height}
          decoding="async"
        />
      </span>
      <span className={styles.printCaption}>{print.caption}</span>
    </Pinned>
  );
}

export function AboutCard({ onOpen }: { onOpen: (e: MouseEvent<HTMLElement>) => void }) {
  return (
    <Pinned
      as="button"
      slot={SLOTS.about}
      className={styles.about}
      pin="green"
      label={{ text: 'About', dx: 56, dy: -30, rot: 2 }}
      aria-label="About me"
      onClick={onOpen}
    >
      <strong>{SITE.name}</strong>
      <i />
      <span className={styles.mono}>about &middot; photographs<br />books &middot; writing</span>
    </Pinned>
  );
}

const ICONS = {
  linkedin: (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#0a66c2" />
      <text x="20" y="29" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="22" fill="#fff">in</text>
    </svg>
  ),
  github: (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="#1f1a12"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  ),
} as const;

const LINK_ACCENT = { linkedin: '#0a66c2', github: '#1f1a12' } as const;

/** A link pinned up. Opens in a new tab. */
export function LinkCard({ id }: { id: 'linkedin' | 'github' }) {
  const link = SITE.links.find((l) => l.id === id);
  if (!link) return null;
  return (
    <Pinned
      as="a"
      slot={SLOTS[id]}
      className={styles.link}
      pin={id === 'github' ? 'brass' : 'blue'}
      pinX="90%"
      accent={LINK_ACCENT[id]}
      href={link.href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${link.label}, opens in a new tab`}
    >
      {ICONS[id]}
      <div>
        <strong>{link.label}</strong>
        <span>{link.handle}</span>
      </div>
    </Pinned>
  );
}

/** A small, plain resume. Opens the PDF. */
export function ResumeCard() {
  return (
    <Pinned
      as="a"
      slot={SLOTS.resume}
      className={styles.resume}
      pin="blue"
      label={{ text: 'Resume', dx: 48, dy: -26, rot: -1 }}
      href={SITE.resumeHref}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Resume, PDF, opens in a new tab"
    >
      <strong>{SITE.name}</strong>
      <div className={`${styles.kind} ${styles.mono}`}>Resume</div>
      <hr />
      <div className={styles.mono} style={{ fontSize: 'max(9.5px, calc(var(--u) * 8))', color: 'var(--ink-faint)' }}>Experience</div>
      <ul>
        {WORK.map((job) => (
          <li key={job.org}>
            <b>{job.org}</b>
            <s />
            <s />
          </li>
        ))}
      </ul>
      <span className={`${styles.pdf} ${styles.mono}`}>PDF</span>
    </Pinned>
  );
}

export interface Post {
  title: string;
  /** YYYY-MM. Placeholders have none. */
  date?: string;
  href?: string;
  /** a stand-in for an essay that isn't written yet; shown as "Draft" */
  placeholder?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function formatMonth(date: string): string {
  const [y, m] = date.split('-');
  return m ? `${MONTHS[Number(m) - 1] ?? ''} ${y}` : y;
}

/** A typeset index of posts, newest first. Only rendered when there are posts. */
export function WritingPage({ posts }: { posts: Post[] }) {
  return (
    <Pinned
      slot={SLOTS.writing}
      className={styles.writing}
      pin="red"
      label={{ text: 'Writing', dx: 78, dy: -22, rot: 2 }}
    >
      <h2 className={styles.mono}>Writing</h2>
      <hr />
      {posts.slice(0, 6).map((post) => {
        const body = (
          <>
            {post.date && !post.placeholder ? (
              <time dateTime={post.date} className={styles.mono}>{formatMonth(post.date)}</time>
            ) : (
              <em className={styles.mono}>Draft</em>
            )}
            <span>{post.title}</span>
          </>
        );
        return post.href ? (
          <a key={post.title} className={styles.post} href={post.href}>{body}</a>
        ) : (
          <div key={post.title} className={styles.post}>{body}</div>
        );
      })}
    </Pinned>
  );
}
