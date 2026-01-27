import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./api";

const server = setupServer(
  http.get("http://localhost/products", () =>
    HttpResponse.json([
      {
        id: "1",
        name: "Test Product",
        description: "Desc",
        price: "19.99",
        stock: 10,
        categoryId: "c1",
        category: { id: "c1", name: "Cat", slug: "cat" },
      },
    ])
  ),
  http.get("http://localhost/categories", () =>
    HttpResponse.json([{ id: "c1", name: "Electronics", slug: "electronics" }])
  ),
  http.post("http://localhost/products", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: "new-1", ...body }, { status: 201 });
  }),
  http.put("http://localhost/products/:id", async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({ id: params.id, ...body });
  }),
  http.delete("http://localhost/products/:id", () => new HttpResponse(null, { status: 204 }))
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("api", () => {
  it("getProducts returns products with parsed prices", async () => {
    const products = await getProducts();
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe("Test Product");
    expect(products[0].price).toBe(19.99);
  });

  it("getProducts with search and category returns products", async () => {
    const products = await getProducts({ search: "laptop", category: "c1" });
    expect(products).toHaveLength(1);
  });

  it("getCategories returns categories", async () => {
    const categories = await getCategories();
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe("Electronics");
  });

  it("createProduct sends POST and returns product", async () => {
    const created = await createProduct({
      name: "New",
      description: "D",
      price: 9.99,
      stock: 5,
      imageUrl: "",
      categoryId: "c1",
    });
    expect(created.id).toBe("new-1");
    expect(created.name).toBe("New");
  });

  it("updateProduct sends PUT", async () => {
    const updated = await updateProduct({
      id: "1",
      data: { name: "Updated" },
    });
    expect(updated.id).toBe("1");
    expect(updated.name).toBe("Updated");
  });

  it("deleteProduct sends DELETE", async () => {
    await expect(deleteProduct("1")).resolves.not.toThrow();
  });
});
