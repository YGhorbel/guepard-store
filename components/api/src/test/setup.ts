import { mock } from "bun:test";

mock.module("../lib/prisma", () => ({
  prisma: {
    product: {
      findMany: mock(() => Promise.resolve([])),
      findUnique: mock(() => Promise.resolve(null)),
      create: mock((args: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "test-id", ...args.data })
      ),
      update: mock((args: { where: { id: string }; data: Record<string, unknown> }) =>
        Promise.resolve({ id: args.where.id, ...args.data })
      ),
      delete: mock(() => Promise.resolve({})),
    },
    category: {
      findMany: mock(() => Promise.resolve([])),
    },
  },
}));
