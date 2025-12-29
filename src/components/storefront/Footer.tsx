import Link from 'next/link'

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Store'

const footerLinks = {
  shop: [
    { href: '/products', label: 'All Products' },
    { href: '/products?category=featured', label: 'Featured' },
    { href: '/products?badge=new', label: 'New Arrivals' },
  ],
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
    { href: '/shipping-returns', label: 'Shipping & Returns' },
  ],
  account: [
    { href: '/account', label: 'My Account' },
    { href: '/account/orders', label: 'Order History' },
    { href: '/cart', label: 'Cart' },
  ],
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">{storeName}</h3>
            <p className="text-sm text-muted-foreground">
              Quality products, exceptional service.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">Account</h4>
            <ul className="space-y-2">
              {footerLinks.account.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} {storeName}. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Powered by PocketBase & Next.js
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
