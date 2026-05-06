'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../hooks/useAuth'
import AppShell from '../../../components/AppShell/AppShell'
import IdeaForm from '../../../components/IdeaForm/IdeaForm'

export default function CreateIdeaPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) return null

  return (
    <AppShell>
      <IdeaForm />
    </AppShell>
  )
}
