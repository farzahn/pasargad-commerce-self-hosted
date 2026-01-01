import { Suspense } from 'react';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { ProductFilters } from '@/components/storefront/ProductFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { getProducts, getCategories, escapeFilterValue } from '@/lib/pocketbase';
import type { Product, Category } from '@/types/pocketbase';

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    tags?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    badge?: string;
  }>;
}

export const metadata = {
  title: 'Products',
  description: 'Browse our collection of quality products',
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    // Fetch categories first (needed for category slug lookup)
    categories = await getCategories();

    // Build server-side filter string with proper escaping
    const filters: string[] = ["status='active'"];

    // Badge filter
    if (params.badge) {
      filters.push(`badge='${escapeFilterValue(params.badge)}'`);
    }

    // Search query filter (server-side text search)
    if (params.q) {
      const escapedQuery = escapeFilterValue(params.q);
      filters.push(`(name ~ "${escapedQuery}" || description ~ "${escapedQuery}")`);
    }

    // Category filter (lookup category by slug first)
    if (params.category) {
      const category = categories.find((c) => c.slug === params.category);
      if (category) {
        filters.push(`categoryId = "${escapeFilterValue(category.id)}"`);
      }
    }

    // Tags filter (using ~ operator for partial match)
    if (params.tags) {
      const tags = params.tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        // Use OR for tags - product matches if it has any of the specified tags
        const tagFilters = tags.map((tag) => `tags ~ "${escapeFilterValue(tag)}"`);
        filters.push(`(${tagFilters.join(' || ')})`);
      }
    }

    // Price range filters
    if (params.minPrice) {
      const minPriceCents = Math.round(parseFloat(params.minPrice) * 100);
      if (!isNaN(minPriceCents)) {
        filters.push(`basePrice >= ${minPriceCents}`);
      }
    }

    if (params.maxPrice) {
      const maxPriceCents = Math.round(parseFloat(params.maxPrice) * 100);
      if (!isNaN(maxPriceCents)) {
        filters.push(`basePrice <= ${maxPriceCents}`);
      }
    }

    // Determine sort order
    let sort = '-@rowid';
    switch (params.sort) {
      case 'price-asc':
        sort = 'basePrice';
        break;
      case 'price-desc':
        sort = '-basePrice';
        break;
      case 'name-asc':
        sort = 'name';
        break;
      case 'newest':
      default:
        sort = '-@rowid';
        break;
    }

    const result = await getProducts({
      filter: filters.join(' && '),
      sort,
      perPage: 100,
    });
    products = result.items;
  } catch (error) {
    console.error('Error fetching products:', error);
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        {params.q && (
          <p className="mt-2 text-muted-foreground">
            Search results for &quot;{params.q}&quot;
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <ProductFilters categories={categories} />
          </Suspense>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            }
          >
            <ProductGrid products={products} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
