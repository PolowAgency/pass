import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PASS — Révision IA',
    short_name: 'PASS',
    description: 'Génère tes fiches de révision et QCM en 30 secondes avec l\'IA',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0C0C10',
    theme_color: '#C8FF00',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
