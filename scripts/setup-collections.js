#!/usr/bin/env node
/**
 * PocketBase Collections Setup Script (v0.35+ compatible)
 * Creates all e-commerce collections for the self-hosted store
 */

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

async function setupCollections() {
  console.log('🚀 Setting up PocketBase collections...\n');

  // Authenticate as superuser (PocketBase v0.35+)
  console.log('📝 Authenticating as superuser...');
  const authResponse = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!authResponse.ok) {
    const error = await authResponse.text();
    throw new Error(`Failed to authenticate: ${error}`);
  }

  const authData = await authResponse.json();
  const token = authData.token;
  console.log('✅ Authenticated successfully\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token,
  };

  // PocketBase v0.35+ uses "fields" instead of "schema"
  // Field format: { name, type, required, ... }
  const collections = [
    // Categories Collection
    {
      name: 'categories',
      type: 'base',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'image', type: 'file', required: false, maxSelect: 1, maxSize: 5242880, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
        { name: 'parentId', type: 'text', required: false },
        { name: 'order', type: 'number', required: false },
      ],
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    },

    // Products Collection
    {
      name: 'products',
      type: 'base',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true },
        { name: 'description', type: 'editor', required: false },
        { name: 'basePrice', type: 'number', required: true, min: 0 },
        { name: 'sku', type: 'text', required: true },
        { name: 'categoryId', type: 'text', required: false },
        { name: 'tags', type: 'json', required: false },
        { name: 'images', type: 'file', required: false, maxSelect: 10, maxSize: 5242880, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
        { name: 'variants', type: 'json', required: false },
        { name: 'status', type: 'select', required: true, values: ['active', 'inactive', 'draft'] },
        { name: 'isFeatured', type: 'bool', required: false },
        { name: 'badge', type: 'select', required: false, values: ['', 'new', 'sale', 'bestseller'] },
        { name: 'stock', type: 'number', required: false, min: 0 },
      ],
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    },

    // Orders Collection
    {
      name: 'orders',
      type: 'base',
      fields: [
        { name: 'orderNumber', type: 'text', required: true },
        { name: 'userId', type: 'text', required: false },
        { name: 'customerEmail', type: 'email', required: true },
        { name: 'customerName', type: 'text', required: true },
        { name: 'customerPhone', type: 'text', required: false },
        { name: 'items', type: 'json', required: true },
        { name: 'shippingAddress', type: 'json', required: true },
        { name: 'billingAddress', type: 'json', required: false },
        { name: 'subtotal', type: 'number', required: true, min: 0 },
        { name: 'shippingCost', type: 'number', required: true, min: 0 },
        { name: 'discountCode', type: 'text', required: false },
        { name: 'discountAmount', type: 'number', required: false, min: 0 },
        { name: 'tax', type: 'number', required: false, min: 0 },
        { name: 'total', type: 'number', required: true, min: 0 },
        { name: 'status', type: 'select', required: true, values: ['pending_review', 'invoice_sent', 'payment_received', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] },
        { name: 'paymentMethod', type: 'text', required: false },
        { name: 'paymentStatus', type: 'select', required: false, values: ['', 'pending', 'paid', 'failed', 'refunded'] },
        { name: 'tracking', type: 'json', required: false },
        { name: 'notes', type: 'text', required: false },
        { name: 'adminNotes', type: 'text', required: false },
        { name: 'statusHistory', type: 'json', required: false },
        { name: 'invoiceSentAt', type: 'date', required: false },
        { name: 'paidAt', type: 'date', required: false },
        { name: 'shippedAt', type: 'date', required: false },
        { name: 'deliveredAt', type: 'date', required: false },
        { name: 'cancelledAt', type: 'date', required: false },
        { name: 'cancellationReason', type: 'text', required: false },
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    },

    // Discounts Collection
    {
      name: 'discounts',
      type: 'base',
      fields: [
        { name: 'code', type: 'text', required: true },
        { name: 'type', type: 'select', required: true, values: ['percentage', 'fixed'] },
        { name: 'value', type: 'number', required: true, min: 0 },
        { name: 'minOrderValue', type: 'number', required: false, min: 0 },
        { name: 'maxUses', type: 'number', required: false, min: 0 },
        { name: 'usedCount', type: 'number', required: false, min: 0 },
        { name: 'expiresAt', type: 'date', required: false },
        { name: 'isActive', type: 'bool', required: false },
        { name: 'description', type: 'text', required: false },
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    },

    // Contact Messages Collection
    {
      name: 'messages',
      type: 'base',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text', required: false },
        { name: 'subject', type: 'text', required: true },
        { name: 'message', type: 'text', required: true },
        { name: 'isRead', type: 'bool', required: false },
        { name: 'isArchived', type: 'bool', required: false },
        { name: 'repliedAt', type: 'date', required: false },
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    },

    // Addresses Collection
    {
      name: 'addresses',
      type: 'base',
      fields: [
        { name: 'userId', type: 'text', required: true },
        { name: 'label', type: 'text', required: false },
        { name: 'name', type: 'text', required: true },
        { name: 'street', type: 'text', required: true },
        { name: 'apt', type: 'text', required: false },
        { name: 'city', type: 'text', required: true },
        { name: 'state', type: 'text', required: true },
        { name: 'zip', type: 'text', required: true },
        { name: 'country', type: 'text', required: false },
        { name: 'phone', type: 'text', required: false },
        { name: 'isDefault', type: 'bool', required: false },
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    },

    // Wishlist Collection
    {
      name: 'wishlists',
      type: 'base',
      fields: [
        { name: 'userId', type: 'text', required: true },
        { name: 'productId', type: 'text', required: true },
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: null,
      deleteRule: '@request.auth.id != ""',
    },

    // Reviews Collection
    {
      name: 'reviews',
      type: 'base',
      fields: [
        { name: 'userId', type: 'text', required: true },
        { name: 'productId', type: 'text', required: true },
        { name: 'rating', type: 'number', required: true, min: 1, max: 5 },
        { name: 'title', type: 'text', required: false },
        { name: 'comment', type: 'text', required: false },
        { name: 'isVerifiedPurchase', type: 'bool', required: false },
        { name: 'isApproved', type: 'bool', required: false },
      ],
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    },

    // Site Settings Collection
    {
      name: 'settings',
      type: 'base',
      fields: [
        { name: 'key', type: 'text', required: true },
        { name: 'value', type: 'json', required: false },
        { name: 'description', type: 'text', required: false },
      ],
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    },
  ];

  // Create collections
  for (const collection of collections) {
    console.log(`📦 Creating collection: ${collection.name}...`);

    try {
      const response = await fetch(`${POCKETBASE_URL}/api/collections`, {
        method: 'POST',
        headers,
        body: JSON.stringify(collection),
      });

      if (response.ok) {
        console.log(`   ✅ Created: ${collection.name}`);
      } else {
        const error = await response.json();
        if (error.message?.includes('already exists') || error.data?.name?.message?.includes('already exists')) {
          console.log(`   ⚠️  Skipped: ${collection.name} (already exists)`);
        } else {
          console.log(`   ❌ Failed: ${collection.name} - ${JSON.stringify(error)}`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Error: ${collection.name} - ${err.message}`);
    }
  }

  // Update users collection to add custom fields
  console.log('\n📝 Updating users collection with custom fields...');
  try {
    const usersResponse = await fetch(`${POCKETBASE_URL}/api/collections/users`, {
      headers,
    });

    if (usersResponse.ok) {
      const usersCollection = await usersResponse.json();
      const existingFields = usersCollection.fields || [];
      const existingFieldNames = existingFields.map(f => f.name);

      const newFields = [
        { name: 'phone', type: 'text', required: false },
        { name: 'role', type: 'select', required: false, values: ['', 'customer', 'admin'] },
        { name: 'isBlocked', type: 'bool', required: false },
        { name: 'adminNotes', type: 'text', required: false },
        { name: 'lastLoginAt', type: 'date', required: false },
      ].filter(f => !existingFieldNames.includes(f.name));

      if (newFields.length > 0) {
        const updateResponse = await fetch(`${POCKETBASE_URL}/api/collections/users`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            fields: [...existingFields, ...newFields],
          }),
        });

        if (updateResponse.ok) {
          console.log('   ✅ Users collection updated');
        } else {
          const error = await updateResponse.json();
          console.log(`   ❌ Failed to update users: ${JSON.stringify(error)}`);
        }
      } else {
        console.log('   ⚠️  Users collection already has custom fields');
      }
    }
  } catch (err) {
    console.log(`   ❌ Error updating users: ${err.message}`);
  }

  console.log('\n🎉 Collection setup complete!');
  console.log('\nCollections created:');
  console.log('  - categories: Product categories with hierarchy');
  console.log('  - products: Product catalog with variants');
  console.log('  - orders: Customer orders and tracking');
  console.log('  - discounts: Discount codes and promotions');
  console.log('  - messages: Contact form submissions');
  console.log('  - addresses: User saved addresses');
  console.log('  - wishlists: User wishlists');
  console.log('  - reviews: Product reviews');
  console.log('  - settings: Site configuration');
  console.log('\nNext steps:');
  console.log('1. Configure OAuth providers in Settings > Auth providers');
  console.log('2. Set up email settings in Settings > Mail settings');
  console.log('3. Add sample products and categories');
}

setupCollections().catch(console.error);
