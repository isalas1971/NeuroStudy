import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'NeuroStudy - Tu Compañero de Estudio',
  description: 'Plataforma de estudio personalizada para estudiantes con TDAH, dislexia y TEA. Seguí tu progreso, organizá tus tareas y aprendé mejor.',
  keywords: ['estudio', 'educación', 'TDAH', 'dislexia', 'autismo', 'accesibilidad', 'estudiantes'],
  authors: [{ name: 'NeuroStudy' }],
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7fa' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background">
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
