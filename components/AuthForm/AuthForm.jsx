'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import { useLocale } from '../../hooks/useLocale'
import { getApiErrorMessage } from '../../lib/api-error'
import styles from './AuthForm.module.css'

export default function AuthForm({ mode = 'login' }) {
  const isLogin = mode === 'login'
  const { login, register } = useAuth()
  const { t } = useLocale()
  const router = useRouter()

  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  function parseAuthFieldErrors(message) {
    if (!message || typeof message !== 'string') return {}
    const result = {}
    const entries = message.split(';').map((entry) => entry.trim()).filter(Boolean)

    entries.forEach((entry) => {
      const lowered = entry.toLowerCase()
      if (lowered.includes('username')) result.username = entry
      if (lowered.includes('email')) result.email = entry
      if (lowered.includes('password')) result.password = entry
    })

    return result
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setIsLoading(true)
    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password })
      } else {
        await register({ username: form.username, email: form.email, password: form.password })
      }
      router.push('/')
    } catch (err) {
      let message = getApiErrorMessage(err, t('somethingWrong'))

      if (err.status === 401) {
        message = t('invalidCredentials')
      } else if (err.status === 409) {
        message = getApiErrorMessage(err, t('emailTaken'))
      }

      if (err.status === 422) {
        setFieldErrors(parseAuthFieldErrors(message))
      }

      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoDot} />
            {t('brand')}
          </div>
          <h1 className={styles.title}>{isLogin ? t('welcomeBack') : t('createAccount')}</h1>
          <p className={styles.subtitle}>
            {isLogin
              ? t('loginSubtitle')
              : t('registerSubtitle')}
          </p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className={styles.field}>
              <label htmlFor="username" className={styles.label}>{t('username')}</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                placeholder="username"
                value={form.username}
                onChange={handleChange}
                className={`${styles.input} ${fieldErrors.username ? styles.inputError : ''}`}
              />
              {fieldErrors.username && <span className={styles.fieldError}>{fieldErrors.username}</span>}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>{t('email')}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t('email')}
              value={form.email}
              onChange={handleChange}
              className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
            />
            {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>{t('password')}</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              placeholder={isLogin ? '••••••••' : 'Min 8 chars'}
              value={form.password}
              onChange={handleChange}
              className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
            />
            {fieldErrors.password && <span className={styles.fieldError}>{fieldErrors.password}</span>}
          </div>

          <button type="submit" disabled={isLoading} className={styles.submitBtn}>
            {isLoading ? (
              <span className={styles.spinner} />
            ) : isLogin ? t('login') : t('createAccountAction')}
          </button>
        </form>

        <p className={styles.switchText}>
          {isLogin ? `${t('dontHaveAccount')} ` : `${t('alreadyHaveAccount')} `}
          <Link href={isLogin ? '/register' : '/login'} className={styles.switchLink}>
            {isLogin ? t('signup') : t('login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
