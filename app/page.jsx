'use client'

import Link from 'next/link'
import AppShell from '../components/AppShell/AppShell'
import IdeaList from '../components/IdeaList/IdeaList'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import styles from './page.module.css'

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const { t } = useLocale()

  return (
    <AppShell>
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>{t('heroTitle')}</h1>
          <p className={styles.heroSubtitle}>
            {t('heroSubtitle')}
          </p>
          {isAuthenticated && (
            <Link href="/ideas/create" className={styles.heroBtn}>
              {t('newIdea')}
            </Link>
          )}
        </div>

        <IdeaList />
      </main>
    </AppShell>
  )
}
