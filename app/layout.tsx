import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Padel LiveScore - Real-time Match Updates',
  description: 'Watch live padel match scores, check standings, and upcoming matches. Real-time score updates for padel tennis tournaments.',
  generator: 'v0.app',
  keywords: ['padel', 'tennis', 'livescore', 'tournament', 'standings'],
  openGraph: {
    title: 'Padel LiveScore',
    description: 'Real-time padel match scores and standings',
    type: 'website',
  },
  icons: {
    icon: '/logo/logo-2.png',
    apple: '/logo/logo-2.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
