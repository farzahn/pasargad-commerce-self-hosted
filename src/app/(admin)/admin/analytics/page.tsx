'use client'

import { useEffect, useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { formatCurrency } from '@/lib/utils'
import { getStatusColor, getStatusDisplayName } from '@/lib/config'
import { getPocketBaseClient } from '@/lib/pocketbase'
import type { Order, Product, OrderStatus } from '@/types/pocketbase'

interface AnalyticsData {
  // Revenue metrics
  totalRevenue: number
  monthlyRevenue: number
  weeklyRevenue: number
  dailyRevenue: number
  averageOrderValue: number

  // Order metrics
  totalOrders: number
  completedOrders: number
  cancelledOrders: number
  pendingOrders: number

  // Product metrics
  totalProducts: number
  topSellingProducts: { name: string; quantity: number; revenue: number }[]

  // Status breakdown
  ordersByStatus: Record<string, number>

  // Trends
  revenueGrowth: number // percentage change from previous period
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const pb = getPocketBaseClient()
        const [ordersResult, productsResult] = await Promise.all([
          pb.collection('orders').getList<Order>(1, 500),
          pb.collection('products').getList<Product>(1, 500),
        ])
        const orders = ordersResult.items
        const products = productsResult.items

        // Date calculations
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)

        // Revenue calculations (exclude cancelled and pending_review orders)
        let totalRevenue = 0
        let monthlyRevenue = 0
        let weeklyRevenue = 0
        let dailyRevenue = 0
        let previousMonthRevenue = 0
        let completedOrders = 0
        let cancelledOrders = 0
        let pendingOrders = 0

        const ordersByStatus: Record<string, number> = {}
        const productSales: Record<
          string,
          { name: string; quantity: number; revenue: number }
        > = {}

        orders.forEach((order) => {
          const orderDate = new Date(order.created)

          // Count by status
          ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1

          // Status categorization
          if (order.status === 'cancelled') {
            cancelledOrders++
          } else if (order.status === 'pending_review') {
            pendingOrders++
          } else if (order.status === 'delivered') {
            completedOrders++
          }

          // Revenue calculations (exclude cancelled and pending)
          if (!['cancelled', 'pending_review'].includes(order.status)) {
            totalRevenue += order.total

            if (orderDate >= today) {
              dailyRevenue += order.total
            }
            if (orderDate >= weekAgo) {
              weeklyRevenue += order.total
            }
            if (orderDate >= monthAgo) {
              monthlyRevenue += order.total
            }
            if (orderDate >= twoMonthsAgo && orderDate < monthAgo) {
              previousMonthRevenue += order.total
            }

            // Track product sales
            order.items.forEach((item) => {
              if (!productSales[item.productId]) {
                productSales[item.productId] = {
                  name: item.productName,
                  quantity: 0,
                  revenue: 0,
                }
              }
              productSales[item.productId].quantity += item.quantity
              productSales[item.productId].revenue += item.totalPrice
            })
          }
        })

        // Calculate average order value
        const validOrders = orders.filter(
          (o) => !['cancelled', 'pending_review'].includes(o.status)
        )
        const averageOrderValue =
          validOrders.length > 0 ? totalRevenue / validOrders.length : 0

        // Calculate revenue growth
        const revenueGrowth =
          previousMonthRevenue > 0
            ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) *
              100
            : monthlyRevenue > 0
            ? 100
            : 0

        // Get top selling products
        const topSellingProducts = Object.values(productSales)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)

        setAnalytics({
          totalRevenue,
          monthlyRevenue,
          weeklyRevenue,
          dailyRevenue,
          averageOrderValue,
          totalOrders: orders.length,
          completedOrders,
          cancelledOrders,
          pendingOrders,
          totalProducts: products.length,
          topSellingProducts,
          ordersByStatus,
          revenueGrowth,
        })
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          <span>Store Performance Overview</span>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.totalRevenue / 100)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            {analytics.revenueGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.monthlyRevenue / 100)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span
                className={
                  analytics.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'
                }
              >
                {analytics.revenueGrowth >= 0 ? '+' : ''}
                {analytics.revenueGrowth.toFixed(1)}%
              </span>{' '}
              vs last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.weeklyRevenue / 100)}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.averageOrderValue / 100)}
            </div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Order Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalOrders > 0
                ? (
                    (analytics.completedOrders / analytics.totalOrders) *
                    100
                  ).toFixed(1)
                : 0}
              % completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Package className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.cancelledOrders}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalOrders > 0
                ? (
                    (analytics.cancelledOrders / analytics.totalOrders) *
                    100
                  ).toFixed(1)
                : 0}
              % cancellation rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>
              Breakdown of all orders by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.ordersByStatus).map(([status, count]) => {
                const statusColor = getStatusColor(status)
                const percentage =
                  analytics.totalOrders > 0
                    ? (count / analytics.totalOrders) * 100
                    : 0

                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: statusColor }}
                        />
                        <span>{getStatusDisplayName(status)}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: statusColor,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
              {Object.keys(analytics.ordersByStatus).length === 0 && (
                <p className="py-4 text-center text-muted-foreground">
                  No orders yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performers by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topSellingProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.quantity} sold
                      </p>
                    </div>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(product.revenue / 100)}
                  </span>
                </div>
              ))}
              {analytics.topSellingProducts.length === 0 && (
                <p className="py-4 text-center text-muted-foreground">
                  No sales data yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Store Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total Products</dt>
                <dd className="font-medium">{analytics.totalProducts}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Today&apos;s Revenue</dt>
                <dd className="font-medium">
                  {formatCurrency(analytics.dailyRevenue / 100)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Orders in Progress</dt>
                <dd className="font-medium">
                  {analytics.totalOrders -
                    analytics.completedOrders -
                    analytics.cancelledOrders}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {analytics.pendingOrders > 0 && (
                <li className="flex items-center gap-2 text-amber-600">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  {analytics.pendingOrders} order(s) pending review
                </li>
              )}
              {analytics.revenueGrowth > 0 && (
                <li className="flex items-center gap-2 text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Revenue is up {analytics.revenueGrowth.toFixed(1)}% this month
                </li>
              )}
              {analytics.revenueGrowth < 0 && (
                <li className="flex items-center gap-2 text-red-600">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Revenue is down {Math.abs(analytics.revenueGrowth).toFixed(1)}%
                  this month
                </li>
              )}
              {analytics.completedOrders > 0 && (
                <li className="flex items-center gap-2 text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {analytics.completedOrders} order(s) successfully delivered
                </li>
              )}
              {analytics.totalOrders === 0 && (
                <li className="text-muted-foreground">
                  No orders yet. Start promoting your store!
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
