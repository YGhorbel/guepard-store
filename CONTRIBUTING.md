# Contribution Guide

## CI Pipeline Overview

Your changes must pass these stages:

1. **Unit Tests** (frontend + API)
2. **DB Integration Tests** (clone, migrate, seed, validate)
3. **API Contract Tests**
4. **PR Accepted** (all checks green)

---

## Frontend Changes

### What to Test

- **Unit tests** (`components/frontend/src/**/*.test.ts`):
  - Pure functions (e.g. `lib/utils.ts`)
  - Component behavior (user interactions, state changes)
  - Service functions (API calls with MSW mocks)

### Adding Frontend Tests

**Location**: `components/frontend/src/`

**Example - Component test** (`components/SearchBar.test.tsx`):
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("calls onSearch when form is submitted", async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} ... />);
    // ... test interactions
  });
});
```

**Example - Service test** (`services/api.test.ts`):
```tsx
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { getProducts } from "./api";

const server = setupServer(
  http.get("http://localhost/products", () =>
    HttpResponse.json([{ id: "1", name: "Test" }])
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("getProducts returns products", async () => {
  const products = await getProducts();
  expect(products).toHaveLength(1);
});
```

**Run locally**:
```bash
cd components/frontend
pnpm test:run
```

**CI runs**: `pnpm test:run` (Vitest)

---

## Backend/API Changes

### What to Test

- **Unit tests** (`components/api/src/test/*.test.ts`):
  - Route handlers with mocked Prisma
  - Business logic functions
  - Edge cases (404, validation errors)

- **API Contract tests** (`components/api/src/test/contract.*.test.ts`):
  - HTTP contract (status codes, response shapes)
  - Request/response schemas
  - Error payloads

### Adding API Unit Tests

**Location**: `components/api/src/test/`

**Example** (`src/test/products.test.ts`):
```ts
import { describe, it, expect } from "bun:test";
import request from "supertest";
import app from "../app";

describe("GET /api/products", () => {
  it("returns 200 and array", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

**Run locally**:
```bash
cd components/api
pnpm test:unit
```

**CI runs**: `pnpm test:unit` (Bun test runner with mocked Prisma)

### Adding API Contract Tests

**Location**: `components/api/src/test/contract.*.test.ts`

**Important**: Contract tests only run when `TEST_MODE=contract` is set.

**Example** (`src/test/contract.products.contract.test.ts`):
```ts
import { describe, it, expect } from "bun:test";
import { mock } from "bun:test";
import request from "supertest";
import app from "../app";
import { isContractMode } from "./testMode";

if (isContractMode()) {
  // Mock Prisma with deterministic data
  mock.module("../lib/prisma", () => ({
    prisma: {
      product: {
        findMany: mock(() => Promise.resolve([mockProduct])),
        // ...
      },
    },
  }));

  describe("API contract - GET /api/products", () => {
    it("returns 200 and products with expected shape", async () => {
      const res = await request(app).get("/api/products");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      const product = res.body[0];
      expect(typeof product.id).toBe("string");
      expect(typeof product.price).toBe("number");
      expect(product.category).toBeDefined();
      expect(typeof product.category.slug).toBe("string");
    });
  });
}
```

**Run locally**:
```bash
cd components/api
TEST_MODE=contract pnpm test
```

**CI runs**: `pnpm test` with `TEST_MODE=contract` (dedicated job)

---

## Database Schema Changes

### Workflow

1. **Create migration locally**:
   ```bash
   cd components/api
   bunx prisma migrate dev --name add_new_field
   ```

2. **Commit migration files**:
   - `prisma/migrations/YYYYMMDDHHMMSS_add_new_field/migration.sql`
   - Updated `prisma/schema.prisma`

3. **Update fixtures** (`prisma/integration/fixtures.ts`):
   - If new fields are required, update `createTestData()` to include them
   - Ensure test data matches the new schema

4. **Update invariants** (`prisma/integration/invariants.test.ts`):
   - Add tests for new constraints/business rules
   - Example: if you add a `minStock` field, test that products respect it

### What CI Does

**DB Integration Tests** job:

1. Clones a deployment snapshot (from `main` branch)
2. Waits for compute to be healthy
3. **Applies your migrations** (`prisma migrate deploy`)
4. Seeds test data (`bun run prisma/integration/seed.ts`)
5. Runs invariants (`prisma/integration/invariants.test.ts`)
6. Cleans up clone

**If migrations fail**: CI fails → fix migration SQL and retry.

**If invariants fail**: Your new schema breaks existing rules → update invariants or fix schema.

### Adding DB Integration Tests

**Location**: `components/api/prisma/integration/`

**Update fixtures** (`fixtures.ts`):
```ts
export async function createTestData(prisma: PrismaClient) {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  // ...

  // Create data matching NEW schema
  const category = await prisma.category.create({
    data: {
      name: "Electronics",
      slug: "electronics",
      // Include any NEW required fields here
    },
  });
  // ...
}
```

**Add invariants** (`invariants.test.ts`):
```ts
describe("DB invariants", () => {
  // Existing tests...

  it("new constraint: products respect minimum stock", async () => {
    const products = await prisma.product.findMany();
    for (const p of products) {
      expect(p.stock).toBeGreaterThanOrEqual(p.minStock || 0);
    }
  });
});
```

**Run locally** (requires Guepard clone):
```bash
# 1. Clone a deployment
guepard clone -x <deployment-id> -s <snapshot-id>

# 2. Get connection string from clone output

# 3. Run migrations + seed + invariants
cd components/api
DATABASE_URL="postgres://..." bunx prisma migrate deploy
DATABASE_URL="postgres://..." bun run prisma/integration/seed.ts
DATABASE_URL="postgres://..." bun test prisma/integration/invariants.test.ts
```

**CI runs**: Automatically in `db-integration-tests` job

---

## Checklist Before Pushing

### Frontend Changes

- [ ] Unit tests pass: `cd components/frontend && pnpm test:run`
- [ ] New components have tests
- [ ] API service changes have MSW mocks in tests
- [ ] No console errors/warnings

### Backend Changes

- [ ] Unit tests pass: `cd components/api && pnpm test:unit`
- [ ] New routes have unit tests
- [ ] **API contract tests pass**: `TEST_MODE=contract pnpm test`
- [ ] New endpoints have contract tests (status codes, response shapes)
- [ ] Error cases are tested (404, 400, 500)

### Database Changes

- [ ] Migration created: `bunx prisma migrate dev --name <name>`
- [ ] Migration files committed (`prisma/migrations/`)
- [ ] `schema.prisma` updated and committed
- [ ] Fixtures updated (`prisma/integration/fixtures.ts`) if schema changed
- [ ] Invariants updated (`prisma/integration/invariants.test.ts`) if rules changed
- [ ] Tested locally against a Guepard clone (optional but recommended)

### General

- [ ] All CI jobs pass (check GitHub Actions)
- [ ] No linter errors
- [ ] Code follows project patterns (see existing tests)

---

## Common Scenarios

### Scenario 1: Adding a New API Endpoint

**Steps**:
1. Add route in `components/api/src/routes/`
2. Add unit test in `components/api/src/test/`
3. Add contract test in `components/api/src/test/contract.*.test.ts`
4. Ensure contract test validates:
   - Status code (200, 201, 404, etc.)
   - Response shape (all fields, correct types)
   - Error payloads if applicable

### Scenario 2: Changing Database Schema

**Steps**:
1. Update `prisma/schema.prisma`
2. Create migration: `bunx prisma migrate dev --name <name>`
3. Update `prisma/integration/fixtures.ts` to include new fields
4. Add/update invariants in `prisma/integration/invariants.test.ts`
5. Test locally against a clone (optional)

### Scenario 3: Adding a New Frontend Feature

**Steps**:
1. Add component/page
2. Add component test (`*.test.tsx`)
3. If it calls API, add MSW handler in `services/api.test.ts`
4. Test user interactions (clicks, form submissions, etc.)

### Scenario 4: Fixing a Bug

**Steps**:
1. Write a failing test that reproduces the bug
2. Fix the bug
3. Ensure test passes
4. Ensure all other tests still pass

---

## Testing Philosophy

- **Unit tests**: Fast, isolated, mock external dependencies
- **Contract tests**: Validate HTTP API contracts (what clients expect)
- **DB integration tests**: Validate schema + data integrity + business rules

**Don't**:
- Mock Prisma in DB integration tests (use real DB)
- Mock API calls in DB integration tests
- Skip tests because "they're hard to write"

**Do**:
- Write tests before/alongside code (TDD when possible)
- Keep tests simple and focused
- Use descriptive test names (`"returns 404 when product not found"` not `"test1"`)
- Clean up test data (fixtures handle this)

---

## Getting Help

- Check existing tests for patterns
- Review CI logs if tests fail
- Ask team for code review before merging

---

## Quick Reference

| Test Type | Location | Run Locally | CI Job |
|-----------|----------|-------------|--------|
| Frontend unit | `components/frontend/src/**/*.test.ts` | `pnpm test:run` | `frontend-tests` |
| API unit | `components/api/src/test/*.test.ts` | `pnpm test:unit` | `api-tests` |
| API contract | `components/api/src/test/contract.*.test.ts` | `TEST_MODE=contract pnpm test` | `api-contract-tests` |
| DB integration | `components/api/prisma/integration/` | `DATABASE_URL=... bun test prisma/integration/` | `db-integration-tests` |
