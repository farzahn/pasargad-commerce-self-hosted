'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { useCart } from '@/hooks/use-cart';
import { useAuthContext } from '@/components/shared/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, calculateShipping } from '@/lib/utils';
import { validateDiscountCode, calculateDiscount } from '@/lib/pocketbase';
import { useState } from 'react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, clearCart, applyDiscount, removeDiscount, discountCode: appliedCode, discountAmount } = useCart();
  const { user, signIn } = useAuthContext();
  const { toast } = useToast();
  const [discountInput, setDiscountInput] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  const subtotalDollars = subtotal / 100; // Convert from cents
  const discountDollars = discountAmount / 100;
  const shipping = calculateShipping(subtotalDollars - discountDollars);
  const total = subtotalDollars - discountDollars + shipping;

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;

    setIsApplyingDiscount(true);
    try {
      const discount = await validateDiscountCode(discountInput, subtotal);
      if (discount) {
        const amount = calculateDiscount(discount, subtotal);
        applyDiscount(discount.code, amount);
        setDiscountInput('');
        toast({
          title: 'Discount applied',
          description: `Code "${discount.code}" applied successfully.`,
        });
      } else {
        toast({
          title: 'Invalid code',
          description: 'This discount code is invalid or has expired.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to apply discount code:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply discount code.',
        variant: 'destructive',
      });
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet."
          action={
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={`${item.productId}-${item.variant || 'default'}`}>
                <CardContent className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">
                          Variant: {item.variant}
                        </p>
                      )}
                      {item.sku && (
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.sku}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.variant,
                              item.quantity - 1
                            )
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.variant,
                              item.quantity + 1
                            )
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Price */}
                      <p className="font-semibold">
                        {formatCurrency((item.unitPrice * item.quantity) / 100)}
                      </p>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="self-start text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.productId, item.variant)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Clear Cart */}
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={clearCart}>
              Clear Cart
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Discount Code */}
              {appliedCode ? (
                <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {appliedCode}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      -{formatCurrency(discountDollars)} off
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeDiscount}
                    className="text-green-700 hover:text-green-900 dark:text-green-300"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Discount code"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyDiscount}
                    disabled={isApplyingDiscount}
                  >
                    {isApplyingDiscount ? 'Applying...' : 'Apply'}
                  </Button>
                </div>
              )}

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotalDollars)}</span>
                </div>
                {discountDollars > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountDollars)}</span>
                  </div>
                )}
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
                {subtotalDollars - discountDollars < 50 && (
                  <p className="text-xs text-muted-foreground">
                    Add {formatCurrency(50 - (subtotalDollars - discountDollars))} more for free
                    shipping!
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </CardContent>
            <CardFooter>
              {user ? (
                <Button asChild className="w-full">
                  <Link href="/checkout">
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button className="w-full" onClick={() => signIn()}>
                  Sign in to Checkout
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Shipping Info */}
          <div className="mt-4 rounded-lg border p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Shipping Information</p>
            <p className="mt-1">Free shipping on orders over $50</p>
            <p className="mt-1">Processing time: 3-5 business days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
