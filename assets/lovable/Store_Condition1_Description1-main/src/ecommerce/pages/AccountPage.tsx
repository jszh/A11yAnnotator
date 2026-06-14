import { useState } from "react";
import { Package, MapPin, CreditCard, Heart, Settings, LogOut } from "lucide-react";
import Layout from "../components/Layout";
import { Button } from "@/components/ui/button";

const tabs = [
  { id: "orders", label: "Order History", icon: Package },
  { id: "addresses", label: "Saved Addresses", icon: MapPin },
  { id: "payment", label: "Payment Methods", icon: CreditCard },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "settings", label: "Account Settings", icon: Settings },
];

const mockOrders = [
  { id: "NM-78421", date: "Mar 8, 2026", total: 459.98, status: "Delivered", items: 2 },
  { id: "NM-77230", date: "Feb 21, 2026", total: 129.99, status: "Shipped", items: 1 },
  { id: "NM-75109", date: "Jan 14, 2026", total: 89.97, status: "Delivered", items: 3 },
];

const AccountPage = () => {
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-display text-foreground">My Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, Alex</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4 space-y-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm transition-colors ${activeTab === id ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
              <hr className="border-border my-2" />
              <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === "orders" && (
              <div>
                <h2 className="text-lg font-bold font-display text-foreground mb-4">Order History</h2>
                <div className="space-y-3">
                  {mockOrders.map((order) => (
                    <div key={order.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">{order.id}</p>
                        <p className="text-xs text-muted-foreground">{order.date} · {order.items} item{order.items > 1 ? "s" : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-display text-foreground">${order.total.toFixed(2)}</p>
                        <span className={`text-xs font-medium ${order.status === "Delivered" ? "text-success" : "text-accent"}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "addresses" && (
              <div>
                <h2 className="text-lg font-bold font-display text-foreground mb-4">Saved Addresses</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-card border-2 border-accent rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold bg-accent text-accent-foreground px-2 py-0.5 rounded">Default</span>
                      <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
                    </div>
                    <p className="font-medium text-sm text-foreground">Alex Johnson</p>
                    <p className="text-sm text-muted-foreground">123 Main Street, Apt 4B<br />New York, NY 10001</p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-muted-foreground">Work</span>
                      <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
                    </div>
                    <p className="font-medium text-sm text-foreground">Alex Johnson</p>
                    <p className="text-sm text-muted-foreground">456 Business Ave, Floor 12<br />New York, NY 10018</p>
                  </div>
                </div>
                <Button variant="outline" className="mt-4">+ Add New Address</Button>
              </div>
            )}

            {activeTab === "payment" && (
              <div>
                <h2 className="text-lg font-bold font-display text-foreground mb-4">Payment Methods</h2>
                <div className="space-y-3">
                  <div className="bg-card border-2 border-accent rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-7 bg-primary rounded flex items-center justify-center text-primary-foreground text-[10px] font-bold">VISA</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">•••• •••• •••• 4242</p>
                        <p className="text-xs text-muted-foreground">Expires 09/27</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-accent">Default</span>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-7 bg-foreground rounded flex items-center justify-center text-background text-[10px] font-bold">MC</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">•••• •••• •••• 8821</p>
                        <p className="text-xs text-muted-foreground">Expires 03/28</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs">Remove</Button>
                  </div>
                </div>
                <Button variant="outline" className="mt-4">+ Add Payment Method</Button>
              </div>
            )}

            {activeTab === "wishlist" && (
              <div>
                <h2 className="text-lg font-bold font-display text-foreground mb-4">Wishlist</h2>
                <div className="space-y-3">
                  {[
                    { name: "Sony WF-1000XM5 Earbuds", price: "$229.99", status: "Out of Stock" },
                    { name: "Dyson Airwrap Complete Styler", price: "$499.99", status: "In Stock" },
                    { name: "Apple iPad 10th Generation", price: "$349.99", status: "In Stock" },
                  ].map((item, i) => (
                    <div key={i} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${item.status === "In Stock" ? "text-success" : "text-destructive"}`}>
                          {item.status}
                        </span>
                        <Button variant="accent" size="sm" className="text-xs" disabled={item.status !== "In Stock"}>
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                <h2 className="text-lg font-bold font-display text-foreground mb-4">Account Settings</h2>
                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">First Name</label>
                      <input defaultValue="Alex" className="w-full h-10 px-3 rounded-md border border-border bg-secondary/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Last Name</label>
                      <input defaultValue="Johnson" className="w-full h-10 px-3 rounded-md border border-border bg-secondary/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
                    <input defaultValue="alex.johnson@email.com" className="w-full h-10 px-3 rounded-md border border-border bg-secondary/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Phone</label>
                    <input defaultValue="+1 (555) 123-4567" className="w-full h-10 px-3 rounded-md border border-border bg-secondary/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                  <Button variant="accent">Save Changes</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AccountPage;
