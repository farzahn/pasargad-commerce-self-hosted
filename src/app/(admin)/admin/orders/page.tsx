'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Search, Filter, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ORDER_STATUSES, getOrderStatusConfig, LIMITS } from '@/lib/constants'
import { getPocketBaseClient, createQuery } from '@/lib/pocketbase'
import { loggers } from '@/lib/logger'
import type { Order } from '@/types/pocketbase'

interface PaginationState {
  page: number
  totalPages: number
  totalItems: number
}

export default function AdminOrdersPage() {
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status') || 'all'

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(statusFilter)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  })

  // Build filter query for server-side filtering
  const buildServerFilter = useCallback((status: string, searchQuery: string) => {
    const query = createQuery()
    let hasCondition = false

    // Add status filter
    if (status !== 'all') {
      query.where('status', '=', status)
      hasCondition = true
    }

    // Add search filter (server-side partial match)
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.trim()
      const searchCondition = `(orderNumber ~ "${searchTerm}" || customerName ~ "${searchTerm}" || customerEmail ~ "${searchTerm}")`
      if (hasCondition) {
        query.andRaw(searchCondition)
      } else {
        query.raw(searchCondition)
      }
    }

    return query.build()
  }, [])

  // Fetch orders with pagination
  const fetchOrders = useCallback(async (page: number, resetPagination = false) => {
    if (resetPagination) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const pb = getPocketBaseClient()
      const filter = buildServerFilter(selectedStatus, search)

      const result = await pb.collection('orders').getList<Order>(
        page,
        LIMITS.ADMIN_DEFAULT_PAGE_SIZE,
        {
          filter: filter || undefined,
          sort: '-created',
        }
      )

      setOrders(result.items)
      setPagination({
        page: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
      })
    } catch (error) {
      loggers.orders.error('Error fetching orders', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [selectedStatus, search, buildServerFilter])

  // Initial load
  useEffect(() => {
    fetchOrders(1, true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when filters change (with debounce for search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders(1, true)
    }, search ? 300 : 0) // Debounce search input

    return () => clearTimeout(timeoutId)
  }, [selectedStatus, search]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchOrders(page)
    }
  }

  const goToFirstPage = () => goToPage(1)
  const goToPrevPage = () => goToPage(pagination.page - 1)
  const goToNextPage = () => goToPage(pagination.page + 1)
  const goToLastPage = () => goToPage(pagination.totalPages)

  // Computed values
  const startItem = (pagination.page - 1) * LIMITS.ADMIN_DEFAULT_PAGE_SIZE + 1
  const endItem = Math.min(pagination.page * LIMITS.ADMIN_DEFAULT_PAGE_SIZE, pagination.totalItems)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>
        {pagination.totalItems > 0 && (
          <p className="text-sm text-muted-foreground">
            {pagination.totalItems} total order{pagination.totalItems !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order #, name, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(ORDER_STATUSES).map(([key, statusConfig]) => (
                  <SelectItem key={key} value={key}>
                    {statusConfig.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {orders.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No orders found"
          description={
            search || selectedStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Orders will appear here when customers place them'
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = getOrderStatusConfig(order.status)
              return (
                <Card key={order.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-semibold hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        <Badge
                          style={{ backgroundColor: statusConfig.color }}
                          className="text-white"
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.customerName} - {order.customerEmail}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.created)} - {order.items.length} item(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold">
                        {formatCurrency(order.total / 100)}
                      </span>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/orders/${order.id}`}>
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {startItem}-{endItem} of {pagination.totalItems}
              </p>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToFirstPage}
                  disabled={pagination.page === 1 || loadingMore}
                  title="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevPage}
                  disabled={pagination.page === 1 || loadingMore}
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="mx-2 text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextPage}
                  disabled={pagination.page === pagination.totalPages || loadingMore}
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToLastPage}
                  disabled={pagination.page === pagination.totalPages || loadingMore}
                  title="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>

                {loadingMore && (
                  <LoadingSpinner size="sm" className="ml-2" />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
