'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../../hooks/useAuth'
import { useLocale } from '../../../../hooks/useLocale'
import { ideaService } from '../../../../services/idea.service'
import AppShell from '../../../../components/AppShell/AppShell'
import IdeaForm from '../../../../components/IdeaForm/IdeaForm'
import styles from './page.module.css'

export default function EditIdeaPage() {
  const { id } = useParams()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const [idea, setIdea] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login')
      return
    }
    async function load() {
      try {
        const data = await ideaService.getIdea(id)
        const canManage = data.author?._id === user?._id || user?.role === 'admin' || user?.role === 'moderator'
        if (!canManage) {
          router.replace('/')
          return
        }
        setIdea(data)
      } catch {
        setError(t('ideaNotFound'))
      } finally {
        setIsLoading(false)
      }
    }
    if (id && !authLoading && isAuthenticated) load()
  }, [id, user, isAuthenticated, authLoading, router, t])

  if (authLoading || isLoading) return null

  if (error) {
    return (
      <AppShell>
        <main className={styles.main}>
          <p className={styles.error}>{error}</p>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {idea && <IdeaForm idea={idea} />}
    </AppShell>
  )
}
