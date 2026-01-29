import { useState } from "react";
import { Product, Category, ProductVariant, ProductImage } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  onSubmit: (data: Partial<Product> & { images?: string[], variants?: Partial<ProductVariant>[] }) => void;
  onCancel: () => void;
}

export const ProductForm = ({ product, categories, onSubmit, onCancel }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    stock: product?.stock?.toString() || "",
    category_id: product?.categoryId || "",
    image_url: product?.imageUrl || "",
  });

  const [images, setImages] = useState<string[]>(
    product?.images?.map(img => img.url) || (product?.imageUrl ? [product.imageUrl] : [])
  );
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>(
    product?.variants || []
  );

  const addImage = () => {
    setImages([...images, ""]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, url: string) => {
    const newImages = [...images];
    newImages[index] = url;
    setImages(newImages);
  };

  const addVariant = () => {
    setVariants([...variants, {
      size: "",
      color: "",
      material: "",
      price: undefined,
      stock: 0,
      sku: "",
      isDefault: variants.length === 0,
    }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      images: images.filter(url => url.trim() !== ""),
      variants: variants.length > 0 ? variants : undefined,
    });
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        {/* 👇 Added font-heading class */}
        <CardTitle className="font-heading">{product ? "Edit Product" : "Add New Product"}</CardTitle>
        <CardDescription>
          {product ? "Update product information" : "Create a new product in your catalog"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (TND)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Product Images</Label>
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {images.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="url"
                      value={url}
                      onChange={(e) => updateImage(index, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImage}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Image
                </Button>
              </div>
            </ScrollArea>
            <p className="text-sm text-muted-foreground">
              First image will be used as primary. Add multiple images for gallery.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Product Variants (Optional)</Label>
            <ScrollArea className="max-h-64">
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-base">Variant {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariant(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`variant-sku-${index}`}>SKU</Label>
                        <Input
                          id={`variant-sku-${index}`}
                          value={variant.sku || ""}
                          onChange={(e) => updateVariant(index, "sku", e.target.value)}
                          placeholder="PROD-SKU-001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`variant-stock-${index}`}>Stock</Label>
                        <Input
                          id={`variant-stock-${index}`}
                          type="number"
                          min="0"
                          value={variant.stock || 0}
                          onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`variant-size-${index}`}>Size</Label>
                        <Input
                          id={`variant-size-${index}`}
                          value={variant.size || ""}
                          onChange={(e) => updateVariant(index, "size", e.target.value)}
                          placeholder="Small, Medium, Large"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`variant-color-${index}`}>Color</Label>
                        <Input
                          id={`variant-color-${index}`}
                          value={variant.color || ""}
                          onChange={(e) => updateVariant(index, "color", e.target.value)}
                          placeholder="Black, White, Red"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`variant-material-${index}`}>Material</Label>
                        <Input
                          id={`variant-material-${index}`}
                          value={variant.material || ""}
                          onChange={(e) => updateVariant(index, "material", e.target.value)}
                          placeholder="Cotton, Leather, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`variant-price-${index}`}>Price (Optional)</Label>
                        <Input
                          id={`variant-price-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.price?.toString() || ""}
                          onChange={(e) => updateVariant(index, "price", e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="Override base price"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={variant.isDefault || false}
                          onChange={(e) => updateVariant(index, "isDefault", e.target.checked)}
                          className="rounded"
                        />
                        Set as default variant
                      </Label>
                    </div>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addVariant}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variant
                </Button>
              </div>
            </ScrollArea>
            <p className="text-sm text-muted-foreground">
              Variants allow different sizes, colors, or materials with individual pricing and stock.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {product ? "Update Product" : "Create Product"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};