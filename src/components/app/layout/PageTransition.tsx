'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'


export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const firstRender = useRef(true)

  useEffect(() => {
    setVisible(false)
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
    firstRender.current = false
    return () => cancelAnimationFrame(id)
  }, [pathname])

  return (
    <div
      key={pathname}
      className={
        'transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none ' +
        (visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3')
      }
    >
      {children}
    </div>
  )
}
