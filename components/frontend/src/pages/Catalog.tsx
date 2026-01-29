import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/types";
import { getProducts, getCategories } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { CartDialog } from "@/components/CartDialog";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const Catalog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const { toast } = useToast();
  const { addToCart, cartItems } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { data: products, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products', searchQuery, selectedCategory],
    queryFn: ({ queryKey }) => {
      const [_key, search, category] = queryKey;
      return getProducts({ search: search as string, category: category as string });
    },
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const handleAddToCart = (product: Product, variantId?: string) => {
    addToCart(product, variantId);
  };

  const handleCategoryFilter = (categorySlug: string) => {
    setSelectedCategory(categorySlug === "all" ? undefined : categorySlug);
  };

  const isLoading = productsLoading || categoriesLoading;

  return (
    <div className="min-h-screen bg-background">
      <CartDialog isOpen={isCartOpen} onOpenChange={setIsCartOpen} />
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img
                src="/GuepardStoreBlackText.svg"
                alt="GupardHub Logo"
                className="h-10 w-auto block dark:hidden"
              />
              <img
                src="/GuepardStoreWhiteText.svg"
                alt="GupardHub Logo"
                className="h-10 w-auto hidden dark:block"
              />
            </Link>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              <Button variant="outline" asChild>
                <Link to="/admin">Admin Dashboard</Link>
              </Button>
              <Button variant="outline" className="relative" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart className="w-5 h-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItems.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold mb-4 font-heading">Welcome to Our Store</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover amazing products at unbeatable prices. Shop from our extensive catalog of high-quality items.
          </p>
        </div>

        <div className="mb-8">
          <SearchBar
            onSearch={setSearchQuery}
            onCategoryFilter={handleCategoryFilter}
            categories={categories}
            selectedCategory={selectedCategory}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[250px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : productsError ? (
          <div className="text-center py-12">
            <p className="text-destructive text-lg">Failed to load products. Please try again later.</p>
          </div>
        ) : products && products.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-muted-foreground">
                Showing {products.length} {products.length === 1 ? "product" : "products"}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No products found matching your criteria.</p>
          </div>
        )}
      </main>

      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
          <p>© 2025 GuepardStore. Official Demo E-commerce Application For Guepard Platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default Catalog;