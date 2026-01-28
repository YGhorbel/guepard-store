import type { PrismaClient } from "@prisma/client";

export async function createTestData(prisma: PrismaClient) {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const electronics = await prisma.category.create({
    data: {
      name: "Electronics",
      slug: "electronics",
      description: "Electronic devices and accessories",
    },
  });

  const books = await prisma.category.create({
    data: {
      name: "Books",
      slug: "books",
      description: "Books and reading material",
    },
  });

  const headphones = await prisma.product.create({
    data: {
      name: "Wireless Headphones",
      description: "Noise cancelling wireless headphones",
      price: 199.99,
      stock: 10,
      categoryId: electronics.id,
      imageUrl: "https://example.com/headphones.jpg",
    },
  });

  const guide = await prisma.product.create({
    data: {
      name: "Programming Guide",
      description: "Modern web development guide",
      price: 49.99,
      stock: 5,
      categoryId: books.id,
      imageUrl: "https://example.com/guide.jpg",
    },
  });

  const order = await prisma.order.create({
    data: {
      clientName: "Test User",
      clientPhone: "0000000000",
      clientAddress: "Test Address",
      totalAmount: 199.99 + 2 * 49.99,
      status: "pending",
      orderItems: {
        create: [
          { productId: headphones.id, quantity: 1, priceAtTime: 199.99 },
          { productId: guide.id, quantity: 2, priceAtTime: 49.99 },
        ],
      },
    },
    include: { orderItems: true },
  });

  return { electronics, books, headphones, guide, order };
}

