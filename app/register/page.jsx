'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import AppShell from '../../components/AppShell/AppShell'
import AuthForm from '../../components/AuthForm/AuthForm'
import PageLoader from '../../components/PageLoader/PageLoader'

export default function RegisterPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <AppShell>
        <PageLoader />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <AuthForm mode="register" />
    </AppShell>
  )
}
