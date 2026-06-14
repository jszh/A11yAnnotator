import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/ecommerce/Layout";
import { products } from "@/data/products";
import { Minus, Plus, X, Gift, Truck, Award } from "lucide-react";

const initialCart = [
  { product: products[0], size: "M", color: products[0].color, quantity: 1 },
  { product: products[2], size: "L", color: products[2].color, quantity: 1 },
  { product: products[4], size: "One Size", color: products[4].color, quantity: 2 },
];

const CartPage = () => {
  const [cart, setCart] = useState(initialCart);
  const [giftWrap, setGiftWrap] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const giftWrapCost = giftWrap ? 5 : 0;
  const shipping = subtotal > 150 ? 0 : 12;
  const total = subtotal + giftWrapCost + shipping;

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="section-heading mb-8">Your Bag</h1>

        {cart.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg mb-4">Your bag is empty</p>
            <Link to="/products" className="btn-primary inline-block">Continue Shopping</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Items */}
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item, index) => (
                <div key={index} className="flex gap-4 pb-6 border-b border-border">
                  <Link to={`/product/${item.product.id}`} className="w-24 h-32 rounded-sm overflow-hidden shrink-0 bg-muted">
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between">
                      <div>
                        <Link to={`/product/${item.product.id}`} className="text-sm font-medium text-foreground hover:underline">{item.product.name}</Link>
                        <p className="text-xs text-muted-foreground mt-1">Size: {item.size} · Color: {item.color}</p>
                      </div>
                      <button onClick={() => removeItem(index)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center border border-border rounded-sm">
                        <button onClick={() => updateQuantity(index, -1)} className="p-2"><Minus size={12} /></button>
                        <span className="px-3 text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(index, 1)} className="p-2"><Plus size={12} /></button>
                      </div>
                      <span className="text-sm font-semibold">${item.product.price * item.quantity}.00</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-sm p-6 h-fit space-y-6">
              <h2 className="font-display text-xl font-semibold">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${subtotal}.00</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping}.00`}</span></div>
                {giftWrap && <div className="flex justify-between"><span className="text-muted-foreground">Gift Wrapping</span><span>$5.00</span></div>}
                <div className="flex justify-between font-semibold text-base pt-3 border-t border-border">
                  <span>Total</span><span>${total}.00</span>
                </div>
              </div>

              {/* Gift wrap */}
              <button
                onClick={() => setGiftWrap(!giftWrap)}
                className={`flex items-center gap-3 w-full p-3 rounded-sm border text-sm transition-colors ${giftWrap ? "border-primary bg-sage-light/30" : "border-border hover:border-foreground"}`}
              >
                <Gift size={16} className={giftWrap ? "text-primary" : "text-muted-foreground"} />
                <div className="text-left">
                  <span className="font-medium">Add Gift Wrapping</span>
                  <span className="text-muted-foreground ml-1">(+$5.00)</span>
                </div>
              </button>

              {/* Delivery estimate */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Truck size={16} />
                <span>Estimated delivery: April 2–5, 2026</span>
              </div>

              {/* Loyalty */}
              <div className="bg-background p-4 rounded-sm border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={16} className="text-accent" />
                  <span className="text-sm font-medium">Loyalty Points</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">You're 120 points away from a free tote!</p>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: "68%" }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>380 pts</span>
                  <span>500 pts</span>
                </div>
              </div>

              <button className="btn-primary w-full">Proceed to Checkout</button>
              <Link to="/products" className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CartPage;
