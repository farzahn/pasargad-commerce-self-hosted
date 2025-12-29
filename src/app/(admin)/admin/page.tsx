'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  ArrowRight,
  Users,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getStatusColor, getStatusDisplayName } from '@/lib/config'
import { getPocketBaseClient } from '@/lib/pocketbase'
import type { Order, Product, User, ContactMessage } from '@/types/pocketbase'

interface DashboardStats {
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  totalCustomers: number
  unreadMessages: number
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    unreadMessages: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const pb = getPocketBaseClient()

        // Fetch all data in parallel
        const [ordersResult, productsResult, usersResult, messagesResult] =
          await Promise.allSettled([
            pb.collection('orders').getList<Order>(1, 500, { sort: '-id' }),
            pb.collection('products').getList<Product>(1, 500),
            pb.collection('users').getList<User>(1, 500),
            pb
              .collection('messages')
              .getList<ContactMessage>(1, 500, { filter: 'isRead = false && isArchived = false' }),
          ])

        const ordersData =
          ordersResult.status === 'fulfilled' ? ordersResult.value.items : []
        const productsData =
          productsResult.status === 'fulfilled' ? productsResult.value.items : []
        const usersData =
          usersResult.status === 'fulfilled' ? usersResult.value.items : []
        const messagesData =
          messagesResult.status === 'fulfilled' ? messagesResult.value.items : []

        // Log errors for debugging
        if (ordersResult.status === 'rejected') {
          console.error('Error fetching orders:', ordersResult.reason)
        }
        if (productsResult.status === 'rejected') {
          console.error('Error fetching products:', productsResult.reason)
        }
        if (usersResult.status === 'rejected') {
          console.error('Error fetching users:', usersResult.reason)
        }
        if (messagesResult.status === 'rejected') {
          console.error('Error fetching messages:', messagesResult.reason)
        }

        // Calculate stats
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

        let todayRevenue = 0
        let weekRevenue = 0
        let monthRevenue = 0
        let pendingOrders = 0

        ordersData.forEach((order) => {
          const orderDate = new Date(order.created)

          // Only count completed orders for revenue (exclude cancelled and pending_review)
          if (!['cancelled', 'pending_review'].includes(order.status)) {
            if (orderDate >= today) todayRevenue += order.total
            if (orderDate >= weekAgo) weekRevenue += order.total
            if (orderDate >= monthAgo) monthRevenue += order.total
          }

          if (order.status === 'pending_review') pendingOrders++
        })

        setStats({
          totalOrders: ordersData.length,
          pendingOrders,
          totalProducts: productsData.length,
          totalCustomers: usersData.length,
          unreadMessages: messagesData.length,
          todayRevenue,
          weekRevenue,
          monthRevenue,
        })

        // Get recent orders (first 5)
        setRecentOrders(ordersData.slice(0, 5))
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Find orders pending for over 24 hours
  const pendingOrders24h = recentOrders.filter((order) => {
    if (order.status !== 'pending_review') return false
    const orderDate = new Date(order.created)
    const now = new Date()
    const hoursSinceOrder =
      (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60)
    return hoursSinceOrder > 24
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue (Week)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.weekRevenue / 100)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue (Month)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.monthRevenue / 100)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(pendingOrders24h.length > 0 || stats.unreadMessages > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {pendingOrders24h.length > 0 && (
            <Card className="border-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  Orders Needing Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {pendingOrders24h.length} order(s) pending for over 24 hours
                </p>
                <Button variant="link" asChild className="mt-2 px-0">
                  <Link href="/admin/orders?status=pending_review">
                    View Orders
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {stats.unreadMessages > 0 && (
            <Card className="border-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <MessageSquare className="h-5 w-5" />
                  Unread Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {stats.unreadMessages} unread message(s)
                </p>
                <Button variant="link" asChild className="mt-2 px-0">
                  <Link href="/admin/messages">
                    View Messages
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders from your store</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/orders">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No orders yet
            </p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => {
                const statusColor = getStatusColor(order.status)
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {order.customerName} - {formatDate(order.created)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">
                        {formatCurrency(order.total / 100)}
                      </span>
                      <Badge
                        style={{ backgroundColor: statusColor }}
                        className="text-white"
                      >
                        {getStatusDisplayName(order.status)}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/products/new">Add Product</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/discounts/new">Create Discount</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/orders?status=pending_review">
              Review Pending Orders
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
