import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration: Add Multiple Product Images Feature
 * 
 * Schema changes required:
 * 
 * model ProductImage {
 *   id          String    @id @default(uuid()) @db.Uuid
 *   product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
 *   productId   String    @map("product_id") @db.Uuid
 *   url         String    @db.Text
 *   alt         String?   @db.VarChar(255)
 *   order       Int       @default(0)
 *   isPrimary   Boolean   @default(false) @map("is_primary")
 *   createdAt   DateTime  @default(now()) @map("created_at")
 *   updatedAt   DateTime  @updatedAt @map("updated_at")
 * 
 *   @@map("product_images")
 *   @@index([productId])
 * }
 * 
 * Update Product model:
 * - Keep imageUrl for backward compatibility (can be removed later)
 * - Add relation to ProductImage[]
 */

const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    if (tableName === 'products') {
      await prisma.product.findFirst();
      return true;
    }
    if (tableName === 'product_images') {
      await prisma.$queryRawUnsafe(`SELECT 1 FROM product_images LIMIT 1`);
      return true;
    }
    await prisma.$queryRawUnsafe(`SELECT 1 FROM "${tableName}" LIMIT 1`);
    return true;
  } catch (error: any) {
    if (error?.code === '42P01' || error?.message?.includes('does not exist') || error?.message?.includes('relation')) {
      return false;
    }
    console.warn(`Warning: Could not verify table ${tableName}, assuming it exists. Error: ${error?.message}`);
    return true;
  }
};

const main = async () => {
  console.log('Running migration: Add Multiple Product Images Feature...');

  try {
    const productsTableExists = await checkTableExists('products');
    const imagesTableExists = await checkTableExists('product_images');

    if (!productsTableExists) {
      console.log('⚠️  Products table does not exist. Please run Prisma migrations first:');
      console.log('   bunx prisma migrate dev');
      console.log('   Then run this migration again.');
      return;
    }

    if (!imagesTableExists) {
      console.log('Creating product_images table...');
      await prisma.$executeRaw`
        CREATE TABLE product_images (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          url TEXT NOT NULL,
          alt VARCHAR(255),
          "order" INTEGER NOT NULL DEFAULT 0,
          is_primary BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;

      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_product_images_order ON product_images(product_id, "order");
      `;
    } else {
      console.log('product_images table already exists, skipping creation.');
    }

    const products = await prisma.product.findMany();

    if (products.length > 0) {
      console.log('Migrating existing product images...');

      for (const product of products) {
        // Check if product already has images
        const existingImages = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count FROM product_images WHERE product_id = ${product.id}::uuid
        `;
        
        if (existingImages[0]?.count && Number(existingImages[0].count) > 0) {
          console.log(`Product ${product.name} already has images, skipping...`);
          continue;
        }

        if (product.imageUrl) {
          await prisma.$executeRaw`
            INSERT INTO product_images (
              id, product_id, url, alt, "order", is_primary, created_at, updated_at
            ) VALUES (
              gen_random_uuid(),
              ${product.id}::uuid,
              ${product.imageUrl},
              ${product.name || 'Product image'},
              0,
              true,
              NOW(),
              NOW()
            );
          `;
        }

        const additionalImages = [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
        ];

        for (let i = 0; i < 2; i++) {
          await prisma.$executeRaw`
            INSERT INTO product_images (
              id, product_id, url, alt, "order", is_primary, created_at, updated_at
            ) VALUES (
              gen_random_uuid(),
              ${product.id}::uuid,
              ${additionalImages[i % additionalImages.length]},
              ${`${product.name || 'Product'} - View ${i + 2}`},
              ${i + 1},
              false,
              NOW(),
              NOW()
            );
          `;
        }
      }

      console.log(`Created image galleries for ${products.length} products.`);
    }

    console.log('Migration completed: Multiple Product Images feature added successfully.');
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
