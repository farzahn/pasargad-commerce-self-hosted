'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, MapPin, Heart, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useAuthContext } from '@/components/shared/auth-provider';

const accountLinks = [
  {
    href: '/account/orders',
    icon: Package,
    title: 'Order History',
    description: 'View your past orders and track shipments',
  },
  {
    href: '/account/addresses',
    icon: MapPin,
    title: 'Saved Addresses',
    description: 'Manage your shipping addresses',
  },
  {
    href: '/account/wishlist',
    icon: Heart,
    title: 'Wishlist',
    description: 'View your saved products',
  },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, signOut, isAdmin } = useAuthContext();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
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
      <h1 className="mb-8 text-3xl font-bold">My Account</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={user.avatar || undefined}
                    alt={user.name || 'User'}
                  />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{user.name}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAdmin && (
                <>
                  <Button variant="secondary" asChild className="w-full">
                    <Link href="/admin">Admin Dashboard</Link>
                  </Button>
                  <Separator />
                </>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Account Links */}
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {accountLinks.map((link) => (
              <Card key={link.href} className="transition-shadow hover:shadow-md">
                <Link href={link.href}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <link.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{link.title}</CardTitle>
                        <CardDescription>{link.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
