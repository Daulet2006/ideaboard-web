import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Providers from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Idea Voting Board',
  description: 'Collaborate, submit, and vote on the best ideas in real-time.',
  generator: 'v0.app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
