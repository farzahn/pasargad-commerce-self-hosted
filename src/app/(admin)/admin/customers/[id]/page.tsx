'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  Package,
  MapPin,
  User,
  Save,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatCurrency } from '@/lib/utils'
import { getStatusColor, getStatusDisplayName } from '@/lib/config'
import { getPocketBaseClient, buildFileUrl } from '@/lib/pocketbase'
import type { User as UserType, Order, Address } from '@/types/pocketbase'

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>
}

export default function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const [user, setUser] = useState<UserType | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [togglingBlock, setTogglingBlock] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const pb = getPocketBaseClient()

        // Fetch user data
        const userData = await pb.collection('users').getOne<UserType>(id)
        if (!userData) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setUser(userData)
        setAdminNotes(userData.adminNotes || '')

        // Fetch user orders
        const userOrdersResult = await pb.collection('orders').getList<Order>(1, 500, {
          filter: `user = "${id}"`,
          sort: '-id',
        })
        setOrders(userOrdersResult.items)

        // Fetch user addresses
        const userAddressesResult = await pb
          .collection('addresses')
          .getList<Address>(1, 500, {
            filter: `user = "${id}"`,
            sort: '-isDefault,-created',
          })
        setAddresses(userAddressesResult.items)
      } catch (error) {
        console.error('Error fetching customer data:', error)
        setNotFound(true)
        toast({
          title: 'Error',
          description: 'Failed to load customer data',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, toast])

  const handleSaveNotes = async () => {
    if (!user) return

    setSavingNotes(true)
    try {
      const pb = getPocketBaseClient()
      await pb.collection('users').update(user.id, { adminNotes })
      setUser({ ...user, adminNotes })
      toast({
        title: 'Notes saved',
        description: 'Admin notes have been updated successfully',
      })
    } catch (error) {
      console.error('Error saving notes:', error)
      toast({
        title: 'Error',
        description: 'Failed to save admin notes',
        variant: 'destructive',
      })
    } finally {
      setSavingNotes(false)
    }
  }

  const handleToggleBlock = async () => {
    if (!user) return

    setTogglingBlock(true)
    try {
      const pb = getPocketBaseClient()
      const newBlockedStatus = !user.isBlocked
      await pb.collection('users').update(user.id, { isBlocked: newBlockedStatus })
      setUser({ ...user, isBlocked: newBlockedStatus })
      toast({
        title: newBlockedStatus ? 'Customer blocked' : 'Customer unblocked',
        description: newBlockedStatus
          ? 'This customer has been blocked and cannot place orders'
          : 'This customer can now place orders again',
      })
    } catch (error) {
      console.error('Error toggling block status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update customer status',
        variant: 'destructive',
      })
    } finally {
      setTogglingBlock(false)
    }
  }

  const formatAddress = (address: Address) => {
    const parts = [address.street]
    if (address.apt) parts.push(`Apt ${address.apt}`)
    parts.push(`${address.city}, ${address.state} ${address.zip}`)
    return parts.join(', ')
  }

  const getAvatarUrl = (userData: UserType): string | undefined => {
    if (!userData.avatar) return undefined
    return buildFileUrl(userData.collectionId, userData.id, userData.avatar, '200x200')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (notFound || !user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/admin/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Link>
        </Button>
        <EmptyState
          icon={User}
          title="Customer not found"
          description="The customer you're looking for doesn't exist or has been deleted"
          action={
            <Button asChild>
              <Link href="/admin/customers">View All Customers</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/customers">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Customer Details</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Info Card - spans 2 columns on large screens */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Section */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={getAvatarUrl(user)} alt={user.name} />
                <AvatarFallback className="text-xl">
                  {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">
                    {user.name || 'No name'}
                  </h2>
                  {user.isBlocked && (
                    <Badge variant="destructive">Blocked</Badge>
                  )}
                  {user.verified && <Badge variant="secondary">Verified</Badge>}
                </div>
                <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Date Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Joined:</span>
                <span className="font-medium">{formatDate(user.created)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last updated:</span>
                <span className="font-medium">{formatDate(user.updated)}</span>
              </div>
            </div>

            <Separator />

            {/* Block/Unblock Action */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Account Status</h3>
                <p className="text-sm text-muted-foreground">
                  {user.isBlocked
                    ? 'This customer is currently blocked from placing orders'
                    : 'This customer can place orders normally'}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={user.isBlocked ? 'default' : 'destructive'}
                    disabled={togglingBlock}
                  >
                    {user.isBlocked ? (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Unblock
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Block
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {user.isBlocked ? 'Unblock Customer?' : 'Block Customer?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {user.isBlocked
                        ? `This will allow ${user.name || user.email} to place orders again.`
                        : `This will prevent ${user.name || user.email} from placing new orders. Existing orders will not be affected.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleToggleBlock}>
                      {user.isBlocked ? 'Unblock' : 'Block'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <Separator />

            {/* Admin Notes */}
            <div className="space-y-3">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                placeholder="Add internal notes about this customer..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
              <Button
                onClick={handleSaveNotes}
                disabled={savingNotes || adminNotes === (user.adminNotes || '')}
                size="sm"
              >
                {savingNotes ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Notes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Order Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Orders</span>
                <span className="font-semibold">{orders.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Spent</span>
                <span className="font-semibold">
                  {formatCurrency(
                    orders.reduce((sum, order) => sum + order.total, 0) / 100
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saved Addresses</span>
                <span className="font-semibold">{addresses.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="This customer hasn't placed any orders"
              className="py-8"
            />
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium">
                        {order.orderNumber}
                      </span>
                      <Badge
                        style={{ backgroundColor: getStatusColor(order.status) }}
                        className="text-white"
                      >
                        {getStatusDisplayName(order.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(order.created)} - {order.items.length} item
                      {order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">
                      {formatCurrency(order.total / 100)}
                    </span>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/orders/${order.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Saved Addresses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No saved addresses"
              description="This customer hasn't saved any addresses"
              className="py-8"
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((address) => (
                <div key={address.id} className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{address.name}</span>
                    {address.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatAddress(address)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
