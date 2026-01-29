import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, ProductVariant } from '@/types/types';
import { useToast } from '@/hooks/use-toast';

export interface CartItem extends Product {
  quantity: number;
  selectedVariantId?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, variantId?: string) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getCartItemKey = (productId: string, variantId?: string) => {
  return variantId ? `${productId}-${variantId}` : productId;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const getProductStock = (product: Product, variantId?: string): number => {
    if (variantId) {
      const variant = product.variants?.find(v => v.id === variantId);
      return variant?.stock ?? product.stock;
    }
    return product.stock;
  };

  const getProductPrice = (product: Product, variantId?: string): number => {
    if (variantId) {
      const variant = product.variants?.find(v => v.id === variantId);
      return variant?.price ?? product.price;
    }
    return product.price;
  };

  const addToCart = (product: Product, variantId?: string) => {
    setCartItems((prevItems) => {
      const itemKey = getCartItemKey(product.id, variantId);
      const existingItem = prevItems.find(
        (item) => getCartItemKey(item.id, item.selectedVariantId) === itemKey
      );
      
      const stock = getProductStock(product, variantId);
      
      if (existingItem && existingItem.quantity >= stock) {
        toast({
          title: "Stock limit reached",
          description: `You cannot add more of ${product.name}.`,
          variant: "destructive",
        });
        return prevItems;
      }
      
      if (existingItem) {
        return prevItems.map((item) =>
          getCartItemKey(item.id, item.selectedVariantId) === itemKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      const variant = variantId ? product.variants?.find(v => v.id === variantId) : undefined;
      const variantName = variant 
        ? `${product.name}${variant.size ? ` - ${variant.size}` : ''}${variant.color ? ` (${variant.color})` : ''}`
        : product.name;
      
      return [...prevItems, { ...product, quantity: 1, selectedVariantId: variantId }];
    });
    
    const variant = variantId ? product.variants?.find(v => v.id === variantId) : undefined;
    const variantName = variant 
      ? `${product.name}${variant.size ? ` - ${variant.size}` : ''}${variant.color ? ` (${variant.color})` : ''}`
      : product.name;
    
    toast({ title: "Added to cart", description: `${variantName} has been added.` });
  };
  const removeFromCart = (productId: string, variantId?: string) => {
    setCartItems((prevItems) => {
      const itemKey = getCartItemKey(productId, variantId);
      return prevItems.filter(
        (item) => getCartItemKey(item.id, item.selectedVariantId) !== itemKey
      );
    });
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
    } else {
      setCartItems((prevItems) => {
        const itemKey = getCartItemKey(productId, variantId);
        return prevItems.map((item) =>
          getCartItemKey(item.id, item.selectedVariantId) === itemKey
            ? { ...item, quantity }
            : item
        );
      });
    }
  };
  
  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => {
    const price = getProductPrice(item, item.selectedVariantId);
    return total + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};