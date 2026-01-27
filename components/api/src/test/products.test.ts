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

describe("GET /api/products/:id", () => {
  it("returns 404 when product not found", async () => {
    const res = await request(app).get("/api/products/non-existent-id");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Product not found");
  });
});

describe("POST /api/products", () => {
  it("returns 201 and created product", async () => {
    const res = await request(app)
      .post("/api/products")
      .send({
        name: "New Product",
        description: "Desc",
        price: 9.99,
        stock: 5,
        imageUrl: "",
        categoryId: "cat-1",
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("New Product");
    expect(res.body.id).toBeDefined();
  });
});

describe("DELETE /api/products/:id", () => {
  it("returns 204", async () => {
    const res = await request(app).delete("/api/products/some-id");
    expect(res.status).toBe(204);
  });
});

describe("GET /api/categories", () => {
  it("returns 200 and array", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
