'use client'

import type { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'

export interface DataTableColumn<T> {
  id: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  title: string
  description?: string
  toolbar?: ReactNode
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  skeletonColumns?: number
  skeletonRows?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  getRowId: (row: T) => string
  actions?: (row: T) => ReactNode
  footer?: ReactNode
}

export function DataTable<T>({
  title,
  description,
  toolbar,
  columns,
  data,
  loading = false,
  skeletonColumns,
  skeletonRows = 6,
  emptyTitle = 'No results found',
  emptyDescription = 'Try adjusting your filters or add a new item.',
  emptyAction,
  getRowId,
  actions,
  footer,
}: DataTableProps<T>) {
  const columnCount = skeletonColumns ?? columns.length

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {toolbar}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <DataTableSkeleton
            columns={columnCount}
            rows={skeletonRows}
            showActions={!!actions}
          />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.id}
                      className={column.headerClassName}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                  {actions && (
                    <TableHead className="w-[70px] text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + (actions ? 1 : 0)}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="font-medium text-foreground">{emptyTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {emptyDescription}
                        </p>
                        {emptyAction}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => (
                    <TableRow key={getRowId(row)} className="hover:bg-muted/40">
                      {columns.map((column) => (
                        <TableCell key={column.id} className={column.className}>
                          {column.cell(row)}
                        </TableCell>
                      ))}
                      {actions && (
                        <TableCell className="text-right">{actions(row)}</TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        {footer}
      </CardContent>
    </Card>
  )
}
