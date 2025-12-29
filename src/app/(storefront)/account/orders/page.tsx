'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useAuthContext } from '@/components/shared/auth-provider';
import { getUserOrders } from '@/lib/pocketbase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getStatusDisplayName, getStatusColor } from '@/lib/config';
import type { Order } from '@/types/pocketbase';

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      getUserOrders(user.id)
        .then((result) => setOrders(result.items))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="container flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/account">
            <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
            Back to Account
          </Link>
        </Button>
      </div>

      <h1 className="mb-8 text-3xl font-bold">Order History</h1>

      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you place an order, it will appear here."
          action={
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusColor = getStatusColor(order.status);
            const statusLabel = getStatusDisplayName(order.status);
            return (
              <Card key={order.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">
                      {order.orderNumber}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(order.created)}
                    </CardDescription>
                  </div>
                  <Badge
                    style={{ backgroundColor: statusColor }}
                    className="text-white"
                  >
                    {statusLabel}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} item
                        {order.items.length !== 1 ? 's' : ''}
                      </p>
                      <p className="font-semibold">
                        {formatCurrency(order.total / 100)}
                      </p>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href={`/account/orders/${order.id}`}>
                        View Details
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
