import { useState } from "react";
import Layout from "../components/Layout";
import { orders, addresses } from "../data/products";
import { Package, MapPin, CreditCard, Heart, Settings, ChevronRight } from "lucide-react";

type Section = "orders" | "addresses" | "payment" | "wishlist" | "settings";

const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "orders", label: "Order History", icon: <Package className="w-4 h-4" /> },
  { id: "addresses", label: "Saved Addresses", icon: <MapPin className="w-4 h-4" /> },
  { id: "payment", label: "Payment Methods", icon: <CreditCard className="w-4 h-4" /> },
  { id: "wishlist", label: "Wishlist", icon: <Heart className="w-4 h-4" /> },
  { id: "settings", label: "Account Settings", icon: <Settings className="w-4 h-4" /> },
];

const statusColors: Record<string, string> = {
  delivered: "bg-nova-success text-nova-success-foreground",
  shipped: "bg-nova-info text-primary-foreground",
  processing: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

export default function AccountPage() {
  const [activeSection, setActiveSection] = useState<Section>("orders");

  return (
    <Layout title="My Account">
      <div className="container py-8">
        <h1 className="text-2xl font-display font-bold mb-6">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar navigation */}
          <nav aria-label="Account sections" className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border shadow-card p-2">
              {/* User info */}
              <div className="p-4 border-b border-border mb-2">
                <p className="font-semibold text-sm">Alex Johnson</p>
                <p className="text-xs text-muted-foreground">alex.johnson@email.com</p>
              </div>
              <ul role="list" className="space-y-0.5">
                {navItems.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-md transition-colors ${
                        activeSection === item.id ? "bg-accent font-semibold" : "hover:bg-secondary"
                      }`}
                      aria-current={activeSection === item.id ? "page" : undefined}
                    >
                      {item.icon}
                      {item.label}
                      <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Content */}
          <section className="lg:col-span-3" aria-label={navItems.find(n => n.id === activeSection)?.label}>
            {activeSection === "orders" && (
              <div>
                <h2 className="text-xl font-display font-bold mb-4">Order History</h2>
                <div className="space-y-4">
                  {orders.map(order => (
                    <article key={order.id} className="bg-card rounded-lg border border-border shadow-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div>
                          <p className="text-sm font-semibold">Order #{order.id}</p>
                          <p className="text-xs text-muted-foreground">Placed on {order.date}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                          <span className="text-sm font-bold font-display">${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                      <ul className="divide-y divide-border">
                        {order.items.map((item, i) => (
                          <li key={i} className="flex justify-between py-2 text-sm">
                            <span>{item.name} × {item.quantity}</span>
                            <span className="text-muted-foreground">${item.price.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "addresses" && (
              <div>
                <h2 className="text-xl font-display font-bold mb-4">Saved Addresses</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <article key={addr.id} className={`bg-card rounded-lg border shadow-card p-4 ${addr.isDefault ? "border-primary" : "border-border"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold">{addr.label}</h3>
                        {addr.isDefault && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-accent text-accent-foreground rounded-full">Default</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{addr.name}</p>
                      <p className="text-sm text-muted-foreground">{addr.street}</p>
                      <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.zip}</p>
                      <div className="flex gap-3 mt-3">
                        <button className="text-xs font-semibold text-primary hover:underline">Edit</button>
                        <button className="text-xs font-semibold text-destructive hover:underline">Delete</button>
                      </div>
                    </article>
                  ))}
                  <button className="flex items-center justify-center h-full min-h-[160px] border-2 border-dashed border-border rounded-lg text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    + Add New Address
                  </button>
                </div>
              </div>
            )}

            {activeSection === "payment" && (
              <div>
                <h2 className="text-xl font-display font-bold mb-4">Payment Methods</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <article className="bg-card rounded-lg border border-primary shadow-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-5 h-5" />
                      <h3 className="text-sm font-semibold">Visa ending in 4242</h3>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-accent text-accent-foreground rounded-full">Default</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Expires 08/2027</p>
                    <div className="flex gap-3 mt-3">
                      <button className="text-xs font-semibold text-primary hover:underline">Edit</button>
                      <button className="text-xs font-semibold text-destructive hover:underline">Remove</button>
                    </div>
                  </article>
                  <button className="flex items-center justify-center h-full min-h-[120px] border-2 border-dashed border-border rounded-lg text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    + Add Payment Method
                  </button>
                </div>
              </div>
            )}

            {activeSection === "wishlist" && (
              <div>
                <h2 className="text-xl font-display font-bold mb-4">Wishlist</h2>
                <p className="text-muted-foreground text-sm">Your wishlist is empty. Browse products and save items you love!</p>
              </div>
            )}

            {activeSection === "settings" && (
              <div>
                <h2 className="text-xl font-display font-bold mb-4">Account Settings</h2>
                <div className="bg-card rounded-lg border border-border shadow-card p-6 max-w-lg space-y-4">
                  <div>
                    <label htmlFor="settings-name" className="text-sm font-medium">Full Name</label>
                    <input id="settings-name" type="text" defaultValue="Alex Johnson" className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label htmlFor="settings-email" className="text-sm font-medium">Email</label>
                    <input id="settings-email" type="email" defaultValue="alex.johnson@email.com" className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label htmlFor="settings-phone" className="text-sm font-medium">Phone</label>
                    <input id="settings-phone" type="tel" defaultValue="(555) 123-4567" className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <button className="px-6 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
