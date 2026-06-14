import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Minus, Plus, X, Gift, Truck, Award } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, toggleGiftWrap, subtotal, giftWrapTotal, total, loyaltyPoints } = useCart();

  const pointsToFreeTote = Math.max(0, 500 - loyaltyPoints);
  const estimatedDelivery = new Date(Date.now() + 5 * 86400000).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <main id="main-content" className="container py-8">
      <h1 className="font-display text-3xl font-bold mb-8">Your Cart</h1>

      {items.length === 0 ? (
        <section className="text-center py-20">
          <p className="text-muted-foreground text-lg mb-4">Your cart is empty</p>
          <Link
            to="/shop"
            className="inline-flex px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
          >
            Start Shopping
          </Link>
        </section>
      ) : (
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Cart Items */}
          <section className="lg:col-span-2 space-y-6" aria-label="Cart items">
            {items.map(item => (
              <article key={item.product.id} className="flex gap-4 border-b border-border pb-6">
                <Link to={`/product/${item.product.id}`} className="flex-shrink-0 w-24 h-32 rounded-md overflow-hidden bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <img src={item.product.image} alt={item.product.name} loading="lazy" width={96} height={128} className="h-full w-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-body text-sm font-semibold">
                        <Link to={`/product/${item.product.id}`} className="hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                          {item.product.name}
                        </Link>
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.selectedColor} · Size {item.selectedSize}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-1 hover:bg-muted rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="p-1 border border-input rounded-md hover:bg-muted disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Decrease quantity of ${item.product.name}`}
                      >
                        <Minus className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <span className="text-sm font-medium w-8 text-center" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 border border-input rounded-md hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Increase quantity of ${item.product.name}`}
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                    <span className="font-semibold text-sm">${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>

                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.giftWrap}
                      onChange={() => toggleGiftWrap(item.product.id)}
                      className="accent-primary rounded focus:ring-2 focus:ring-ring"
                    />
                    <Gift className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    <span className="text-xs text-muted-foreground">Gift wrap (+$5.00)</span>
                  </label>
                </div>
              </article>
            ))}
          </section>

          {/* Order Summary */}
          <aside aria-label="Order summary" className="space-y-6">
            <div className="bg-secondary rounded-lg p-6">
              <h2 className="font-display text-lg font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                {giftWrapTotal > 0 && <div className="flex justify-between"><span>Gift wrapping</span><span>${giftWrapTotal.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span>Shipping</span><span className="text-primary font-medium">{subtotal >= 100 ? "Free" : "$8.00"}</span></div>
                <div className="border-t border-border pt-3 flex justify-between font-bold text-base">
                  <span>Total</span><span>${(total + (subtotal < 100 ? 8 : 0)).toFixed(2)}</span>
                </div>
              </div>

              <button
                className="mt-6 w-full py-4 bg-accent text-accent-foreground font-semibold rounded-md hover:bg-accent/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-sm"
              >
                Proceed to Checkout
              </button>

              {subtotal < 100 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Add ${(100 - subtotal).toFixed(2)} more for free shipping
                </p>
              )}
            </div>

            {/* Delivery */}
            <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
              <Truck className="h-5 w-5 text-primary flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">Estimated Delivery</p>
                <p className="text-xs text-muted-foreground">{estimatedDelivery}</p>
              </div>
            </div>

            {/* Loyalty Points */}
            <div className="p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-loyalty" aria-hidden="true" />
                <p className="text-sm font-medium">Loyalty Points</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                You'll earn <strong className="text-foreground">{loyaltyPoints} points</strong> with this order.
                {pointsToFreeTote > 0
                  ? ` You're ${pointsToFreeTote} points away from a free tote!`
                  : " You've earned a free tote! 🎉"}
              </p>
              <div className="h-2 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={loyaltyPoints} aria-valuemin={0} aria-valuemax={500} aria-label="Loyalty points progress">
                <div className="h-full bg-loyalty rounded-full transition-all" style={{ width: `${Math.min(100, (loyaltyPoints / 500) * 100)}%` }} />
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
