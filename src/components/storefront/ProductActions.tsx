'use client';

import { useState } from 'react';
import { Heart, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuthContext } from '@/components/shared/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { getImageUrl } from '@/lib/pocketbase';
import type { Product, VariantOption } from '@/types/pocketbase';

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist, loading: wishlistLoading } = useWishlist();
  const { user, signIn } = useAuthContext();
  const { toast } = useToast();

  // Get first variant as default
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(
    product.variants?.[0] || null
  );
  const [quantity, setQuantity] = useState(1);

  // Calculate total price
  const basePrice = product.basePrice / 100; // Convert from cents
  const variantModifier = (selectedVariant?.priceModifier || 0) / 100;
  const totalPrice = basePrice + variantModifier;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      variant: selectedVariant?.name,
      quantity,
      unitPrice: Math.round(totalPrice * 100), // Store in cents
      productImage: getImageUrl(product, 0, { thumb: '200x200' }),
    });

    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleWishlistClick = () => {
    if (!user) {
      signIn();
      return;
    }
    toggleWishlist(product.id, product.name);
  };

  const isWishlisted = isInWishlist(product.id);

  return (
    <div className="space-y-6">
      {/* Price Display */}
      <div className="text-2xl font-semibold">
        {formatCurrency(totalPrice)}
        {variantModifier !== 0 && (
          <span className="ml-2 text-sm font-normal text-muted-foreground line-through">
            {formatCurrency(basePrice)}
          </span>
        )}
      </div>

      {/* Variant Selector */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-2">
          <Label>Variant</Label>
          <Select
            value={selectedVariant?.name || ''}
            onValueChange={(value) => {
              const variant = product.variants?.find((v) => v.name === value);
              setSelectedVariant(variant || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select variant" />
            </SelectTrigger>
            <SelectContent>
              {product.variants.map((variant) => (
                <SelectItem key={variant.name} value={variant.name}>
                  {variant.name}
                  {variant.priceModifier !== 0 && (
                    <span className="ml-2 text-muted-foreground">
                      ({variant.priceModifier > 0 ? '+' : ''}{formatCurrency(variant.priceModifier / 100)})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Quantity */}
      <div className="space-y-2">
        <Label>Quantity</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="flex-1" onClick={handleAddToCart}>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Add to Cart
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleWishlistClick}
          disabled={wishlistLoading}
        >
          <Heart
            className={`mr-2 h-5 w-5 ${
              isWishlisted ? 'fill-red-500 text-red-500' : ''
            }`}
          />
          {isWishlisted ? 'Saved' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
