'use client'

import { useWebSocket } from '../../hooks/useWebSocket'
import { useLocale } from '../../hooks/useLocale'
import styles from './OnlineUsers.module.css'

export default function OnlineUsers() {
  const { onlineUsers, isConnected } = useWebSocket()
  const { t } = useLocale()

  if (!isConnected) return null

  return (
    <div className={styles.container} title={`${onlineUsers.count} online`}>
      <span className={styles.dot} />
      <span className={styles.count}>{onlineUsers.count}</span>
      <span className={styles.label}>{t('online')}</span>
    </div>
  )
}
