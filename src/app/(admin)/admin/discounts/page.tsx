'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Tag, MoreHorizontal, Pencil, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { formatCurrency, formatDate } from '@/lib/utils'
import { getPocketBaseClient } from '@/lib/pocketbase'
import type { Discount } from '@/types/pocketbase'

export default function AdminDiscountsPage() {
  const { toast } = useToast()
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchDiscounts() {
      try {
        const pb = getPocketBaseClient()
        const result = await pb.collection('discounts').getList<Discount>(1, 500, {
          sort: '-id',
        })
        setDiscounts(result.items)
      } catch (error) {
        console.error('Error fetching discounts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDiscounts()
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const pb = getPocketBaseClient()
      await pb.collection('discounts').delete(deleteId)
      setDiscounts(discounts.filter((d) => d.id !== deleteId))
      toast({
        title: 'Discount deleted',
        description: 'The discount code has been removed.',
      })
    } catch (error) {
      console.error('Error deleting discount:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete discount',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: 'Copied!',
      description: `${code} copied to clipboard`,
    })
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
        <h1 className="text-3xl font-bold">Discounts</h1>
        <Button asChild>
          <Link href="/admin/discounts/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Discount
          </Link>
        </Button>
      </div>

      {discounts.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No discounts"
          description="Create discount codes for your customers"
          action={
            <Button asChild>
              <Link href="/admin/discounts/new">Create Discount</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {discounts.map((discount) => {
            const isExpired =
              discount.expiresAt && new Date(discount.expiresAt) < new Date()
            const isMaxedOut =
              discount.maxUses > 0 && discount.usedCount >= discount.maxUses

            return (
              <Card key={discount.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="font-mono text-lg">
                      {discount.code}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyCode(discount.code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/discounts/${discount.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(discount.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={discount.isActive ? 'default' : 'secondary'}>
                        {discount.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {isExpired && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                      {isMaxedOut && (
                        <Badge variant="secondary">Maxed Out</Badge>
                      )}
                    </div>

                    <p className="text-2xl font-bold">
                      {discount.type === 'percentage'
                        ? `${discount.value}% OFF`
                        : `${formatCurrency(discount.value / 100)} OFF`}
                    </p>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      {discount.minOrderValue > 0 && (
                        <p>
                          Min order: {formatCurrency(discount.minOrderValue / 100)}
                        </p>
                      )}
                      <p>
                        Used: {discount.usedCount}
                        {discount.maxUses > 0 ? ` / ${discount.maxUses}` : ''} times
                      </p>
                      {discount.expiresAt && (
                        <p>Expires: {formatDate(discount.expiresAt)}</p>
                      )}
                    </div>
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
            <AlertDialogTitle>Delete Discount</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this discount code? This action
              cannot be undone.
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
