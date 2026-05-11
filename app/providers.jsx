'use client'

import { AuthProvider } from '../context/AuthContext'
import { LocaleProvider } from '../context/LocaleContext'
import { WebSocketProvider } from '../context/WebSocketContext'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <LocaleProvider>
        <AuthProvider>
          <WebSocketProvider>
            {children}
            <Toaster richColors position="top-right" />
          </WebSocketProvider>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  )
}
