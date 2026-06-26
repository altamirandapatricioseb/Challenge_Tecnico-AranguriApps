'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Mensaje genérico: no revelar si el email existe (buena práctica de seguridad).
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }

    // refresh() fuerza al middleware a re-evaluar la sesión y redirigir al dashboard.
    router.push('/')
    router.refresh()
  }

  return (
    <Card className="p-6">
      <div className="mb-5 space-y-1">
        <h1 className="text-lg font-semibold text-slate-900">Iniciar sesión</h1>
        <p className="text-sm text-slate-500">Ingresá tus credenciales para continuar.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <Button onClick={handleSubmit} disabled={loading || !email || !password} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ingresando…
            </>
          ) : (
            'Iniciar sesión'
          )}
        </Button>
      </div>

      <p className="mt-5 text-center text-sm text-slate-500">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="font-medium hover:opacity-80" style={{ color: '#eab308' }}>
          Registrate
        </Link>
      </p>
    </Card>
  )
}
