import { Header } from '@/components/storefront/Header'
import { Footer } from '@/components/storefront/Footer'

// Force dynamic rendering for all storefront pages that use auth
export const dynamic = 'force-dynamic';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
