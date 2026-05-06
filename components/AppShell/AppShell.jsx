'use client'

import AppSidebar from '../AppSidebar/AppSidebar'
import Navbar from '../Navbar/Navbar'
import { useAuth } from '../../hooks/useAuth'
import styles from './AppShell.module.css'

export default function AppShell({ children }) {
  const { isAuthenticated } = useAuth()

  return (
    <>
      <Navbar />
      <div className={`${styles.layout} ${isAuthenticated ? styles.withSidebar : styles.fullWidth}`}>
        <div className={styles.content}>{children}</div>
        {isAuthenticated && (
          <div className={styles.sidebarWrap}>
            <AppSidebar />
          </div>
        )}
      </div>
    </>
  )
}
