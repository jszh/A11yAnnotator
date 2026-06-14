import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/ecommerce/Layout";
import { products } from "@/data/products";
import { Minus, Plus, X, Gift, Truck, ArrowRight } from "lucide-react";

interface CartItem {
  product: typeof products[0];
  size: string;
  qty: number;
}

const initialCart: CartItem[] = [
  { product: products[0], size: "M", qty: 1 },
  { product: products[2], size: "S", qty: 1 },
  { product: products[3], size: "One Size", qty: 2 },
];

export default function CartPage() {
  const [items, setItems] = useState(initialCart);
  const [giftWrap, setGiftWrap] = useState(false);

  const updateQty = (i: number, delta: number) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
    );
  };

  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const giftCost = giftWrap ? 5 : 0;
  const total = subtotal + giftCost;
  const loyaltyPoints = Math.floor(total * 2);
  const pointsToFreeTote = Math.max(0, 500 - loyaltyPoints);

  return (
    <Layout>
      <div className="container py-10 max-w-4xl">
        <h1 className="font-display text-3xl md:text-4xl font-semibold mb-8">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">Your cart is empty.</p>
            <Link to="/products" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-medium">
              Continue Shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-10">
            {/* Items */}
            <div className="md:col-span-2 space-y-6" role="list" aria-label="Cart items">
              {items.map((item, i) => (
                <div key={i} className="flex gap-4 pb-6 border-b border-border last:border-0" role="listitem">
                  <Link to={`/product/${item.product.id}`} className="w-24 h-32 rounded-md overflow-hidden bg-secondary shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      loading="lazy"
                      width={96}
                      height={128}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium text-sm">{item.product.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.product.color} · Size {item.size}
                        </p>
                      </div>
                      <button onClick={() => removeItem(i)} className="p-1 text-muted-foreground hover:text-foreground" aria-label={`Remove ${item.product.name}`}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="inline-flex items-center border border-border rounded-md">
                        <button onClick={() => updateQty(i, -1)} className="p-1.5" aria-label="Decrease quantity">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 text-sm" aria-live="polite">{item.qty}</span>
                        <button onClick={() => updateQty(i, 1)} className="p-1.5" aria-label="Increase quantity">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="font-semibold text-sm">${(item.product.price * item.qty).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <aside className="space-y-6" aria-label="Order summary">
              <div className="bg-secondary rounded-lg p-6 space-y-4">
                <h2 className="font-display text-lg font-semibold">Order Summary</h2>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-accent font-medium">Free</span>
                </div>

                {/* Gift wrapping */}
                <label className="flex items-center justify-between text-sm cursor-pointer border-t border-border pt-4">
                  <span className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-terracotta" />
                    Gift wrapping (+$5)
                  </span>
                  <input
                    type="checkbox"
                    checked={giftWrap}
                    onChange={(e) => setGiftWrap(e.target.checked)}
                    className="accent-accent h-4 w-4"
                  />
                </label>

                <div className="flex justify-between font-semibold text-base border-t border-border pt-4">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-md font-medium text-sm hover:opacity-90 transition-opacity">
                  Checkout
                </button>
              </div>

              {/* Delivery estimate */}
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Truck className="h-5 w-5 mt-0.5 shrink-0 text-accent" />
                <div>
                  <p className="text-foreground font-medium">Estimated Delivery</p>
                  <p>March 31 – April 3, 2026</p>
                </div>
              </div>

              {/* Loyalty */}
              <div className="bg-sage-light rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Loyalty Points</p>
                <div className="w-full bg-border rounded-full h-2 mb-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: `${Math.min(100, (loyaltyPoints / 500) * 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  You'll earn <strong className="text-foreground">{loyaltyPoints} points</strong> with this order.
                  {pointsToFreeTote > 0 && ` You're ${pointsToFreeTote} points away from a free tote!`}
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </Layout>
  );
}
