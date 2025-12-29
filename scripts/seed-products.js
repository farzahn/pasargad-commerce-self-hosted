/**
 * Seed sample products into PocketBase
 * Run with: node scripts/seed-products.js
 */

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

async function seedProducts() {
  console.log('Seeding sample products...\n');

  // Authenticate as superuser (PocketBase v0.35+)
  const authResponse = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!authResponse.ok) {
    throw new Error(`Superuser auth failed: ${await authResponse.text()}`);
  }

  const { token } = await authResponse.json();
  console.log('Authenticated as superuser\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token,
  };

  // First, create some categories
  const categories = [
    { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories', order: 1 },
    { name: 'Clothing', slug: 'clothing', description: 'Apparel and fashion items', order: 2 },
    { name: 'Home & Garden', slug: 'home-garden', description: 'Home decor and garden supplies', order: 3 },
    { name: 'Books', slug: 'books', description: 'Books and publications', order: 4 },
  ];

  const categoryIds = {};

  for (const category of categories) {
    try {
      const response = await fetch(`${POCKETBASE_URL}/api/collections/categories/records`, {
        method: 'POST',
        headers,
        body: JSON.stringify(category),
      });

      if (response.ok) {
        const created = await response.json();
        categoryIds[category.slug] = created.id;
        console.log(`Created category: ${category.name}`);
      } else {
        const error = await response.text();
        if (error.includes('unique')) {
          // Already exists, fetch it
          const listResponse = await fetch(
            `${POCKETBASE_URL}/api/collections/categories/records?filter=(slug='${category.slug}')`,
            { headers }
          );
          const list = await listResponse.json();
          if (list.items?.length > 0) {
            categoryIds[category.slug] = list.items[0].id;
            console.log(`Category exists: ${category.name}`);
          }
        } else {
          console.error(`Failed to create category ${category.name}: ${error}`);
        }
      }
    } catch (err) {
      console.error(`Error creating category ${category.name}:`, err.message);
    }
  }

  console.log('\nCategory IDs:', categoryIds, '\n');

  // Sample products
  const products = [
    {
      name: 'Wireless Bluetooth Headphones',
      slug: 'wireless-bluetooth-headphones',
      description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio. Perfect for music lovers and professionals.',
      basePrice: 14999,
      sku: 'ELEC-HP-001',
      categoryId: categoryIds['electronics'],
      tags: ['audio', 'wireless', 'bluetooth'],
      status: 'active',
      isFeatured: true,
      badge: 'bestseller',
      stock: 50,
      sizes: [],
      colors: [
        { name: 'Black', hex: '#000000', priceModifier: 0 },
        { name: 'White', hex: '#FFFFFF', priceModifier: 0 },
        { name: 'Navy', hex: '#000080', priceModifier: 10 },
      ],
      options: [],
    },
    {
      name: 'Smart Watch Pro',
      slug: 'smart-watch-pro',
      description: 'Advanced smartwatch with health monitoring, GPS tracking, and 7-day battery life. Water resistant and compatible with iOS and Android.',
      basePrice: 29999,
      sku: 'ELEC-SW-001',
      categoryId: categoryIds['electronics'],
      tags: ['wearable', 'fitness', 'smart'],
      status: 'active',
      isFeatured: true,
      badge: 'new',
      stock: 30,
      sizes: [],
      colors: [
        { name: 'Space Gray', hex: '#4A4A4A', priceModifier: 0 },
        { name: 'Silver', hex: '#C0C0C0', priceModifier: 0 },
        { name: 'Rose Gold', hex: '#B76E79', priceModifier: 20 },
      ],
      options: [],
    },
    {
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-tshirt',
      description: 'Ultra-soft 100% organic cotton t-shirt. Pre-shrunk, comfortable fit, and eco-friendly. Available in multiple sizes and colors.',
      basePrice: 2999,
      sku: 'CLTH-TS-001',
      categoryId: categoryIds['clothing'],
      tags: ['cotton', 'casual', 'eco-friendly'],
      status: 'active',
      isFeatured: true,
      badge: '',
      stock: 200,
      sizes: [
        { name: 'S', priceModifier: 0 },
        { name: 'M', priceModifier: 0 },
        { name: 'L', priceModifier: 0 },
        { name: 'XL', priceModifier: 2 },
        { name: 'XXL', priceModifier: 4 },
      ],
      colors: [
        { name: 'White', hex: '#FFFFFF', priceModifier: 0 },
        { name: 'Black', hex: '#000000', priceModifier: 0 },
        { name: 'Navy', hex: '#000080', priceModifier: 0 },
        { name: 'Gray', hex: '#808080', priceModifier: 0 },
      ],
      options: [],
    },
    {
      name: 'Leather Messenger Bag',
      slug: 'leather-messenger-bag',
      description: 'Handcrafted genuine leather messenger bag with padded laptop compartment. Multiple pockets for organization. Perfect for work or travel.',
      basePrice: 18999,
      sku: 'CLTH-BG-001',
      categoryId: categoryIds['clothing'],
      tags: ['leather', 'bag', 'professional'],
      status: 'active',
      isFeatured: false,
      badge: 'sale',
      stock: 25,
      sizes: [],
      colors: [
        { name: 'Brown', hex: '#8B4513', priceModifier: 0 },
        { name: 'Black', hex: '#000000', priceModifier: 0 },
        { name: 'Tan', hex: '#D2B48C', priceModifier: 15 },
      ],
      options: [],
    },
    {
      name: 'Ceramic Plant Pot Set',
      slug: 'ceramic-plant-pot-set',
      description: 'Set of 3 modern ceramic plant pots with drainage holes and bamboo trays. Perfect for indoor plants and succulents.',
      basePrice: 4999,
      sku: 'HOME-PT-001',
      categoryId: categoryIds['home-garden'],
      tags: ['ceramic', 'plants', 'decor'],
      status: 'active',
      isFeatured: true,
      badge: 'new',
      stock: 75,
      sizes: [
        { name: 'Small Set', priceModifier: 0 },
        { name: 'Medium Set', priceModifier: 15 },
        { name: 'Large Set', priceModifier: 30 },
      ],
      colors: [
        { name: 'White', hex: '#FFFFFF', priceModifier: 0 },
        { name: 'Terracotta', hex: '#E2725B', priceModifier: 5 },
        { name: 'Sage Green', hex: '#9DC183', priceModifier: 5 },
      ],
      options: [],
    },
    {
      name: 'Cozy Throw Blanket',
      slug: 'cozy-throw-blanket',
      description: 'Ultra-soft microfiber throw blanket. Machine washable and perfect for colder months. Generously sized at 50x60 inches.',
      basePrice: 3999,
      sku: 'HOME-BL-001',
      categoryId: categoryIds['home-garden'],
      tags: ['blanket', 'cozy', 'home'],
      status: 'active',
      isFeatured: false,
      badge: '',
      stock: 100,
      sizes: [],
      colors: [
        { name: 'Cream', hex: '#FFFDD0', priceModifier: 0 },
        { name: 'Gray', hex: '#808080', priceModifier: 0 },
        { name: 'Dusty Rose', hex: '#DCAE96', priceModifier: 0 },
        { name: 'Navy', hex: '#000080', priceModifier: 0 },
      ],
      options: [],
    },
    {
      name: 'The Art of Programming',
      slug: 'art-of-programming',
      description: 'A comprehensive guide to software development best practices. Covers algorithms, design patterns, and clean code principles. 500+ pages.',
      basePrice: 5999,
      sku: 'BOOK-PR-001',
      categoryId: categoryIds['books'],
      tags: ['programming', 'education', 'tech'],
      status: 'active',
      isFeatured: true,
      badge: 'bestseller',
      stock: 150,
      sizes: [],
      colors: [],
      options: [
        { name: 'Paperback', priceModifier: 0 },
        { name: 'Hardcover', priceModifier: 15 },
        { name: 'E-Book', priceModifier: -20 },
      ],
    },
    {
      name: 'Mindful Living Journal',
      slug: 'mindful-living-journal',
      description: 'A guided journal for daily reflection and mindfulness practice. 365 prompts to help you cultivate gratitude and self-awareness.',
      basePrice: 2499,
      sku: 'BOOK-JR-001',
      categoryId: categoryIds['books'],
      tags: ['journal', 'mindfulness', 'wellness'],
      status: 'active',
      isFeatured: false,
      badge: 'new',
      stock: 80,
      sizes: [],
      colors: [
        { name: 'Sage', hex: '#9DC183', priceModifier: 0 },
        { name: 'Lavender', hex: '#E6E6FA', priceModifier: 0 },
        { name: 'Blush', hex: '#DE5D83', priceModifier: 0 },
      ],
      options: [],
    },
  ];

  // Create products
  let created = 0;
  for (const product of products) {
    try {
      const response = await fetch(`${POCKETBASE_URL}/api/collections/products/records`, {
        method: 'POST',
        headers,
        body: JSON.stringify(product),
      });

      if (response.ok) {
        console.log(`Created product: ${product.name}`);
        created++;
      } else {
        const error = await response.text();
        if (error.includes('unique') || error.includes('slug')) {
          console.log(`Product exists: ${product.name}`);
        } else {
          console.error(`Failed to create product ${product.name}: ${error}`);
        }
      }
    } catch (err) {
      console.error(`Error creating product ${product.name}:`, err.message);
    }
  }

  console.log(`\nSeeding complete! Created ${created} new products.`);
}

seedProducts().catch(console.error);
