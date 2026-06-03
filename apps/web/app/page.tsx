import styles from './page.module.css';

export default function Home() {
  return (
    <main className="mobile-container">
      <div className={styles.main}>
        <h1 className={styles.title}>CraveCompass</h1>
        <p className={styles.subtitle}>Stop arguing. Start eating.</p>

        <button className={styles.button}>
          Create a Room
        </button>
      </div>
    </main>
  );
}