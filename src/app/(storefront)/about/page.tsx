import { SITE_CONFIG } from '@/lib/constants';

export const metadata = {
  title: 'About Us',
  description: `Learn about ${SITE_CONFIG.name} and our story.`,
};

export default function AboutPage() {
  return (
    <div className="container py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-4xl font-bold">About {SITE_CONFIG.name}</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed">
              {SITE_CONFIG.name} was founded with a simple mission: to bring
              quality products to customers who value craftsmanship and
              attention to detail. We believe that every purchase should bring
              joy and lasting value.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Our team is passionate about curating a collection that meets the
              highest standards. We carefully select each item, ensuring it
              aligns with our commitment to quality and customer satisfaction.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Process</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you place an order, our team gets to work. We take pride in
              every step of the fulfillment process, from careful packaging to
              timely shipping.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <div className="mb-2 text-3xl">1</div>
                <h3 className="font-medium">Order Received</h3>
                <p className="text-sm text-muted-foreground">
                  We review and confirm your order
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="mb-2 text-3xl">2</div>
                <h3 className="font-medium">Prepared</h3>
                <p className="text-sm text-muted-foreground">
                  Your items are carefully prepared
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="mb-2 text-3xl">3</div>
                <h3 className="font-medium">Shipped</h3>
                <p className="text-sm text-muted-foreground">
                  Securely packed and sent to you
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Quality Commitment</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              We stand behind every product we sell. Our quality assurance
              process ensures that you receive items that meet our high
              standards.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Curated Selection</h3>
                <p className="text-muted-foreground">
                  Every product is carefully chosen for quality and value.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-2">Customer First</h3>
                <p className="text-muted-foreground">
                  Your satisfaction is our top priority.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
            <p className="text-muted-foreground leading-relaxed">
              At {SITE_CONFIG.name}, we believe in transparency, quality, and
              excellent customer service. We work hard every day to earn your
              trust and provide an exceptional shopping experience.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
