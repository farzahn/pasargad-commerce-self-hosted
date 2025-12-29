'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Search, Filter } from 'lucide-react'
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
import { getStatusColor, getStatusDisplayName } from '@/lib/config'
import { getPocketBaseClient } from '@/lib/pocketbase'
import type { Order, OrderStatus } from '@/types/pocketbase'

const ORDER_STATUSES: Record<OrderStatus, { label: string; color: string }> = {
  pending_review: { label: 'Pending Review', color: '#EAB308' },
  invoice_sent: { label: 'Invoice Sent', color: '#3B82F6' },
  payment_received: { label: 'Payment Received', color: '#06B6D4' },
  processing: { label: 'Processing', color: '#8B5CF6' },
  shipped: { label: 'Shipped', color: '#F97316' },
  delivered: { label: 'Delivered', color: '#22C55E' },
  cancelled: { label: 'Cancelled', color: '#EF4444' },
}

export default function AdminOrdersPage() {
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status') || 'all'

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(statusFilter)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const pb = getPocketBaseClient()
        const result = await pb.collection('orders').getList<Order>(1, 500, {
          sort: '-id',
        })
        setOrders(result.items)
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      search === '' ||
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      selectedStatus === 'all' || order.status === selectedStatus

    return matchesSearch && matchesStatus
  })

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
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
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
                {Object.entries(ORDER_STATUSES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
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
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusConfig = ORDER_STATUSES[order.status] || {
              label: order.status,
              color: getStatusColor(order.status),
            }
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
                        {getStatusDisplayName(order.status)}
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
      )}
    </div>
  )
}
