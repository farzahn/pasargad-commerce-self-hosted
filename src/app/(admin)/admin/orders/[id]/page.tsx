'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Send,
  Truck,
  XCircle,
  CreditCard,
  Package,
  CheckCircle,
  Download,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getStatusColor, getStatusDisplayName } from '@/lib/config'
import { getPocketBaseClient } from '@/lib/pocketbase'
import type { Order, OrderStatus, StatusHistoryEntry } from '@/types/pocketbase'

interface OrderPageProps {
  params: Promise<{ id: string }>
}

const statusActions: Record<
  OrderStatus,
  { next: OrderStatus | null; label: string; icon: React.ElementType }
> = {
  pending_review: { next: 'invoice_sent', label: 'Send Invoice', icon: Send },
  invoice_sent: {
    next: 'payment_received',
    label: 'Mark Payment Received',
    icon: CreditCard,
  },
  payment_received: {
    next: 'processing',
    label: 'Start Processing',
    icon: Package,
  },
  processing: { next: 'shipped', label: 'Mark Shipped', icon: Truck },
  shipped: { next: 'delivered', label: 'Mark Delivered', icon: CheckCircle },
  delivered: { next: null, label: 'Completed', icon: Package },
  cancelled: { next: null, label: 'Cancelled', icon: XCircle },
}

export default function AdminOrderPage({ params }: OrderPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingCarrier, setTrackingCarrier] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')

  useEffect(() => {
    async function fetchOrder() {
      try {
        const pb = getPocketBaseClient()
        const orderData = await pb.collection('orders').getOne<Order>(id)
        if (orderData) {
          setOrder(orderData)
          setAdminNotes(orderData.adminNotes || '')
        } else {
          router.push('/admin/orders')
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        router.push('/admin/orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id, router])

  const updateStatus = async (newStatus: OrderStatus, note?: string) => {
    if (!order) return

    setUpdating(true)
    try {
      const pb = getPocketBaseClient()
      const now = new Date().toISOString()

      const newHistoryEntry: StatusHistoryEntry = {
        status: newStatus,
        timestamp: now,
        note,
      }

      const updateData: Partial<Order> & Record<string, unknown> = {
        status: newStatus,
        statusHistory: [...order.statusHistory, newHistoryEntry],
      }

      if (newStatus === 'invoice_sent') {
        updateData.invoiceSentAt = now
        // Set payment due 14 days from now
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 14)
        updateData.paymentDueAt = dueDate.toISOString()
      }

      if (newStatus === 'shipped' && trackingNumber) {
        updateData.tracking = {
          carrier: trackingCarrier,
          number: trackingNumber,
          url: trackingUrl,
        }
      }

      if (newStatus === 'cancelled') {
        updateData.cancelledAt = now
        updateData.cancellationReason = note || 'Cancelled by admin'
      }

      await pb.collection('orders').update(order.id, updateData)

      // Update local state
      setOrder({
        ...order,
        ...updateData,
      } as Order)

      toast({
        title: 'Status updated',
        description: `Order status changed to ${getStatusDisplayName(newStatus)}`,
      })
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const saveNotes = async () => {
    if (!order) return

    try {
      const pb = getPocketBaseClient()
      await pb.collection('orders').update(order.id, { adminNotes })
      toast({
        title: 'Notes saved',
        description: 'Admin notes have been updated',
      })
    } catch (error) {
      console.error('Error saving notes:', error)
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!order) return null

  const statusColor = getStatusColor(order.status)
  const action = statusActions[order.status]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/orders">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
          <p className="text-muted-foreground">{formatDate(order.created)}</p>
        </div>
        <Badge
          style={{ backgroundColor: statusColor }}
          className="self-start px-4 py-1 text-base text-white"
        >
          {getStatusDisplayName(order.status)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      {item.variants && Object.keys(item.variants).length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {Object.entries(item.variants as Record<string, string>)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(' / ')}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.sku} - Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.totalPrice / 100)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal / 100)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>
                    {order.shippingCost === 0
                      ? 'FREE'
                      : formatCurrency(order.shippingCost / 100)}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({order.discountCode})</span>
                    <span>-{formatCurrency(order.discountAmount / 100)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total / 100)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium">Contact</h4>
                <p>{order.customerName}</p>
                <p className="text-muted-foreground">{order.customerEmail}</p>
              </div>
              <div>
                <h4 className="mb-2 font-medium">Shipping Address</h4>
                <address className="not-italic text-muted-foreground">
                  <p>{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.street}</p>
                  {order.shippingAddress.apt && <p>{order.shippingAddress.apt}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.zip}
                  </p>
                </address>
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
              <CardDescription>
                Private notes about this order (not visible to customer)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this order..."
                rows={4}
              />
              <Button onClick={saveNotes} variant="outline">
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Invoice
              </Button>

              <Button variant="outline" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>

              {action.next && order.status !== 'cancelled' && (
                <>
                  {action.next === 'shipped' ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" disabled={updating}>
                          <action.icon className="mr-2 h-4 w-4" />
                          {action.label}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Tracking Information</DialogTitle>
                          <DialogDescription>
                            Enter the shipping details for this order.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="carrier">Carrier</Label>
                            <Input
                              id="carrier"
                              value={trackingCarrier}
                              onChange={(e) => setTrackingCarrier(e.target.value)}
                              placeholder="USPS, UPS, FedEx..."
                            />
                          </div>
                          <div>
                            <Label htmlFor="tracking">Tracking Number</Label>
                            <Input
                              id="tracking"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              placeholder="1Z999AA10123456784"
                            />
                          </div>
                          <div>
                            <Label htmlFor="url">Tracking URL (optional)</Label>
                            <Input
                              id="url"
                              value={trackingUrl}
                              onChange={(e) => setTrackingUrl(e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => updateStatus('shipped')}
                            disabled={updating || !trackingNumber}
                          >
                            {updating ? (
                              <LoadingSpinner size="sm" className="mr-2" />
                            ) : null}
                            Mark as Shipped
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => updateStatus(action.next!)}
                      disabled={updating}
                    >
                      {updating ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <action.icon className="mr-2 h-4 w-4" />
                      )}
                      {action.label}
                    </Button>
                  )}
                </>
              )}

              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Order
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Order</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to cancel this order? This action
                        cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        onClick={() => updateStatus('cancelled', 'Cancelled by admin')}
                        disabled={updating}
                      >
                        {updating ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : null}
                        Cancel Order
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          {/* Tracking Info */}
          {order.tracking && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {order.tracking.carrier}
                </p>
                <p className="font-mono">{order.tracking.number}</p>
                {order.tracking.url && (
                  <a
                    href={order.tracking.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Track Package
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.statusHistory.map((history, index) => {
                  const historyColor = getStatusColor(history.status)
                  return (
                    <div key={index} className="flex gap-3">
                      <div
                        className="mt-1 h-3 w-3 rounded-full"
                        style={{ backgroundColor: historyColor }}
                      />
                      <div>
                        <p className="font-medium">
                          {getStatusDisplayName(history.status)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(history.timestamp)}
                        </p>
                        {history.note && (
                          <p className="text-sm text-muted-foreground">
                            {history.note}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
