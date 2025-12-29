'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useCart } from '@/hooks/useCart';
import { useAuthContext } from '@/components/shared/auth-provider';
import { formatCurrency, calculateShipping } from '@/lib/utils';
import { createOrder, getUserAddresses } from '@/lib/pocketbase';
import { useToast } from '@/hooks/use-toast';
import type { ShippingAddress, Address, OrderItem } from '@/types/pocketbase';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, discountAmount, discountCode, clearCart } = useCart();
  const { user, loading: authLoading, signIn } = useAuthContext();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [address, setAddress] = useState<ShippingAddress>({
    name: '',
    street: '',
    apt: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
  });

  const subtotalDollars = subtotal / 100;
  const shipping = calculateShipping(subtotalDollars);
  const discountDollars = discountAmount / 100;
  const total = subtotalDollars + shipping - discountDollars;

  // Load saved addresses when user is available
  useEffect(() => {
    if (user) {
      getUserAddresses(user.id)
        .then((addresses) => {
          setSavedAddresses(addresses);
          // Auto-select default address
          const defaultAddr = addresses.find((a) => a.isDefault);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setAddress({
              name: defaultAddr.name,
              street: defaultAddr.street,
              apt: defaultAddr.apt || '',
              city: defaultAddr.city,
              state: defaultAddr.state,
              zip: defaultAddr.zip,
              country: defaultAddr.country || 'US',
              phone: defaultAddr.phone || '',
            });
          }
        })
        .catch(console.error);
    }
  }, [user]);

  // Update form when selecting a saved address
  useEffect(() => {
    if (selectedAddressId === 'new') {
      setAddress({
        name: '',
        street: '',
        apt: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
        phone: '',
      });
    } else {
      const savedAddr = savedAddresses.find((a) => a.id === selectedAddressId);
      if (savedAddr) {
        setAddress({
          name: savedAddr.name,
          street: savedAddr.street,
          apt: savedAddr.apt || '',
          city: savedAddr.city,
          state: savedAddr.state,
          zip: savedAddr.zip,
          country: savedAddr.country || 'US',
          phone: savedAddr.phone || '',
        });
      }
    }
  }, [selectedAddressId, savedAddresses]);

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Add some items to your cart before checking out."
          action={
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Sign in to checkout"
          description="You need to sign in to complete your order."
          action={<Button onClick={() => signIn()}>Sign in with Google</Button>}
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Validate address
    if (
      !address.name ||
      !address.street ||
      !address.city ||
      !address.state ||
      !address.zip
    ) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // Validate ZIP code (US only)
    if (!/^\d{5}(-\d{4})?$/.test(address.zip)) {
      toast({
        title: 'Invalid ZIP code',
        description: 'Please enter a valid US ZIP code.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems: OrderItem[] = items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        sku: item.sku || '',
        variant: item.variant,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
      }));

      const order = await createOrder({
        userId: user.id,
        customerEmail: user.email,
        customerName: user.name || address.name,
        items: orderItems,
        shippingAddress: address,
        subtotal: subtotal,
        shippingCost: Math.round(shipping * 100), // Convert to cents
        discountCode: discountCode || '',
        discountAmount: discountAmount,
        total: Math.round(total * 100), // Convert to cents
      });

      // Clear cart
      clearCart();

      // Redirect to confirmation
      router.push(`/account/orders/${order.id}?new=true`);

      toast({
        title: 'Order placed!',
        description: `Your order ${order.orderNumber} has been submitted.`,
      });
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: 'Error',
        description: 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Back Link */}
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/cart">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Link>
      </Button>

      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
                <CardDescription>
                  Enter your shipping address or select a saved address.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Saved Address Selector */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Address</Label>
                    <Select
                      value={selectedAddressId}
                      onValueChange={setSelectedAddressId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select address" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedAddresses.map((addr) => (
                          <SelectItem key={addr.id} value={addr.id}>
                            {addr.name} - {addr.street}, {addr.city}
                            {addr.isDefault && ' (Default)'}
                          </SelectItem>
                        ))}
                        <SelectItem value="new">Enter new address</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={address.name}
                    onChange={(e) =>
                      setAddress({ ...address, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    value={address.street}
                    onChange={(e) =>
                      setAddress({ ...address, street: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="apt">Apt / Suite / Unit (optional)</Label>
                  <Input
                    id="apt"
                    value={address.apt || ''}
                    onChange={(e) =>
                      setAddress({ ...address, apt: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="col-span-2 sm:col-span-1">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={address.city}
                      onChange={(e) =>
                        setAddress({ ...address, city: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select
                      value={address.state}
                      onValueChange={(value) =>
                        setAddress({ ...address, state: value })
                      }
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="zip">ZIP Code *</Label>
                    <Input
                      id="zip"
                      value={address.zip}
                      onChange={(e) =>
                        setAddress({ ...address, zip: e.target.value })
                      }
                      pattern="^\d{5}(-\d{4})?$"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={address.phone || ''}
                    onChange={(e) =>
                      setAddress({ ...address, phone: e.target.value })
                    }
                    placeholder="For delivery updates"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.variant || 'default'}`}
                      className="flex gap-3"
                    >
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <ShoppingCart className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-1">
                          {item.productName}
                        </p>
                        {item.variant && (
                          <p className="text-xs text-muted-foreground">
                            {item.variant}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatCurrency((item.unitPrice * item.quantity) / 100)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotalDollars)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        formatCurrency(shipping)
                      )}
                    </span>
                  </div>
                  {discountDollars > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(discountDollars)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  By placing this order, you&apos;ll receive an invoice via email.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
