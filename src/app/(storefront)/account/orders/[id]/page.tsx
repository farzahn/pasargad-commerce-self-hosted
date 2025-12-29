'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  Truck,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useAuthContext } from '@/components/shared/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { getOrderById, cancelOrder } from '@/lib/pocketbase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getStatusDisplayName, getStatusColor } from '@/lib/config';
import type { Order } from '@/types/pocketbase';

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderPage({ params }: OrderPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const isNewOrder = searchParams.get('new') === 'true';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user && id) {
      getOrderById(id)
        .then((orderData) => {
          if (orderData && orderData.userId === user.id) {
            setOrder(orderData);
          } else {
            router.push('/account/orders');
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, id, router]);

  const canCancel =
    order &&
    ['pending_review', 'invoice_sent', 'payment_received'].includes(order.status);

  const handleCancel = async () => {
    if (!order) return;

    setCancelling(true);
    try {
      const updatedOrder = await cancelOrder(order.id, 'Cancelled by customer');
      setOrder(updatedOrder);

      toast({
        title: 'Order cancelled',
        description: 'Your order has been cancelled successfully.',
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const statusColor = getStatusColor(order.status);
  const statusLabel = getStatusDisplayName(order.status);

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/account/orders">
            <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
            Back to Orders
          </Link>
        </Button>
      </div>

      {/* New Order Confirmation */}
      {isNewOrder && (
        <Card className="mb-8 border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="flex items-center gap-4 py-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-semibold">Order Placed Successfully!</p>
              <p className="text-sm text-muted-foreground">
                You&apos;ll receive a confirmation email shortly.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
              <p className="text-muted-foreground">
                Placed on {formatDate(order.created)}
              </p>
            </div>
            <Badge
              style={{ backgroundColor: statusColor }}
              className="self-start text-white"
            >
              {statusLabel}
            </Badge>
          </div>

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
                          {Object.entries(item.variants)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(' / ')}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} @ {formatCurrency(item.unitPrice / 100)}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.totalPrice / 100)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal / 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {order.shippingCost === 0
                      ? 'FREE'
                      : formatCurrency(order.shippingCost / 100)}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({order.discountCode})</span>
                    <span>-{formatCurrency(order.discountAmount / 100)}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.total / 100)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <address className="not-italic">
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.street}</p>
                {order.shippingAddress.apt && <p>{order.shippingAddress.apt}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.zip}
                </p>
              </address>
            </CardContent>
          </Card>

          {/* Tracking */}
          {order.tracking && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Tracking Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Carrier: {order.tracking.carrier}
                </p>
                <p className="font-mono">{order.tracking.number}</p>
                {order.tracking.url && (
                  <Button variant="link" asChild className="mt-2 px-0">
                    <a
                      href={order.tracking.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Track Package
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={cancelling}
                    >
                      {cancelling ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Cancel Order
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this order? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Order</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancel}>
                        Cancel Order
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.statusHistory.map((history, index) => {
                  const historyColor = getStatusColor(history.status);
                  const historyLabel = getStatusDisplayName(history.status);
                  return (
                    <div key={index} className="flex gap-3">
                      <div
                        className="mt-1 h-3 w-3 rounded-full"
                        style={{ backgroundColor: historyColor }}
                      />
                      <div>
                        <p className="font-medium">{historyLabel}</p>
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
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
