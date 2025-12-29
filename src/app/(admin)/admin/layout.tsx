'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  MessageSquare,
  BarChart3,
  LogOut,
  Menu,
  Store,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { getPocketBaseClient } from '@/lib/pocketbase'

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Store'

const sidebarLinks = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/customers', icon: Users, label: 'Customers' },
  { href: '/admin/discounts', icon: Tag, label: 'Discounts' },
  { href: '/admin/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
]

function Sidebar({ className = '' }: { className?: string }) {
  const handleSignOut = () => {
    const pb = getPocketBaseClient()
    pb.authStore.clear()
    window.location.href = '/'
  }

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <Store className="h-6 w-6" />
          <span className="font-bold">{storeName}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {sidebarLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Store className="h-4 w-4" />
          View Store
        </Link>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is authenticated and is an admin
    const checkAuth = async () => {
      try {
        const pb = getPocketBaseClient()
        const isValid = pb.authStore.isValid
        const user = pb.authStore.model

        if (!isValid || !user) {
          router.push('/')
          return
        }

        // Check if user is admin (by role or admin email)
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
        const isAdmin = user.role === 'admin' || user.isAdmin === true || (adminEmail && user.email === adminEmail)

        if (!isAdmin) {
          router.push('/')
          return
        }

        setUserEmail(user.email)
        setIsAuthorized(true)
      } catch {
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-background lg:block">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b px-4 lg:px-6">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {userEmail && (
              <span className="text-sm text-muted-foreground">
                {userEmail}
              </span>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
