'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import { useLocale } from '../../hooks/useLocale'
import { toApiAssetUrl } from '../../services/api'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { t } = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push('/')
  }

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.left}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandDot} />
            {t('brand')}
          </Link>
          <div className={styles.links}>
            <Link href="/" className={`${styles.link} ${pathname === '/' ? styles.active : ''}`}>
              {t('browse')}
            </Link>
            {isAuthenticated && (
              <Link
                href="/ideas/create"
                className={`${styles.link} ${pathname === '/ideas/create' ? styles.active : ''}`}
              >
                {t('newIdea')}
              </Link>
            )}
          </div>
        </div>
        <div className={styles.right}>
          {!isAuthenticated ? (
            <div className={styles.authLinks}>
              <Link href="/login" className={styles.loginBtn}>
                {t('login')}
              </Link>
              <Link href="/register" className={styles.signupBtn}>
                {t('signup')}
              </Link>
            </div>
          ) : (
            <div className={styles.authLinks}>
              <Link href="/profile" className={styles.profileBtn}>
                <span className={styles.navAvatar}>
                  {user?.avatarUrl ? (
                    <img src={toApiAssetUrl(user.avatarUrl)} alt={user.username} />
                  ) : (
                    <span>{user?.username?.[0]?.toUpperCase()}</span>
                  )}
                </span>
                {t('profile')}
              </Link>
              <button onClick={handleLogout} className={styles.loginBtn}>
                {t('signOut')}
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
