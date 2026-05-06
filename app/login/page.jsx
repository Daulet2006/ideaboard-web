'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import AppShell from '../../components/AppShell/AppShell'
import AuthForm from '../../components/AuthForm/AuthForm'

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) return null

  return (
    <AppShell>
      <AuthForm mode="login" />
    </AppShell>
  )
}
