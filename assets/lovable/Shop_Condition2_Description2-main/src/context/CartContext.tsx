import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import type { Product, CartItem } from "@/data/products";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size: string, color: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  toggleGiftWrap: (productId: string) => void;
  totalItems: number;
  subtotal: number;
  giftWrapTotal: number;
  total: number;
  loyaltyPoints: number;
  announcement: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const announce = useCallback((msg: string) => {
    setAnnouncement(msg);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAnnouncement(""), 3000);
  }, []);

  const addItem = useCallback((product: Product, selectedSize: string, selectedColor: string) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        announce(`Updated ${product.name} quantity in cart`);
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      announce(`Added ${product.name} to cart`);
      return [...prev, { product, quantity: 1, selectedSize, selectedColor, giftWrap: false }];
    });
  }, [announce]);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => {
      const item = prev.find(i => i.product.id === productId);
      if (item) announce(`Removed ${item.product.name} from cart`);
      return prev.filter(i => i.product.id !== productId);
    });
  }, [announce]);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  }, []);

  const toggleGiftWrap = useCallback((productId: string) => {
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, giftWrap: !i.giftWrap } : i));
  }, []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const giftWrapTotal = items.filter(i => i.giftWrap).length * 5;
  const total = subtotal + giftWrapTotal;
  const loyaltyPoints = Math.floor(total * 2);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, toggleGiftWrap, totalItems, subtotal, giftWrapTotal, total, loyaltyPoints, announcement }}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
