import { SITE_CONFIG } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

export const metadata = {
  title: 'Shipping & Returns',
  description: `Shipping and returns policy for ${SITE_CONFIG.name}.`,
};

// These values can be customized via environment variables
const SHIPPING_CONFIG = {
  flatRate: parseFloat(process.env.SHIPPING_FLAT_RATE || '500') / 100, // Default $5.00
  freeThreshold: parseFloat(process.env.FREE_SHIPPING_THRESHOLD || '5000') / 100, // Default $50.00
  processingTime: process.env.PROCESSING_TIME || '3-5 business days',
};

export default function ShippingReturnsPage() {
  return (
    <div className="container py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-4xl font-bold">Shipping & Returns</h1>

        <div className="space-y-12">
          {/* Shipping Policy */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">Shipping Policy</h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="rounded-lg border p-6">
                <h3 className="mb-2 font-semibold text-foreground">
                  Processing Time
                </h3>
                <p>
                  All orders are processed within{' '}
                  <strong>{SHIPPING_CONFIG.processingTime}</strong>. This allows
                  us to prepare each order with care and attention to detail.
                </p>
              </div>

              <div className="rounded-lg border p-6">
                <h3 className="mb-2 font-semibold text-foreground">
                  Shipping Region
                </h3>
                <p>
                  We currently ship within the{' '}
                  <strong>United States</strong>. International shipping may be
                  available in the future.
                </p>
              </div>

              <div className="rounded-lg border p-6">
                <h3 className="mb-2 font-semibold text-foreground">
                  Shipping Rates
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Orders under {formatCurrency(SHIPPING_CONFIG.freeThreshold)}:{' '}
                    <strong>{formatCurrency(SHIPPING_CONFIG.flatRate)} flat rate</strong>
                  </li>
                  <li>
                    Orders {formatCurrency(SHIPPING_CONFIG.freeThreshold)} or more:{' '}
                    <strong>FREE shipping</strong>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Returns Policy */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">Returns Policy</h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950">
                <h3 className="mb-2 font-semibold text-foreground">
                  Return Guidelines
                </h3>
                <p>
                  We want you to be completely satisfied with your purchase.
                  If you need to return an item, please contact us within 30
                  days of receiving your order.
                </p>
                <ul className="mt-4 list-disc pl-5 space-y-2">
                  <li>Items must be unused and in original condition</li>
                  <li>Original packaging should be intact when possible</li>
                  <li>Proof of purchase is required</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Damaged Items */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">Damaged Items</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We take great care in packaging your items, but if your order
                arrives damaged, we want to help. Here&apos;s our process:
              </p>
              <div className="rounded-lg border p-6">
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      1
                    </span>
                    <span>
                      <strong className="text-foreground">
                        Contact us within 7 days
                      </strong>{' '}
                      of receiving your order
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      2
                    </span>
                    <span>
                      <strong className="text-foreground">
                        Provide photos
                      </strong>{' '}
                      clearly showing the damage to the item and packaging
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      3
                    </span>
                    <span>
                      We&apos;ll review your case and respond within 2 business
                      days
                    </span>
                  </li>
                </ul>
              </div>
              <p className="text-sm">
                Resolution may include a replacement item or refund depending
                on the situation.
              </p>
            </div>
          </section>

          {/* Order Cancellation */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">Order Cancellation</h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="rounded-lg border p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 text-green-600">&#10003;</span>
                    <span>
                      <strong className="text-foreground">
                        Before processing begins:
                      </strong>{' '}
                      Orders can be cancelled from your account page
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 text-red-600">&#10007;</span>
                    <span>
                      <strong className="text-foreground">
                        Once processing starts:
                      </strong>{' '}
                      Orders cannot be cancelled or modified
                    </span>
                  </li>
                </ul>
              </div>
              <p className="text-sm">
                To check if your order can still be cancelled, log into your
                account and view your order status.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="rounded-lg bg-muted p-6">
            <h2 className="mb-2 text-lg font-semibold">Questions?</h2>
            <p className="text-muted-foreground">
              If you have any questions about our shipping or returns policy,
              please{' '}
              <a href="/contact" className="text-primary hover:underline">
                contact us
              </a>
              . We&apos;re happy to help!
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
