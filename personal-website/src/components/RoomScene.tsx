import Bookshelf from './Bookshelf';
import BrassPlaque from './BrassPlaque';
import FloorLamp from './FloorLamp';
import PictureFrame from './PictureFrame';
import styles from '../app/room.module.css';

/**
 * The homepage: a cozy illustrated room, not a page.
 * Warm plaster wall, two framed prints, oak floor, a glowing floor lamp,
 * and the bookshelf whose spines are the site navigation.
 */
export default function RoomScene() {
  return (
    <div className={styles.room}>
      <div className={styles.grain} aria-hidden="true" />
      <BrassPlaque />
      <main className={styles.scene}>
        <div className={styles.plaster} aria-hidden="true" />
        <PictureFrame variant="a" />
        <PictureFrame variant="b" />
        <div className={styles.floor} aria-hidden="true" />
        <FloorLamp />
        <Bookshelf />
      </main>
    </div>
  );
}
