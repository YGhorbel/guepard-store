import { useMemo, useState } from "react";
import { Product } from "@/types/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Package, ChevronLeft, ChevronRight } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, variantId?: string) => void;
  showAdminActions?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export const ProductCard = ({ 
  product, 
  onAddToCart, 
  showAdminActions = false,
  onEdit,
  onDelete 
}: ProductCardProps) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product.variants?.find(v => v.isDefault)?.id || product.variants?.[0]?.id
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);
  const displayPrice = selectedVariant?.price ?? product.price;
  const displayStock = selectedVariant?.stock ?? product.stock;
  const displayImageUrl = selectedVariant?.imageUrl || 
    product.images?.find(img => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    product.imageUrl;

  const images = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return [...product.images].sort((a, b) => a.order - b.order);
    }
    return product.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : [];
  }, [product.images, product.imageUrl, product.name]);

  const hasVariants = product.variants && product.variants.length > 0;
  const hasMultipleImages = images.length > 1;

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (!hasMultipleImages) return;
    setCurrentImageIndex((prev) => {
      if (direction === 'next') {
        return prev === images.length - 1 ? 0 : prev + 1;
      } else {
        return prev === 0 ? images.length - 1 : prev - 1;
      }
    });
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, selectedVariantId);
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col">
      <div className="aspect-square overflow-hidden bg-muted relative group">
        {displayImageUrl ? (
          <>
            <img 
              src={images[currentImageIndex]?.url || displayImageUrl} 
              alt={images[currentImageIndex]?.alt || product.name}
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
            {hasMultipleImages && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageNavigation('prev');
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageNavigation('next');
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentImageIndex ? 'bg-primary' : 'bg-background/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 font-heading">{product.name}</CardTitle>
          <Badge variant={displayStock > 0 ? "default" : "secondary"} className="whitespace-nowrap">
            {displayStock > 0 ? `${displayStock} in stock` : "Out of stock"}
          </Badge>
        </div>
        {product.category && (
          <Badge variant="outline" className="w-fit">
            {product.category.name}
          </Badge>
        )}
        <CardDescription className="line-clamp-2 h-[40px]">
          {product.description}
        </CardDescription>
      </CardHeader>

      {hasVariants && (
        <CardContent className="space-y-2">
          <div className="space-y-2">
            {product.variants!.some(v => v.size) && (
              <div>
                <label className="text-sm font-medium mb-1 block">Size</label>
                <Select
                  value={selectedVariantId}
                  onValueChange={setSelectedVariantId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.variants!
                      .filter(v => v.size)
                      .map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.size}
                          {variant.color && ` - ${variant.color}`}
                          {variant.stock === 0 && " (Out of stock)"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {product.variants!.some(v => v.color && !v.size) && (
              <div>
                <label className="text-sm font-medium mb-1 block">Color</label>
                <Select
                  value={selectedVariantId}
                  onValueChange={setSelectedVariantId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.variants!
                      .filter(v => v.color)
                      .map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.color}
                          {variant.stock === 0 && " (Out of stock)"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      )}

      <CardContent className="mt-auto">
        <p className="text-2xl font-bold text-primary font-heading">
          ${displayPrice.toFixed(2)}
          {selectedVariant && selectedVariant.price && selectedVariant.price !== product.price && (
            <span className="text-sm text-muted-foreground line-through ml-2">
              ${product.price.toFixed(2)}
            </span>
          )}
        </p>
      </CardContent>

      <CardFooter className="gap-2">
        {!showAdminActions && onAddToCart && (
          <Button 
            className="w-full" 
            onClick={handleAddToCart}
            disabled={displayStock === 0}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        )}
        
        {showAdminActions && (
          <>
            <Button variant="outline" className="flex-1" onClick={() => onEdit?.(product)}>
              Edit
            </Button>
            <Button variant="destructive" className="flex-1" onClick={() => onDelete?.(product)}>
              Delete
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};