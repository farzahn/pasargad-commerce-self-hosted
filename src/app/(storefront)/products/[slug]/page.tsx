import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProductActions } from '@/components/storefront/ProductActions';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getProductBySlug, getProducts, getProductImageUrl } from '@/lib/pocketbase';
import { formatCurrency } from '@/lib/utils';
import type { Metadata } from 'next';
import type { Product } from '@/types/pocketbase';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await getProductBySlug(slug);
    if (!product) {
      return { title: 'Product Not Found' };
    }
    return {
      title: product.name,
      description: product.description,
      openGraph: {
        title: product.name,
        description: product.description,
        images: product.images[0]
          ? [getProductImageUrl(product, 0)]
          : [],
      },
    };
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let product: Product | null = null;
  let relatedProducts: Product[] = [];

  try {
    product = await getProductBySlug(slug);
    if (product) {
      const result = await getProducts({
        filter: `status = 'active' && categoryId = '${product.categoryId}' && id != '${product.id}'`,
        perPage: 4,
      });
      relatedProducts = result.items;
    }
  } catch (error) {
    console.error('Error fetching product:', error);
  }

  if (!product) {
    notFound();
  }

  const primaryImageUrl = product.images?.[0]
    ? getProductImageUrl(product, 0)
    : null;

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border">
            {primaryImageUrl ? (
              <Image
                src={primaryImageUrl}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
            {product.badge && (
              <Badge
                variant={product.badge as 'new' | 'sale'}
                className="absolute left-4 top-4 uppercase"
              >
                {product.badge}
              </Badge>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  className="relative aspect-square overflow-hidden rounded-md border hover:border-primary"
                >
                  <Image
                    src={getProductImageUrl(product!, index)}
                    alt={`${product!.name} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(product.basePrice / 100)}
              {product.variants?.some((v) => v.priceModifier !== 0) && (
                <span className="text-base font-normal text-muted-foreground">
                  {' '}and up
                </span>
              )}
            </p>
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          <Separator />

          {/* Variant Selectors */}
          <ProductActions product={product} />

          <Separator />

          {/* Additional Info */}
          {product.variants && product.variants.length > 0 && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Variant Information</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Different variants may affect pricing based on your selection.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                {product.variants.slice(0, 4).map((variant) => (
                  <div key={variant.name}>
                    <p className="font-medium">{variant.name}</p>
                    <p className="text-muted-foreground">
                      {variant.priceModifier !== 0
                        ? `${variant.priceModifier > 0 ? '+' : ''}${formatCurrency(variant.priceModifier / 100)}`
                        : 'Standard pricing'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Time Note */}
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm">
              <span className="font-medium">Processing Time:</span> 3-5 business days
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Items are prepared with care for each order.
            </p>
          </div>

          {/* SKU */}
          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Related Products</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
