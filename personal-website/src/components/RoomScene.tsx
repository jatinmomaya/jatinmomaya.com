'use client';

import { useState } from 'react';
import Bookshelf from './Bookshelf';
import FloorLamp from './FloorLamp';
import PictureFrame from './PictureFrame';
import SpineFace from './SpineFace';
import { PLACEHOLDER_BOOKS } from './designTokens';
import styles from '../app/room.module.css';

/**
 * The homepage: a cozy illustrated room, not a page.
 * Warm plaster wall, two framed prints, oak floor, a glowing floor lamp,
 * and the bookshelf whose spines are the site navigation.
 */
export default function RoomScene() {
  const [lampOn, setLampOn] = useState(true);
  return (
    <div className={lampOn ? styles.room : `${styles.room} ${styles.lampOff}`}>
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.moonwash} aria-hidden="true" />
      <main className={styles.scene}>
        <div className={styles.plaster} aria-hidden="true" />
        <div className={styles.window} aria-hidden="true">
          <svg viewBox="0 0 220 250" role="presentation">
            <rect x="8" y="8" width="204" height="234" rx="3" fill="#171a25" stroke="#8a7048" strokeWidth="8" />
            <rect x="20" y="20" width="180" height="210" fill="#20283b" />
            <circle cx="151" cy="66" r="25" fill="#d9d7c8" opacity=".9" />
            <circle cx="161" cy="58" r="24" fill="#20283b" />
            <g fill="#d7d9df" opacity=".7"><circle cx="51" cy="54" r="2"/><circle cx="92" cy="38" r="1.6"/><circle cx="78" cy="91" r="1.5"/><circle cx="170" cy="111" r="1.4"/><circle cx="43" cy="133" r="1.7"/><circle cx="115" cy="119" r="1.3"/></g>
            <path d="M20 178 Q66 158 109 177 T200 169 V230 H20Z" fill="#303d52" />
            <path d="M20 196 Q70 179 111 194 T200 188 V230 H20Z" fill="#273448" />
            <path d="M109 20 V230 M20 130 H200" stroke="#8a7048" strokeWidth="7" />
          </svg>
        </div>
        <PictureFrame variant="a" />
        <PictureFrame variant="b" />
        <div className={styles.rug} aria-hidden="true"><span /></div>
        <div className={styles.floor} aria-hidden="true" />
        <FloorLamp on={lampOn} onToggle={() => setLampOn((v) => !v)} />
        <Bookshelf />
        <div className={styles.lowerShelf} aria-hidden="true">
          <div className={styles.lowerShelfBooks}>
            {PLACEHOLDER_BOOKS.map((book, index) => (
              <span
                key={book.id}
                className={`${styles.placeholderBook} ${index === 2 ? styles.placeholderLean : ''}`}
                style={{ width: book.width, height: book.height }}
              >
                <SpineFace title={book.title} color={book.spine} />
              </span>
            ))}
            <span className={styles.smallBookend} />
          </div>
          <div className={styles.lowerPlank} />
        </div>
      </main>
    </div>
  );
}
