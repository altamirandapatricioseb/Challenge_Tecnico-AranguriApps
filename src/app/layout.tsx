import type { Metadata } from 'next'
import { Roboto, Roboto_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

// Fuente principal de toda la interfaz
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
  display: 'swap',
})

// Fuente monoespaciada para datos: numeros, SKUs, codigos
const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'InventFlow',
  description: 'Sistema de gestión de inventario',
  // Icono de la pestaña del navegador: usa logo.png de la carpeta public
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${roboto.variable} ${robotoMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" theme="dark" />
      </body>
    </html>
  )
}
