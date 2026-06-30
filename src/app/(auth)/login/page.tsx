import { LoginForm } from './LoginForm'

// La pagina es Server Component: lee searchParams sin useSearchParams (que rompia
// el prerender del build). Le pasa al form si el usuario fue dado de baja.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ deactivated?: string }>
}) {
  const params = await searchParams
  const deactivated = params.deactivated === '1'

  return <LoginForm deactivated={deactivated} />
}
