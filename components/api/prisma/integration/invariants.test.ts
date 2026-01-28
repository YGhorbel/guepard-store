import { beforeAll, afterAll, describe, expect, it } from "bun:test";
import { PrismaClient } from "@prisma/client";
import { createTestData } from "./fixtures";

const prisma = new PrismaClient();

beforeAll(async () => {
  await createTestData(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("DB invariants", () => {
  it("no product has negative stock", async () => {
    const bad = await prisma.product.findMany({
      where: { stock: { lt: 0 } },
    });
    expect(bad.length).toBe(0);
  });

  it("all products reference an existing category", async () => {
    const products = await prisma.product.findMany();
    const categories = await prisma.category.findMany();
    const categoryIds = new Set(categories.map((c) => c.id));

    for (const p of products) {
      expect(categoryIds.has(p.categoryId)).toBe(true);
    }
  });

  it("order totals match the sum of order items", async () => {
    const orders = await prisma.order.findMany({
      include: { orderItems: true },
    });

    for (const order of orders) {
      const sum = order.orderItems.reduce(
        (acc, item) => acc + Number(item.priceAtTime) * item.quantity,
        0,
      );
      expect(Number(order.totalAmount)).toBe(sum);
    }
  });
});

