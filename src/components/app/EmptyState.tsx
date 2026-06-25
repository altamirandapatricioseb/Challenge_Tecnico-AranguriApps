'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-1">{actionLabel}</Button>
      )}
    </div>
  )
}