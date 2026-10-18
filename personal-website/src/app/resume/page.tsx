import { SITE } from '../../data/site';
import styles from '../plain.module.css';

export const metadata = {
  title: 'Resume · Jatin Momaya',
  description: 'The resume of Jatin Momaya.',
};

export default function Resume() {
  return (
    <main className={styles.shell}>
      <div className={styles.wrap}>
        <h1 className={styles.title}>Resume</h1>
        <p className={styles.lede}>
          Below is my resume. If it does not show up,{' '}
          <a className={styles.link} href={SITE.resumeHref}>
            open the PDF
          </a>
          .
        </p>
        <iframe className={styles.pdf} src={SITE.resumeHref} title="Resume" />
      </div>
    </main>
  );
}
