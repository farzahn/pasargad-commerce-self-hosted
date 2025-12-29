import { Suspense } from 'react';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { ProductFilters } from '@/components/storefront/ProductFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { getProducts, getCategories } from '@/lib/pocketbase';
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
    // Build filter string
    const filters: string[] = ["status='active'"];

    if (params.badge) {
      filters.push(`badge='${params.badge}'`);
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
    categories = await getCategories();

    // Apply client-side filters (in production, these would be server-side)
    if (params.q) {
      const query = params.q.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    if (params.category) {
      const category = categories.find((c) => c.slug === params.category);
      if (category) {
        products = products.filter((p) => p.categoryId === category.id);
      }
    }

    if (params.tags) {
      const tags = params.tags.split(',');
      products = products.filter((p) =>
        tags.some((tag) => p.tags.includes(tag))
      );
    }

    if (params.minPrice) {
      const minPriceCents = parseFloat(params.minPrice) * 100;
      products = products.filter((p) => p.basePrice >= minPriceCents);
    }

    if (params.maxPrice) {
      const maxPriceCents = parseFloat(params.maxPrice) * 100;
      products = products.filter((p) => p.basePrice <= maxPriceCents);
    }
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
