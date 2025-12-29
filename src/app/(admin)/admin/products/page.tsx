'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Search, Package, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { getPocketBaseClient, buildFileUrl } from '@/lib/pocketbase'
import type { Product } from '@/types/pocketbase'

export default function AdminProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const pb = getPocketBaseClient()
        const result = await pb.collection('products').getList<Product>(1, 500, {
          sort: '-id',
        })
        setProducts(result.items)
      } catch (error) {
        console.error('Error fetching products:', error)
        toast({
          title: 'Error',
          description: 'Failed to load products',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [toast])

  const filteredProducts = products.filter(
    (product) =>
      search === '' ||
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const pb = getPocketBaseClient()
      await pb.collection('products').delete(deleteId)
      setProducts(products.filter((p) => p.id !== deleteId))
      toast({
        title: 'Product deleted',
        description: 'The product has been removed.',
      })
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const getProductImageUrl = (product: Product): string | null => {
    if (!product.images || product.images.length === 0) return null
    return buildFileUrl(product.collectionId, product.id, product.images[0], '200x200')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description={
            search
              ? 'Try adjusting your search'
              : 'Start by adding your first product'
          }
          action={
            !search && (
              <Button asChild>
                <Link href="/admin/products/new">Add Product</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const imageUrl = getProductImageUrl(product)
            return (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  {product.badge && (
                    <Badge
                      variant={product.badge === 'sale' ? 'destructive' : 'default'}
                      className="absolute left-2 top-2 uppercase"
                    >
                      {product.badge}
                    </Badge>
                  )}
                  {product.status === 'inactive' && (
                    <Badge variant="secondary" className="absolute right-2 top-2">
                      Inactive
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(product.basePrice / 100)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${product.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/products/${product.slug}`} target="_blank">
                            View in Store
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(product.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <LoadingSpinner size="sm" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
