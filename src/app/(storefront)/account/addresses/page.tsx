'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useAuthContext } from '@/components/shared/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/lib/pocketbase';
import type { Address } from '@/types/pocketbase';

interface AddressFormData {
  name: string;
  street: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

const initialFormData: AddressFormData = {
  name: '',
  street: '',
  apt: '',
  city: '',
  state: '',
  zip: '',
  isDefault: false,
};

export default function AddressesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(initialFormData);

  const fetchAddresses = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserAddresses(user.id);
      setAddresses(data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load addresses. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchAddresses();
    }
  }, [user, authLoading, router, fetchAddresses]);

  const handleOpenAddDialog = () => {
    setEditingAddress(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      street: address.street,
      apt: address.apt || '',
      city: address.city,
      state: address.state,
      zip: address.zip,
      isDefault: address.isDefault,
    });
    setDialogOpen(true);
  };

  const handleFormChange = (
    field: keyof AddressFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAddress = async () => {
    if (!user) return;

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter a full name.',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.street.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter a street address.',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.city.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter a city.',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.state.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter a state/province.',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.zip.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter a postal code.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingAddress) {
        // Update existing address
        await updateAddress(editingAddress.id, {
          name: formData.name.trim(),
          street: formData.street.trim(),
          apt: formData.apt?.trim() || '',
          city: formData.city.trim(),
          state: formData.state.trim(),
          zip: formData.zip.trim(),
          isDefault: formData.isDefault,
        });

        // If setting as default, update via API
        if (formData.isDefault && !editingAddress.isDefault) {
          await setDefaultAddress(user.id, editingAddress.id);
        }
      } else {
        // Create new address
        const newAddress = await createAddress(user.id, {
          name: formData.name.trim(),
          street: formData.street.trim(),
          apt: formData.apt?.trim() || '',
          city: formData.city.trim(),
          state: formData.state.trim(),
          zip: formData.zip.trim(),
          country: 'US',
          phone: '',
          label: '',
          isDefault: formData.isDefault || addresses.length === 0,
        });

        // If setting as default
        if (formData.isDefault) {
          await setDefaultAddress(user.id, newAddress.id);
        }
      }

      // Refresh addresses
      await fetchAddresses();
      setDialogOpen(false);
      setFormData(initialFormData);
      setEditingAddress(null);

      toast({
        title: editingAddress ? 'Address updated' : 'Address added',
        description: editingAddress
          ? 'Your address has been updated successfully.'
          : 'Your new address has been saved.',
      });
    } catch (error) {
      console.error('Error saving address:', error);
      toast({
        title: 'Error',
        description: 'Failed to save address. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return;

    setDeletingId(addressId);
    try {
      await deleteAddress(addressId);
      await fetchAddresses();

      toast({
        title: 'Address deleted',
        description: 'The address has been removed from your account.',
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete address. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;

    try {
      await setDefaultAddress(user.id, addressId);
      await fetchAddresses();

      toast({
        title: 'Default address updated',
        description: 'Your default shipping address has been changed.',
      });
    } catch (error) {
      console.error('Error setting default address:', error);
      toast({
        title: 'Error',
        description: 'Failed to update default address. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/account">
            <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
            Back to Account
          </Link>
        </Button>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Saved Addresses</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
              <DialogDescription>
                {editingAddress
                  ? 'Update your address details below.'
                  : 'Enter your address details below.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  placeholder="123 Main Street"
                  value={formData.street}
                  onChange={(e) => handleFormChange('street', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apt">Apartment, Suite, etc. (optional)</Label>
                <Input
                  id="apt"
                  placeholder="Apt 4B"
                  value={formData.apt}
                  onChange={(e) => handleFormChange('apt', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={formData.city}
                    onChange={(e) => handleFormChange('city', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State/Province *</Label>
                  <Input
                    id="state"
                    placeholder="NY"
                    value={formData.state}
                    onChange={(e) => handleFormChange('state', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zip">Postal Code *</Label>
                <Input
                  id="zip"
                  placeholder="10001"
                  value={formData.zip}
                  onChange={(e) => handleFormChange('zip', e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="default">Set as default address</Label>
                  <p className="text-sm text-muted-foreground">
                    This address will be used by default for shipping.
                  </p>
                </div>
                <Switch
                  id="default"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) =>
                    handleFormChange('isDefault', checked)
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAddress} disabled={saving}>
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : editingAddress ? (
                  'Update Address'
                ) : (
                  'Save Address'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add a shipping address to make checkout faster and easier."
          action={
            <Button onClick={handleOpenAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Address
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <Card
              key={address.id}
              className={address.isDefault ? 'border-primary' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{address.name}</CardTitle>
                    {address.isDefault && (
                      <CardDescription className="mt-1 flex items-center gap-1 text-primary">
                        <Star className="h-3 w-3 fill-current" />
                        Default
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEditDialog(address)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={deletingId === address.id}
                        >
                          {deletingId === address.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Address</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this address? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAddress(address.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{address.street}</p>
                {address.apt && <p>{address.apt}</p>}
                <p>
                  {address.city}, {address.state} {address.zip}
                </p>
                {!address.isDefault && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => handleSetDefault(address.id)}
                  >
                    Set as default
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
