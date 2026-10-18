'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { toShelfBook, type Book } from '../lib/books';
import { photoUrl, srcSet, type TripSummary } from '../lib/trips';
import { ABOUT_LEDE, WORK } from '../data/about';
import { SITE } from '../data/site';
import { useTripHost } from './useTripHost';
import styles from '../app/bookshelfhome.module.css';

export interface Post {
  title: string;
  /** YYYY-MM, once it is published */
  date?: string;
  href?: string;
  /** filler text standing in for an essay that is not written yet */
  placeholder?: boolean;
}

export interface FavoriteItem {
  id: string;
  title: string;
  author: string;
  pages?: number;
  /** the books in a series, in reading order; empty for a single book */
  books: { title: string; order: number }[];
  /** set when the item is a box set whose volumes are not listed separately */
  count?: number;
}

interface BookshelfHomeProps {
  reading: Book[];
  favorites: FavoriteItem[];
  trips: TripSummary[];
  posts: Post[];
}

type Open = { key: string; body: ReactNode };

/** One unit of the book sizing in lib/books.ts is about a pixel and a half here. */
const S = 1.5;

/**
 * The homepage: a short hello and one bookcase. The top shelf is what I'm
 * reading now, the middle holds a few objects that open the rest of the site
 * (photographs, tennis, writing, work), and the bottom shelf is my favorites.
 * The whole thing fits one screen with no scrolling. Opening anything shows
 * a panel over the case (a sheet from the bottom on phones); trips open
 * their own grid on top of it.
 */
