import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: '#0c0d0f' }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          {/* Logo desde public/logo.png */}
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg">
            <Image src="/logo.png" alt="InventFlow" width={36} height={36} className="h-9 w-9 object-contain" />
          </div>
          <span className="text-xl font-semibold tracking-tight" style={{ color: '#f1efe9' }}>InventFlow</span>
        </div>
        {children}
      </div>
    </div>
  )
}
