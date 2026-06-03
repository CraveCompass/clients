import CreateRoom from '../components/CreateRoom';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.wrapper}>
      <h1 className={styles.title}>Crave<span className={styles.brandColor}>Compass</span></h1>
      <p className={styles.subtitle}>Stop arguing. Start eating.</p>

      <CreateRoom />
    </main>
  );
}