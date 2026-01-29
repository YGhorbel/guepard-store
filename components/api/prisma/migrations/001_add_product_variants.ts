import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration: Add Product Variants Feature
 * 
 * Schema changes required:
 * 
 * model ProductVariant {
 *   id          String    @id @default(uuid()) @db.Uuid
 *   product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
 *   productId   String    @map("product_id") @db.Uuid
 *   sku         String?   @unique @db.VarChar(100)
 *   size        String?   @db.VarChar(50)
 *   color       String?   @db.VarChar(50)
 *   material    String?   @db.VarChar(100)
 *   price       Decimal?  @db.Decimal(10, 2)
 *   stock       Int       @default(0)
 *   imageUrl    String?   @map("image_url")
 *   isDefault   Boolean   @default(false) @map("is_default")
 *   createdAt   DateTime  @default(now()) @map("created_at")
 *   updatedAt   DateTime  @updatedAt @map("updated_at")
 *   orderItems  OrderItem[]
 * 
 *   @@map("product_variants")
 * }
 * 
 * Update OrderItem model:
 * - Add variantId field (optional)
 * - Add relation to ProductVariant
 * 
 * model OrderItem {
 *   // ... existing fields
 *   variant     ProductVariant? @relation(fields: [variantId], references: [id])
 *   variantId   String?          @map("variant_id") @db.Uuid
 * }
 */

const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    if (tableName === 'products') {
      // Use Prisma model to check - most reliable
      await prisma.product.findFirst();
      return true;
    }
    if (tableName === 'order_items') {
      await prisma.orderItem.findFirst();
      return true;
    }
    // Fallback: try raw query
    await prisma.$queryRawUnsafe(`SELECT 1 FROM "${tableName}" LIMIT 1`);
    return true;
  } catch (error: any) {
    // If table doesn't exist, PostgreSQL returns error code 42P01
    if (error?.code === '42P01' || error?.message?.includes('does not exist') || error?.message?.includes('relation')) {
      return false;
    }
    // For other errors, assume table exists (might be permission issue)
    console.warn(`Warning: Could not verify table ${tableName}, assuming it exists. Error: ${error?.message}`);
    return true;
  }
};

const main = async () => {
  console.log('Running migration: Add Product Variants Feature...');

  try {
    const productsTableExists = await checkTableExists('products');
    const orderItemsTableExists = await checkTableExists('order_items');

    if (!productsTableExists) {
      console.log('⚠️  Products table does not exist. Please run Prisma migrations first:');
      console.log('   bunx prisma migrate dev');
      console.log('   Then run this migration again.');
      return;
    }

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS product_variants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        sku VARCHAR(100) UNIQUE,
        size VARCHAR(50),
        color VARCHAR(50),
        material VARCHAR(100),
        price DECIMAL(10, 2),
        stock INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
    `;

    if (orderItemsTableExists) {
      try {
        // Check if variant_id column already exists by trying to query it
        await prisma.$queryRawUnsafe(`SELECT variant_id FROM order_items LIMIT 1`);
        console.log('variant_id column already exists in order_items table.');
      } catch (error: any) {
        // If column doesn't exist, add it
        if (error?.code === '42703' || error?.message?.includes('column') && error?.message?.includes('does not exist')) {
          try {
            await prisma.$executeRaw`
              ALTER TABLE order_items 
              ADD COLUMN variant_id UUID REFERENCES product_variants(id);
            `;

            await prisma.$executeRaw`
              CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
            `;
            console.log('Added variant_id column to order_items table.');
          } catch (alterError: any) {
            console.warn(`Warning: Could not add variant_id column: ${alterError?.message}`);
          }
        } else {
          console.warn(`Warning: Could not check variant_id column: ${error?.message}`);
        }
      }
    } else {
      console.log('⚠️  order_items table does not exist. Skipping variant_id column addition.');
    }

    const products = await prisma.product.findMany({ take: 3 });

    if (products.length > 0) {
      console.log('Seeding product variants...');

      for (const product of products) {
        const variants = [
          {
            productId: product.id,
            sku: `${product.name.toUpperCase().replace(/\s+/g, '-')}-S`,
            size: 'Small',
            color: 'Black',
            stock: Math.floor(Math.random() * 50) + 10,
            isDefault: true,
          },
          {
            productId: product.id,
            sku: `${product.name.toUpperCase().replace(/\s+/g, '-')}-M`,
            size: 'Medium',
            color: 'Black',
            stock: Math.floor(Math.random() * 50) + 10,
            isDefault: false,
          },
          {
            productId: product.id,
            sku: `${product.name.toUpperCase().replace(/\s+/g, '-')}-L`,
            size: 'Large',
            color: 'White',
            stock: Math.floor(Math.random() * 50) + 10,
            isDefault: false,
          },
        ];

        for (const variant of variants) {
          await prisma.$executeRaw`
            INSERT INTO product_variants (
              id, product_id, sku, size, color, stock, is_default, created_at, updated_at
            ) VALUES (
              gen_random_uuid(),
              ${variant.productId}::uuid,
              ${variant.sku},
              ${variant.size},
              ${variant.color},
              ${variant.stock},
              ${variant.isDefault},
              NOW(),
              NOW()
            )
            ON CONFLICT (sku) DO NOTHING;
          `;
        }
      }

      console.log(`Created variants for ${products.length} products.`);
    }

    console.log('Migration completed: Product Variants feature added successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
