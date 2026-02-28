// components/SubdomainLink.tsx
'use client'

import { useState, useCallback } from 'react'

interface Props {
  href: string
  children: React.ReactNode
  className?: string
}

export default function SubdomainLink({ href, children, className }: Props) {
  const [loading, setLoading] = useState(false)

  const prefetch = useCallback(() => {
    fetch(href, { method: 'GET', mode: 'no-cors' }).catch(() => {})
  }, [href])

  return (
    <a
      href={href}
      className={className}
      onMouseEnter={prefetch}   // warms cache on hover
      onTouchStart={prefetch}   // warms cache on mobile
      onClick={() => setLoading(true)}
    >
      {loading ? '...' : children}
    </a>
  )
}