export default function BookshelfHome({ reading, favorites, trips, posts }: BookshelfHomeProps) {
  const [open, setOpen] = useState<Open | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const { openTrip, host } = useTripHost();

  const show = useCallback((key: string, body: ReactNode) => {
    opener.current = document.activeElement as HTMLElement | null;
    setOpen({ key, body });
  }, []);

  // Closing is a plain state change (never waits on an animation), and focus
  // goes back to what opened the panel.
  const close = useCallback(() => {
    setOpen(null);
    const el = opener.current;
    window.setTimeout(() => {
      if (el?.isConnected) el.focus();
    }, 0);
  }, []);

  useEffect(() => {
    if (!open) return;
    dialog.current?.querySelector<HTMLElement>('[data-close]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      // the trip viewer sits above this panel and handles its own keys
      if ([...document.querySelectorAll('[role="dialog"]')].some((d) => d !== dialog.current)) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'Tab' && dialog.current) {
        const f = [...dialog.current.querySelectorAll<HTMLElement>('button, a[href]')].filter((x) => !x.hasAttribute('disabled'));
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!dialog.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const spine = (b: Book, extra?: { series?: number }) => {
    const s = toShelfBook(b);
    // Height is a share of the shelf's own height (76 to 92%), so the shelves
    // can flex to the screen and no spine is ever taller than its shelf.
    const height = 76 + ((s.height - 118) / 34) * 16;
    return { width: Math.max(27, Math.round(s.width * S * 0.62)), height: Math.round(height * 10) / 10, color: s.color, ink: s.ink, series: extra?.series };
  };

  const bookButton = (b: Book, key: string, body: ReactNode, opts: { ribbon?: boolean; count?: number } = {}) => {
    const s = spine(b);
    return (
      <li key={key}>
        <button
          type="button"
          className={`${styles.book}${opts.count ? ` ${styles.series}` : ''}`}
          style={{ width: s.width, height: `calc(${s.height} * 1cqh)`, '--c': s.color, '--ink': s.ink } as React.CSSProperties}
          aria-haspopup="dialog"
          aria-label={`${b.title} by ${b.author}${opts.ribbon ? ', reading now' : ''}${opts.count ? `, ${opts.count} books` : ''}`}
          onClick={() => show(key, body)}
        >
          <span>{b.title.split(':')[0]}</span>
          {opts.ribbon && <i className={styles.ribbon} aria-hidden="true" />}
          {opts.count ? <em className={styles.count}>{opts.count}</em> : null}
        </button>
      </li>
    );
  };

  const bookPanel = (b: Book, kicker: string, extra?: ReactNode) => (
    <div className={styles.bk}>
      {b.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.cover} src={`/books/covers/${b.id}.webp`} alt="" width={130} />
      )}
      <div>
        <div className={styles.sub}>{kicker}</div>
        <h2>{b.title}</h2>
        <p>{b.author}</p>
        {b.note ? <p>{b.note}</p> : null}
        {extra}
      </div>
    </div>
  );

  const tennisPlay = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    el.classList.remove(styles.bounce);
    void el.offsetWidth;
    el.classList.add(styles.bounce);
  };

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1>Hey, I&rsquo;m Jatin.</h1>
        <p><span>Consultant by profession.</span> <span>Curious about pretty much everything else.</span></p>
        <small>Associate consultant at ZS &middot; all photographs are mine</small>
      </header>

      <main className={styles.main}>
        <section className={styles.unit} aria-label="Shelf">
          <div className={styles.lab}><b>Reading now</b></div>
          <ul className={styles.row} aria-label="Reading now">
            {reading.map((b) => bookButton(b, `r-${b.id}`, bookPanel(b, 'Reading now'), { ribbon: true }))}
          </ul>

          <ul className={`${styles.row} ${styles.objects}`} aria-label="Things on the shelf">
            <li>
              <button type="button" className={`${styles.obj} ${styles.cam}`} aria-haspopup="dialog" aria-label="Photographs"
                onClick={() => show('cam', (
                  <>
                    <div className={styles.sub}>Photographs</div>
                    <h2>Trips, so far</h2>
                    <p>All taken by me. Open a trip to flip through it.</p>
                    <ul className={styles.trips}>
                      {trips.map((t) => {
                        const cover = t.cover;
                        return (
                          <li key={t.id}>
                            <button type="button" className={styles.trip} onClick={(e) => openTrip(e, t)}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photoUrl(t.id, cover, cover.widths[0])} srcSet={srcSet(t.id, cover, 800)} sizes="220px" alt="" width={cover.w} height={cover.h} loading="lazy" style={{ background: cover.bg }} />
                              <span><b>{t.title}</b>{t.when} &middot; {t.count} photographs</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    <p><Link className={styles.more} href="/trips">All photographs</Link></p>
                  </>
                ))}>
                <svg width="150" height="92" viewBox="0 0 150 92" aria-hidden="true"><rect x="4" y="22" width="142" height="66" rx="6" fill="#1c1a18"/><rect x="4" y="14" width="142" height="14" rx="4" fill="#c9c4b6"/><rect x="22" y="6" width="22" height="10" rx="2" fill="#b9b4a6"/><rect x="104" y="7" width="12" height="9" rx="2" fill="#b9b4a6"/><rect x="10" y="34" width="22" height="46" rx="3" fill="#0e0d0c"/><rect x="118" y="34" width="22" height="46" rx="3" fill="#0e0d0c"/><circle cx="75" cy="56" r="30" fill="#b9b4a6"/><circle cx="75" cy="56" r="25" fill="#16120f"/><circle cx="75" cy="56" r="18" fill="#222c3a"/><circle cx="68" cy="49" r="5" fill="#fff" opacity=".3"/></svg>
                <span className={styles.tag}>Photos</span>
              </button>
            </li>
            <li>
              <button type="button" className={`${styles.obj} ${styles.ball}`} aria-haspopup="dialog" aria-label="Tennis"
                onClick={(e) => { tennisPlay(e); show('tennis', (<><div className={styles.sub}>Tennis</div><h2>I play tennis.</h2><p className={styles.empty}>Nothing written yet.</p></>)); }}>
                <svg width="62" height="62" viewBox="0 0 62 62" aria-hidden="true"><defs><radialGradient id="tb" cx=".38" cy=".32" r=".8"><stop offset="0" stopColor="#e6f06a"/><stop offset=".6" stopColor="#c3d233"/><stop offset="1" stopColor="#8a9a1c"/></radialGradient></defs><circle cx="31" cy="31" r="30" fill="url(#tb)"/><path d="M6 14 Q27 31 6 48 M56 14 Q35 31 56 48" stroke="#f7f6ea" strokeWidth="2.6" fill="none"/></svg>
                <span className={styles.tag}>Tennis</span>
              </button>
            </li>
            <li>
              <button type="button" className={`${styles.obj} ${styles.nb}`} aria-haspopup="dialog" aria-label="Writing"
                onClick={() => show('notes', (
                  <>
                    <div className={styles.sub}>Writing</div>
                    <h2>Notes</h2>
                    {posts.length ? (
                      <ul className={styles.posts}>
                        {posts.slice(0, 6).map((p) => (
                          <li key={p.title}>{p.href ? <a href={p.href}>{p.title}</a> : <span>{p.title}</span>}{p.placeholder || !p.href ? <em> Draft</em> : null}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.empty}>Nothing published yet.</p>
                    )}
                  </>
                ))}>
                <svg width="110" height="150" viewBox="0 0 110 150" aria-hidden="true"><rect x="4" y="2" width="102" height="146" rx="5" fill="#33475b"/><rect x="4" y="2" width="12" height="146" rx="3" fill="#26374a"/><rect x="82" y="2" width="8" height="146" fill="#a33a2e"/><rect x="30" y="34" width="46" height="34" fill="#efe6cf"/><text x="53" y="56" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="10" fill="#33475b">NOTES</text></svg>
                <span className={styles.tag}>Writing</span>
              </button>
            </li>
            <li>
              <button type="button" className={`${styles.obj} ${styles.card}`} aria-haspopup="dialog" aria-label="Work"
                onClick={() => show('work', (
                  <>
                    <div className={styles.sub}>Work</div>
                    <h2>{SITE.name}</h2>
                    <p>{ABOUT_LEDE}</p>
                    <ul className={styles.jobs}>
                      {WORK.map((j) => (
                        <li key={j.org}><b>{j.role}</b>, {j.org}<span>{j.dates}</span><p>{j.body}</p></li>
                      ))}
                    </ul>
                    <p className={styles.links}>
                      {SITE.links.map((l) => <a key={l.id} href={l.href} target="_blank" rel="noreferrer noopener">{l.label}</a>)}
                      <a href={SITE.resumeHref} target="_blank" rel="noreferrer noopener">Resume (PDF)</a>
                      <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                    </p>
                  </>
                ))}>
                <svg width="120" height="76" viewBox="0 0 120 76" aria-hidden="true"><g transform="rotate(-4 60 38)"><rect x="3" y="3" width="114" height="70" fill="#f3ecdc"/><text x="14" y="30" fontFamily="Georgia,serif" fontSize="13" fontWeight="600" fill="#2a2118">Jatin Momaya</text><text x="14" y="47" fontFamily="ui-monospace,monospace" fontSize="6.5" fill="#6b5a3a">ASSOCIATE CONSULTANT</text><text x="14" y="58" fontFamily="ui-monospace,monospace" fontSize="6.5" fill="#6b5a3a">ZS ASSOCIATES</text></g></svg>
                <span className={styles.tag}>Work</span>
              </button>
            </li>
          </ul>

          <div className={styles.lab}><b>Favorites</b></div>
          <ul className={styles.row} aria-label="Favorites">
            {favorites.map((f) => {
              const b: Book = { id: f.id, title: f.title, author: f.author, status: 'read', pages: f.pages };
              const n = f.books.length || f.count || 0;
              const body = (
                <div className={styles.bk}>
                  <div>
                    <div className={styles.sub}>Favorite{n > 1 ? ` · ${n} books` : ''}</div>
                    <h2>{f.title}</h2>
                    <p>{f.author}</p>
                    {f.books.length > 0 && (
                      <ol className={styles.sl}>
                        {f.books.map((x) => <li key={x.order}>{x.title}</li>)}
                      </ol>
                    )}
                  </div>
                </div>
              );
              return bookButton(b, `f-${f.id}`, body, { count: n > 1 ? n : undefined });
            })}
          </ul>
        </section>
        <div className={styles.floor} />
      </main>
      {open && (
        <div className={styles.modal}>
          <div className={styles.scrim} onClick={close} aria-hidden="true" />
          <div ref={dialog} className={styles.sheet} role="dialog" aria-modal="true" aria-label="Details" key={open.key}>
            <button type="button" className={styles.close} data-close onClick={close} aria-label="Close">&times;</button>
            <div className={styles.in}>{open.body}</div>
          </div>
        </div>
      )}
      {host}
    </div>
  );
}
