'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

export interface RowAction {
  label: string
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
  separator?: boolean
}

interface RowActionsProps {
  actions: RowAction[]
}

export function RowActions({ actions }: RowActionsProps) {
  if (actions.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {actions.map((action, index) => (
          <div key={`${action.label}-${index}`}>
            {action.separator && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              disabled={action.disabled}
              variant={action.destructive ? 'destructive' : 'default'}
              onClick={action.onClick}
            >
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
