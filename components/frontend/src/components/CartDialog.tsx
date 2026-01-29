import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { createOrder, OrderPayload } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { X, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CartDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const shippingSchema = z.object({
  name: z.string().min(2, { message: "Please enter a valid name." }),
  phone: z.string().min(8, { message: "Please enter a valid phone number." }),
  address: z.string().min(10, { message: "Please enter a complete address." }),
});

export const CartDialog = ({ isOpen, onOpenChange }: CartDialogProps) => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof shippingSchema>>({
    resolver: zodResolver(shippingSchema),
    defaultValues: { name: "", phone: "", address: "" },
  });

  const checkoutMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      toast({ title: "Order Placed!", description: "Thank you for your purchase." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      clearCart();
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Checkout Failed", description: error.message, variant: "destructive" });
    },
  });

  const onFormSubmit = (data: z.infer<typeof shippingSchema>) => {
    const cartItemsForApi = cartItems.map((item) => {
      const variant = item.selectedVariantId
        ? item.variants?.find((v) => v.id === item.selectedVariantId)
        : undefined;
      const displayPrice = variant?.price ?? item.price;

      return {
        id: item.id,
        quantity: item.quantity,
        price: displayPrice,
        variantId: item.selectedVariantId,
      };
    });

    const orderPayload: OrderPayload = {
      clientInfo: { name: data.name, phone: data.phone, address: data.address },
      cartItems: cartItemsForApi,
    };
    checkoutMutation.mutate(orderPayload);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading"><ShoppingCart /> Your Order</DialogTitle>
          <DialogDescription>Review your items and enter your details to complete the purchase.</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-4 px-1 space-y-6">
              
              {cartItems.length > 0 ? (
                <div className="space-y-4">
                  {cartItems.map((item) => {
                    const variant = item.selectedVariantId 
                      ? item.variants?.find(v => v.id === item.selectedVariantId)
                      : undefined;
                    const variantName = variant 
                      ? `${variant.size ? `Size: ${variant.size}` : ''}${variant.color ? `${variant.size ? ', ' : ''}Color: ${variant.color}` : ''}`
                      : '';
                    const displayPrice = variant?.price ?? item.price;
                    const displayImage = variant?.imageUrl || 
                      item.images?.find(img => img.isPrimary)?.url ||
                      item.images?.[0]?.url ||
                      item.imageUrl;
                    
                    return (
                      <div key={`${item.id}-${item.selectedVariantId || 'default'}`} className="flex items-center gap-4">
                        <img src={displayImage ?? '/placeholder.svg'} alt={item.name} className="w-16 h-16 rounded-md object-cover" />
                        <div className="flex-grow">
                          <p className="font-semibold font-heading">{item.name}</p>
                          {variantName && (
                            <p className="text-xs text-muted-foreground">{variantName}</p>
                          )}
                          <p className="text-sm text-muted-foreground">${displayPrice.toFixed(2)}</p>
                        </div>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value), item.selectedVariantId)}
                          className="w-16 h-8 text-center"
                          min="1"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id, item.selectedVariantId)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Your cart is empty.</p>
              )}

              {cartItems.length > 0 && (
                <div className="space-y-6 border-t pt-6">
                  <h3 className="text-lg font-semibold font-heading">Shipping Details</h3>
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl><Input placeholder="+216 XX XXX XXX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                   <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl><Input placeholder="123 Main St, Tunis" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}
            </div>

            <DialogFooter className="sm:justify-between items-center pt-4 mt-4 border-t">
              <div className="text-lg font-bold font-heading">Total: ${cartTotal.toFixed(2)}</div>
              <Button type="submit" disabled={cartItems.length === 0 || checkoutMutation.isPending}>
                {checkoutMutation.isPending ? "Placing Order..." : "Place Order"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};