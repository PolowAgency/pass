import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'PASS — Révise 10x plus vite avec l\'IA',
  description: 'Upload ton cours, reçois des fiches de révision IA et un QCM en moins de 30 secondes. Un coach IA qui te parle vrai.',
  keywords: ['révision', 'fiches', 'IA', 'QCM', 'étudiant', 'exam', 'BAC', 'médecine', 'prépa'],
  openGraph: {
    title: 'PASS — Révise 10x plus vite avec l\'IA',
    description: 'Des fiches de révision générées par IA en 30 secondes.',
    type: 'website',
    siteName: 'PASS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PASS — Révise 10x plus vite avec l\'IA',
    description: 'Des fiches de révision générées par IA en 30 secondes.',
  },
  themeColor: '#C8FF00',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PASS',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png',   sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/icon-192.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="h-full antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1E1E28',
              color: '#F0F0F8',
              border: '1px solid #2A2A38',
              borderRadius: '12px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#C8FF00', secondary: '#0C0C10' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#0C0C10' },
            },
          }}
        />
      </body>
    </html>
  )
}
