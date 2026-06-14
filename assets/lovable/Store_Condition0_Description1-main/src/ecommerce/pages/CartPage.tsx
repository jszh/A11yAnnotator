import { Link } from "react-router-dom";
import { Minus, Plus, X, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { useState } from "react";
import Layout from "../components/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "../context/CartContext";

const CartPage = () => {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const shipping = subtotal > 50 ? 0 : 5.99;
  const promoDiscount = promoApplied ? subtotal * 0.1 : 0;
  const total = subtotal - promoDiscount + shipping;

  const categoryEmoji: Record<string, string> = {
    electronics: "🎧",
    kitchen: "🍳",
    clothing: "👕",
    sports: "⚽",
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h1 className="text-2xl font-bold font-display text-foreground mb-2">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
          <Link to="/products">
            <Button variant="accent" size="lg" className="gap-2">
              Start Shopping <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold font-display text-foreground mb-8">
          Shopping Cart ({items.reduce((s, i) => s + i.quantity, 0)} items)
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-4 bg-card rounded-lg border border-border p-4"
              >
                <Link
                  to={`/product/${product.id}`}
                  className="w-20 h-20 bg-secondary rounded-md flex items-center justify-center text-3xl shrink-0"
                >
                  {categoryEmoji[product.category] || "📦"}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="text-sm font-medium text-foreground hover:text-accent transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-muted-foreground">{product.brand}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium text-foreground">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold font-display text-foreground">
                        ${(product.price * quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-32">
              <h2 className="font-display font-bold text-foreground mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-success" : "text-foreground"}>
                    {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-success">
                    <span>Promo (10% off)</span>
                    <span>-${promoDiscount.toFixed(2)}</span>
                  </div>
                )}

                {/* Promo code */}
                <div className="pt-3 border-t border-border">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (promoCode.trim()) setPromoApplied(true);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex justify-between font-bold text-base">
                  <span className="text-foreground">Total</span>
                  <span className="font-display text-foreground">${total.toFixed(2)}</span>
                </div>
              </div>

              <Button variant="accent" size="lg" className="w-full mt-6 gap-2">
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Button>

              <Link to="/products" className="block text-center text-sm text-accent mt-3 hover:underline">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
