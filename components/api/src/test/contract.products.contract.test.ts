import { describe, it, expect } from "bun:test";
import { mock } from "bun:test";
import request from "supertest";
import app from "../app";
import { isContractMode } from "./testMode";

if (isContractMode()) {
  const mockCategory = {
    id: "cat-1",
    name: "Electronics",
    slug: "electronics",
    description: "Electronic devices and accessories",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockProduct = {
    id: "prod-1",
    name: "Wireless Headphones",
    description: "Premium noise-cancelling wireless headphones",
    price: 199.99,
    stock: 10,
    imageUrl: "https://example.com/headphones.jpg",
    categoryId: mockCategory.id,
    category: mockCategory,
  };

  mock.module("../lib/prisma", () => ({
    prisma: {
      product: {
        findMany: mock(() => Promise.resolve([mockProduct])),
        findUnique: mock(
          (args: { where: { id: string } }) =>
            Promise.resolve(args.where.id === mockProduct.id ? mockProduct : null),
        ),
        create: mock((args: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: "created-1", ...args.data }),
        ),
        update: mock((args: { where: { id: string }; data: Record<string, unknown> }) =>
          Promise.resolve({ id: args.where.id, ...args.data }),
        ),
        delete: mock(() => Promise.resolve({})),
      },
      category: {
        findMany: mock(() => Promise.resolve([mockCategory])),
      },
    },
  }));

  describe("API contract - GET /api/products", () => {
    it("returns 200 and an array of products with the expected shape", async () => {
      const res = await request(app).get("/api/products");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const product = res.body[0];

      expect(typeof product.id).toBe("string");
      expect(typeof product.name).toBe("string");
      expect(typeof product.description).toBe("string");
      expect(typeof product.price).toBe("number");
      expect(typeof product.stock).toBe("number");

      expect(product.category).toBeDefined();
      expect(typeof product.category.id).toBe("string");
      expect(typeof product.category.name).toBe("string");
      expect(typeof product.category.slug).toBe("string");
    });
  });

  describe("API contract - GET /api/products/:id", () => {
    it("returns 200 and a single product when it exists", async () => {
      const res = await request(app).get(`/api/products/${mockProduct.id}`);

      expect(res.status).toBe(200);

      const product = res.body;

      expect(product.id).toBe(mockProduct.id);
      expect(typeof product.name).toBe("string");
      expect(typeof product.description).toBe("string");
      expect(typeof product.price).toBe("number");
      expect(typeof product.stock).toBe("number");

      expect(product.category).toBeDefined();
      expect(product.category.id).toBe(mockCategory.id);
      expect(product.category.slug).toBe(mockCategory.slug);
    });

    it("returns 404 with error payload when product does not exist", async () => {
      const res = await request(app).get("/api/products/non-existent-id");

      expect(res.status).toBe(404);
      expect(res.body).toBeDefined();
      expect(typeof res.body.error).toBe("string");
      expect(res.body.error).toBe("Product not found");
    });
  });
}

