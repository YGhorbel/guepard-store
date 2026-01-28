import { describe, it, expect } from "bun:test";
import { mock } from "bun:test";
import request from "supertest";
import app from "../app";
import { isContractMode } from "./testMode";

if (isContractMode()) {
  const mockCategories = [
    {
      id: "cat-1",
      name: "Electronics",
      slug: "electronics",
      description: "Electronic devices and accessories",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "cat-2",
      name: "Books",
      slug: "books",
      description: "Books and reading material",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  mock.module("../lib/prisma", () => ({
    prisma: {
      product: {
        findMany: mock(() => Promise.resolve([])),
        findUnique: mock(() => Promise.resolve(null)),
        create: mock((args: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: "created-1", ...args.data }),
        ),
        update: mock((args: { where: { id: string }; data: Record<string, unknown> }) =>
          Promise.resolve({ id: args.where.id, ...args.data }),
        ),
        delete: mock(() => Promise.resolve({})),
      },
      category: {
        findMany: mock(() => Promise.resolve(mockCategories)),
      },
    },
  }));

  describe("API contract - GET /api/categories", () => {
    it("returns 200 and an array of categories with the expected shape", async () => {
      const res = await request(app).get("/api/categories");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const category = res.body[0];

      expect(typeof category.id).toBe("string");
      expect(typeof category.name).toBe("string");
      expect(typeof category.slug).toBe("string");
      expect(typeof category.description === "string" || category.description === null).toBe(true);
    });
  });
}

