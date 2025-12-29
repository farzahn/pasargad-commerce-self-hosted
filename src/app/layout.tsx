import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { AuthProvider } from '@/components/shared/auth-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_STORE_NAME || 'E-Commerce Store',
    template: `%s | ${process.env.NEXT_PUBLIC_STORE_NAME || 'E-Commerce Store'}`,
  },
  description: process.env.NEXT_PUBLIC_STORE_DESCRIPTION || 'Self-hosted e-commerce template',
  keywords: ['e-commerce', 'shop', 'store', 'products'],
  authors: [{ name: process.env.NEXT_PUBLIC_STORE_NAME || 'Store' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: process.env.NEXT_PUBLIC_STORE_NAME || 'E-Commerce Store',
    title: process.env.NEXT_PUBLIC_STORE_NAME || 'E-Commerce Store',
    description: process.env.NEXT_PUBLIC_STORE_DESCRIPTION || 'Self-hosted e-commerce template',
  },
  twitter: {
    card: 'summary_large_image',
    title: process.env.NEXT_PUBLIC_STORE_NAME || 'E-Commerce Store',
    description: process.env.NEXT_PUBLIC_STORE_DESCRIPTION || 'Self-hosted e-commerce template',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
