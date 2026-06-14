import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useCart } from "../context/CartContext";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const shipping = subtotal > 50 ? 0 : 5.99;
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const total = subtotal - discount + shipping;

  const handlePromo = () => {
    if (promoCode.toUpperCase() === "SAVE10") {
      setPromoApplied(true);
      setPromoError("");
    } else {
      setPromoError("Invalid promo code. Try SAVE10.");
      setPromoApplied(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout title="Cart">
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
          <Link to="/products" className="inline-block px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90">
            Start Shopping
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Shopping Cart">
      <div className="container py-8">
        <h1 className="text-2xl font-display font-bold mb-6">Shopping Cart ({items.length} {items.length === 1 ? "item" : "items"})</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <article
                key={item.product.id}
                className="flex gap-4 p-4 bg-card rounded-lg border border-border shadow-card"
                aria-label={`${item.product.name} in cart`}
              >
                <Link to={`/product/${item.product.id}`} className="shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-24 h-24 rounded-md object-cover bg-secondary"
                    loading="lazy"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">{item.product.brand}</p>
                      <h2 className="text-sm font-semibold">
                        <Link to={`/product/${item.product.id}`} className="hover:text-primary">{item.product.name}</Link>
                      </h2>
                      {item.selectedColor && <p className="text-xs text-muted-foreground mt-1">Color: {item.selectedColor}</p>}
                      {item.selectedSize && <p className="text-xs text-muted-foreground">Size: {item.selectedSize}</p>}
                    </div>
                    <p className="text-sm font-bold font-display whitespace-nowrap">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-input rounded-md">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="p-1.5 hover:bg-secondary rounded-l-md disabled:opacity-30"
                        aria-label={`Decrease quantity of ${item.product.name}`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1.5 hover:bg-secondary rounded-r-md"
                        aria-label={`Increase quantity of ${item.product.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Order summary */}
          <aside aria-label="Order summary" className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border shadow-card p-6 sticky top-28">
              <h2 className="text-lg font-display font-bold mb-4">Order Summary</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="font-medium">${subtotal.toFixed(2)}</dd>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-nova-success">
                    <dt>Promo (SAVE10)</dt>
                    <dd className="font-medium">-${discount.toFixed(2)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd className="font-medium">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</dd>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-base">
                  <dt className="font-bold">Total</dt>
                  <dd className="font-bold font-display">${total.toFixed(2)}</dd>
                </div>
              </dl>

              {/* Promo code */}
              <div className="mt-4">
                <label htmlFor="promo-code" className="text-sm font-medium">Promo Code</label>
                <div className="flex gap-2 mt-1">
                  <input
                    id="promo-code"
                    type="text"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-describedby={promoError ? "promo-error" : undefined}
                    aria-required="false"
                  />
                  <button
                    onClick={handlePromo}
                    className="px-4 py-2 text-sm font-semibold border border-foreground rounded-md hover:bg-secondary transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p id="promo-error" className="text-xs text-destructive mt-1" role="alert">{promoError}</p>
                )}
                {promoApplied && (
                  <p className="text-xs text-nova-success mt-1" role="status">Promo code applied! 10% off</p>
                )}
              </div>

              <button className="w-full mt-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                Proceed to Checkout
              </button>
              <Link to="/products" className="block text-center text-sm text-primary mt-3 hover:underline">
                Continue Shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
