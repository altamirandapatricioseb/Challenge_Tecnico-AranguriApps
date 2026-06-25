import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'InventFlow — Gestión de inventario',
  description: 'Sistema de gestión de stock y movimientos para PYMEs',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}

import { DashboardShell } from '@/components/app/layout/DashboardShell'

//  usuario de prueba para previsualizar la UI sin autenticación este layout pasa a ser async y obtiene el usuario real con getUser().
const MOCK_USER = {
  name: 'Patricio Altamiranda',
  email: 'patricio@test.app',
  role: 'admin' as const,
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell user={MOCK_USER}>{children}</DashboardShell>
}