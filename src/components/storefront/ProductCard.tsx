'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useIsInWishlist, useWishlistLoading, useWishlist } from '@/hooks/use-wishlist';
import type { Product } from '@/types/pocketbase';
import { formatCurrency } from '@/lib/utils';
import { getProductImageUrl } from '@/lib/pocketbase';

interface ProductCardProps {
  product: Product;
}

function ProductCardComponent({ product }: ProductCardProps) {
  // Use optimized selectors for reduced re-renders
  const isInWishlistValue = useIsInWishlist(product.id);
  const loading = useWishlistLoading();
  const { toggleWishlist } = useWishlist();
  const primaryImage = product.images?.[0];
  const imageUrl = primaryImage
    ? getProductImageUrl(product, 0)
    : null;

  // Check if product has price modifiers in any variant
  const hasPriceModifiers =
    product.sizes?.some((s) => s.priceModifier !== 0) ||
    product.colors?.some((c) => c.priceModifier !== 0) ||
    product.options?.some((o) => o.priceModifier !== 0);

  return (
    <Card className="group overflow-hidden">
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

          {/* Badges */}
          {product.badge && (
            <Badge
              variant={product.badge as 'new' | 'sale'}
              className="absolute left-2 top-2 uppercase"
            >
              {product.badge}
            </Badge>
          )}

          {/* Wishlist button overlay */}
          <Button
            variant="secondary"
            size="icon"
            className={`absolute right-2 top-2 transition-opacity ${
              isInWishlistValue
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product.id, product.name);
            }}
            disabled={loading}
          >
            <Heart
              className={`h-4 w-4 ${
                isInWishlistValue ? 'fill-red-500 text-red-500' : ''
              }`}
            />
            <span className="sr-only">Add to wishlist</span>
          </Button>
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
            {hasPriceModifiers && (
              <span className="text-xs font-normal text-muted-foreground">
                +
              </span>
            )}
          </p>
          {/* Color swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex gap-1">
              {product.colors.slice(0, 4).map((color, index) => (
                <div
                  key={`${color.name}-${index}`}
                  className="h-4 w-4 rounded-full border"
                  style={{
                    backgroundColor:
                      color.metadata?.hex?.toString() || color.hex || '#ccc',
                  }}
                  title={color.name}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Memoized ProductCard component for optimized list rendering
 * Only re-renders when the product prop changes (by ID)
 */
export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  // Only re-render if the product ID changes
  // This avoids re-renders when parent re-renders but product hasn't changed
  return prevProps.product.id === nextProps.product.id;
});
