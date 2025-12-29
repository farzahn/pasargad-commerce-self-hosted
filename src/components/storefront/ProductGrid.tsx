'use client';

import { useState } from 'react';
import { LayoutGrid, List, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductCard } from './ProductCard';
import { EmptyState } from '@/components/shared/empty-state';
import type { Product } from '@/types/pocketbase';
import { useRouter, useSearchParams } from 'next/navigation';

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    router.push(`/products?${params.toString()}`);
  };

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No products found"
        description="Try adjusting your filters or check back later for new products."
        action={
          <Button variant="outline" onClick={() => router.push('/products')}>
            Clear filters
          </Button>
        }
      />
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </p>

        <div className="flex items-center gap-4">
          {/* Sort */}
          <Select
            defaultValue={searchParams.get('sort') || 'newest'}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="hidden sm:flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
              <span className="sr-only">List view</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Products */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
            : 'flex flex-col gap-4'
        }
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
