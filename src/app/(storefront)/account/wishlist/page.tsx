'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ChevronRight, Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useAuthContext } from '@/components/shared/auth-provider';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { getWishlistProducts, removeFromWishlist, getProductImageUrl } from '@/lib/pocketbase';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types/pocketbase';

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { addItem } = useCart();
  const { toast } = useToast();

  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const products = await getWishlistProducts(user.id);
      setWishlistProducts(products);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wishlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchWishlist();
    }
  }, [user, authLoading, router, fetchWishlist]);

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!user) return;

    setRemovingId(productId);
    try {
      await removeFromWishlist(user.id, productId);
      setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));

      toast({
        title: 'Removed from wishlist',
        description: 'Product has been removed from your wishlist.',
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove from wishlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = (product: Product) => {
    // Add to cart with default options
    const defaultSize = product.sizes?.[0]?.name || '';
    const defaultColor = product.colors?.[0]?.name || '';
    const defaultOption = product.options?.[0]?.name || '';

    // Calculate price with default options
    const sizeModifier = product.sizes?.[0]?.priceModifier || 0;
    const colorModifier = product.colors?.[0]?.priceModifier || 0;
    const optionModifier = product.options?.[0]?.priceModifier || 0;
    const totalPrice = product.basePrice + sizeModifier + colorModifier + optionModifier;

    // Build variant string from defaults
    const variantParts = [defaultSize, defaultColor, defaultOption].filter(Boolean);
    const variant = variantParts.length > 0 ? variantParts.join(' / ') : undefined;

    addItem({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      variant,
      quantity: 1,
      unitPrice: totalPrice,
      productImage: product.images?.[0] ? getProductImageUrl(product, 0) : undefined,
    });

    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

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

      <h1 className="mb-8 text-3xl font-bold">My Wishlist</h1>

      {wishlistProducts.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save products you love to your wishlist and find them here anytime."
          action={
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlistProducts.map((product) => {
            const imageUrl = product.images?.[0]
              ? getProductImageUrl(product, 0)
              : null;

            return (
              <Card key={product.id} className="group overflow-hidden">
                <Link href={`/products/${product.slug}`}>
                  <div className="relative aspect-square overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <span className="text-muted-foreground">No image</span>
                      </div>
                    )}
                  </div>
                </Link>

                <CardContent className="p-4">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-medium line-clamp-1 hover:text-primary">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-semibold">
                      {formatCurrency(product.basePrice / 100)}
                      {(product.sizes?.some((s) => s.priceModifier !== 0) ||
                        product.options?.some((o) => o.priceModifier !== 0)) && (
                        <span className="text-xs font-normal text-muted-foreground">
                          +
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      disabled={removingId === product.id}
                    >
                      {removingId === product.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="sr-only">Remove from wishlist</span>
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
