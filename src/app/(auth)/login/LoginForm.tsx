'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Si el middleware expulso a un usuario eliminado, llega con ?deactivated=1
  const wasDeactivated = searchParams.get('deactivated') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(wasDeactivated ? 'Este usuario fue eliminado.' : null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Mensaje genérico: no revelar si el email existe (buena práctica de seguridad).
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }

    // El usuario se autentico bien. Antes de dejarlo entrar, verificamos que no
    // haya sido eliminado (soft delete): si su perfil esta inactivo, cerramos la
    // sesion y no lo dejamos pasar.
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profile && profile.is_active === false) {
        await supabase.auth.signOut()
        setError('Este usuario fue eliminado.')
        setLoading(false)
        return
      }
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
          {/* El input con boton de mostrar/ocultar dentro del campo */}
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={loading}
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 disabled:opacity-50"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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
