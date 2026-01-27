import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "./SearchBar";

const categories = [
  { id: "1", name: "Electronics", slug: "electronics" },
  { id: "2", name: "Clothing", slug: "clothing" },
];

describe("SearchBar", () => {
  it("calls onSearch when form is submitted", async () => {
    const onSearch = vi.fn();
    render(
      <SearchBar
        onSearch={onSearch}
        onCategoryFilter={vi.fn()}
        categories={categories}
      />
    );
    const input = screen.getByPlaceholderText("Search products...");
    await userEvent.type(input, "laptop");
    const form = input.closest("form");
    form?.requestSubmit();
    expect(onSearch).toHaveBeenCalledWith("laptop");
  });

  it("calls onSearch with empty string when clear is clicked", async () => {
    const onSearch = vi.fn();
    render(
      <SearchBar
        onSearch={onSearch}
        onCategoryFilter={vi.fn()}
        categories={categories}
      />
    );
    const input = screen.getByPlaceholderText("Search products...");
    await userEvent.type(input, "x");
    const buttons = screen.getAllByRole("button");
    const clearBtn = buttons.find((b) => !b.textContent?.includes("Search"));
    clearBtn?.click();
    expect(onSearch).toHaveBeenCalledWith("");
  });

  it("renders categories in select", () => {
    render(
      <SearchBar
        onSearch={vi.fn()}
        onCategoryFilter={vi.fn()}
        categories={categories}
      />
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
