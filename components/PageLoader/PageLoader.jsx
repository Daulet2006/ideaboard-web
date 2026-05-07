import styles from './PageLoader.module.css'

export default function PageLoader({ label = 'Loading...' }) {
  return (
    <div className={styles.loaderWrap} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.loaderBox}>
        <span className={styles.spinner} />
        <span>{label}</span>
      </div>
    </div>
  )
}