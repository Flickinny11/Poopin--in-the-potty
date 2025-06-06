import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VidLiSync - Speak Any Language, Sound Like You',
  description: 'Real-time video chat with AI translation, voice cloning, and lip synchronization. Break language barriers while preserving your unique voice.',
  keywords: 'video chat, translation, voice cloning, lip sync, real-time, AI, communication, languages',
  authors: [{ name: 'VidLiSync Team' }],
  creator: 'VidLiSync',
  publisher: 'VidLiSync',
  openGraph: {
    title: 'VidLiSync - Speak Any Language, Sound Like You',
    description: 'Real-time video chat with AI translation, voice cloning, and lip synchronization.',
    url: 'https://vidlisync.com',
    siteName: 'VidLiSync',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'VidLiSync - Real-time video translation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VidLiSync - Speak Any Language, Sound Like You',
    description: 'Real-time video chat with AI translation, voice cloning, and lip synchronization.',
    images: ['/og-image.jpg'],
    creator: '@vidlisync',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}