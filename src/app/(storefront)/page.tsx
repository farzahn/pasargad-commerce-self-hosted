import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getFeaturedProducts, getCategories } from '@/lib/pocketbase';
import { SITE_CONFIG } from '@/lib/constants';
import type { Product, Category } from '@/types/pocketbase';

export default async function HomePage() {
  let featuredProducts: Product[] = [];
  let categories: Category[] = [];

  try {
    featuredProducts = await getFeaturedProducts(8);
    categories = await getCategories();
  } catch (error) {
    console.error('Error fetching homepage data:', error);
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-muted/50 to-background">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* Store Name */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              {SITE_CONFIG.name}
            </h1>

            {/* Tagline */}
            <p className="mt-6 text-xl sm:text-2xl md:text-3xl font-medium text-foreground/80">
              Quality Products, Exceptional Service
            </p>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              {SITE_CONFIG.description}
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/products">
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Quick Links */}
      <section className="border-y bg-muted/30">
        <div className="container py-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {/* Static categories if no dynamic categories */}
            {categories.length === 0 ? (
              <>
                {[
                  { name: 'All Products', slug: '' },
                  { name: 'Featured', slug: '?isFeatured=true' },
                  { name: 'New Arrivals', slug: '?badge=new' },
                  { name: 'On Sale', slug: '?badge=sale' },
                ].map((category) => (
                  <Link
                    key={category.name}
                    href={`/products${category.slug}`}
                    className="group flex items-center justify-center rounded-lg border bg-background p-6 text-center transition-colors hover:border-primary hover:bg-muted"
                  >
                    <span className="font-medium group-hover:text-primary">
                      {category.name}
                    </span>
                  </Link>
                ))}
              </>
            ) : (
              <>
                <Link
                  href="/products"
                  className="group flex items-center justify-center rounded-lg border bg-background p-6 text-center transition-colors hover:border-primary hover:bg-muted"
                >
                  <span className="font-medium group-hover:text-primary">
                    All Products
                  </span>
                </Link>
                {categories.slice(0, 3).map((category) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.slug}`}
                    className="group flex items-center justify-center rounded-lg border bg-background p-6 text-center transition-colors hover:border-primary hover:bg-muted"
                  >
                    <span className="font-medium group-hover:text-primary">
                      {category.name}
                    </span>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container py-16 md:py-24">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <p className="mt-2 text-muted-foreground">
              Our most popular items
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/products">View All</Link>
          </Button>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {/* Placeholder cards when no products */}
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="group rounded-lg border bg-card p-4 transition-shadow hover:shadow-lg"
              >
                <div className="aspect-square rounded-md bg-muted" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* About Snippet */}
      <section className="border-t bg-muted/30">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">Why Choose Us</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              At {SITE_CONFIG.name}, we believe in quality over quantity. Every product
              in our collection is carefully vetted to ensure it meets our high
              standards for durability, design, and value.
            </p>
            <Button className="mt-8" variant="outline" asChild>
              <Link href="/about">About Our Story</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Info Banner */}
      <section className="border-t">
        <div className="container py-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">*</span>
              <span className="font-medium">Free shipping on qualifying orders</span>
            </div>
            <div className="hidden h-6 border-l sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-2xl">*</span>
              <span className="font-medium">Secure checkout</span>
            </div>
            <div className="hidden h-6 border-l sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-2xl">*</span>
              <span className="font-medium">Customer support</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
