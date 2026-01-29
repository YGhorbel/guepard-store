import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { ProductForm } from "@/components/ProductForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Product } from "@/types/types";
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  ProductFormData,
} from "@/services/api";
import { Plus, ArrowLeft, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const Admin = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | undefined>();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const onSuccess = (message: string) => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    toast({ title: message });
    setIsFormOpen(false);
    setEditingProduct(undefined);
    setDeleteDialogOpen(false);
    setProductToDelete(undefined);
  };

  const onError = (error: Error, defaultMessage: string) => {
    toast({ title: defaultMessage, description: error.message, variant: "destructive" });
  };

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => createProduct(data),
    onSuccess: () => onSuccess("Product created successfully"),
    onError: (error) => onError(error, "Failed to create product"),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; data: Partial<Product> }) => updateProduct(vars),
    onSuccess: () => onSuccess("Product updated successfully"),
    onError: (error) => onError(error, "Failed to update product"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => onSuccess("Product deleted successfully"),
    onError: (error) => onError(error, "Failed to delete product"),
  });

  const handleSubmit = (data: Partial<Product> & { 
    category_id?: string; 
    image_url?: string;
    images?: string[];
    variants?: Array<{
      sku?: string;
      size?: string;
      color?: string;
      material?: string;
      price?: number;
      stock: number;
      imageUrl?: string;
      isDefault?: boolean;
    }>;
  }) => {
    const productDataForApi = {
      name: data.name!,
      description: data.description!,
      price: data.price!,
      stock: data.stock!,
      imageUrl: data.image_url || data.images?.[0] || '',
      categoryId: data.category_id!,
      images: data.images,
      variants: data.variants,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: productDataForApi });
    } else {
      createMutation.mutate(productDataForApi);
    }
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(undefined);
    setIsFormOpen(true);
  };

  const isLoading = productsLoading || categoriesLoading;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Package className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold font-heading">Admin Dashboard</h1>
              </div>
            </div>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="w-5 h-5" />
              Add Product
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-muted-foreground text-sm font-medium mb-2">Total Products</h3>
            <p className="text-3xl font-bold text-primary font-heading">{products.length}</p>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-muted-foreground text-sm font-medium mb-2">Total Stock</h3>
            <p className="text-3xl font-bold text-primary font-heading">
              {products.reduce((sum, p) => sum + p.stock, 0)}
            </p>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-muted-foreground text-sm font-medium mb-2">Categories</h3>
            <p className="text-3xl font-bold text-primary font-heading">{categories.length}</p>
          </div>
        </div>

        <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 font-heading">Manage Products</h2>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-lg" />)}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showAdminActions
                onEdit={() => handleEdit(product)}
                onDelete={() => handleDeleteClick(product)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg border">
             <p className="text-muted-foreground text-lg mb-4">No products yet.</p>
             <Button onClick={handleAddNew}><Plus className="w-5 h-5 mr-2" />Add Your First Product</Button>
          </div>
        )}
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete "{productToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;