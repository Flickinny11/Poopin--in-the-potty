import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import { NotificationToasts } from '@/components/NotificationCenter'
import TutorialModal, { TutorialTrigger } from '@/components/TutorialModal'
import CookieConsentBanner from '@/components/compliance/CookieConsentBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VidLiSync - Speak Any Language, Sound Like You',
  description: 'Real-time video chat with AI translation. Break language barriers while preserving your unique voice with advanced voice cloning and lip synchronization technology.',
  keywords: 'video chat, AI translation, voice cloning, lip sync, real-time translation, multilingual communication',
  authors: [{ name: 'VidLiSync Team' }],
  creator: 'VidLiSync',
  publisher: 'VidLiSync',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'VidLiSync - Speak Any Language, Sound Like You',
    description: 'Real-time video chat with AI translation. Break language barriers while preserving your unique voice.',
    url: '/',
    siteName: 'VidLiSync',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'VidLiSync - Real-time video chat with AI translation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VidLiSync - Speak Any Language, Sound Like You',
    description: 'Real-time video chat with AI translation. Break language barriers while preserving your unique voice.',
    images: ['/og-image.svg'],
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
    google: 'google-site-verification-placeholder',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VidLiSync" />
        <link rel="apple-touch-icon" href="/icons/manifest-icon-192.maskable.png" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegistration />
        <NotificationToasts />
        <TutorialModal />
        <TutorialTrigger />
        <CookieConsentBanner />
        {children}
      </body>
    </html>
  )
}