import { useState } from "react";
import Layout from "@/components/ecommerce/Layout";
import { products } from "@/data/products";
import { Package, Heart, Award, Users, User, Copy, Check } from "lucide-react";

const sections = [
  { id: "orders", label: "My Orders", icon: Package },
  { id: "style", label: "Style Profile", icon: Heart },
  { id: "rewards", label: "Loyalty Rewards", icon: Award },
  { id: "outfits", label: "Saved Outfits", icon: User },
  { id: "referral", label: "Referral Program", icon: Users },
];

const orders = [
  { id: "TH-2026-1847", date: "Mar 15, 2026", status: "Delivered", total: 167, items: 2 },
  { id: "TH-2026-1632", date: "Feb 28, 2026", status: "Shipped", total: 89, items: 1 },
  { id: "TH-2026-1205", date: "Jan 10, 2026", status: "Delivered", total: 243, items: 3 },
];

const AccountPage = () => {
  const [activeSection, setActiveSection] = useState("orders");
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText("https://threadhouse.co/ref/ALEX2026");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="section-heading">My Account</h1>
          <p className="text-muted-foreground mt-1">Welcome back, Alex</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <nav className="flex md:flex-col gap-1 overflow-x-auto">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-sm text-sm whitespace-nowrap transition-colors ${activeSection === s.id ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                >
                  <s.icon size={16} />
                  {s.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="md:col-span-3">
            {activeSection === "orders" && (
              <div>
                <h2 className="font-display text-2xl font-semibold mb-6">My Orders</h2>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-border rounded-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{order.id}</p>
                        <p className="text-xs text-muted-foreground">{order.date} · {order.items} items</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className={`text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full ${order.status === "Delivered" ? "bg-sage-light text-primary" : "bg-accent/10 text-accent"}`}>
                          {order.status}
                        </span>
                        <span className="text-sm font-semibold">${order.total}.00</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "style" && (
              <div>
                <h2 className="font-display text-2xl font-semibold mb-6">Style Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Preferred Fit", value: "Relaxed / Oversized" },
                    { label: "Favorite Colors", value: "Sage, Terracotta, Off-White" },
                    { label: "Size", value: "M (Tops) / L (Bottoms)" },
                    { label: "Materials", value: "Organic Cotton, Linen" },
                    { label: "Style", value: "Minimalist + Workwear" },
                    { label: "Avoid", value: "Synthetic fabrics, Bright neons" },
                  ].map((pref) => (
                    <div key={pref.label} className="border border-border rounded-sm p-4">
                      <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">{pref.label}</p>
                      <p className="text-sm font-medium">{pref.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "rewards" && (
              <div>
                <h2 className="font-display text-2xl font-semibold mb-6">Loyalty Rewards</h2>
                <div className="bg-muted/50 rounded-sm p-8 text-center mb-8">
                  <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">Your Balance</p>
                  <p className="font-display text-5xl font-semibold text-foreground">380</p>
                  <p className="text-sm text-muted-foreground mt-1">points</p>
                  <div className="max-w-xs mx-auto mt-6">
                    <div className="w-full h-3 bg-background rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: "76%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">120 more points to unlock a free tote bag!</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { action: "Purchase: Oversized Linen Shirt", points: "+89", date: "Mar 15" },
                    { action: "Referral bonus", points: "+50", date: "Mar 8" },
                    { action: "Purchase: Essential Organic Tee", points: "+45", date: "Feb 28" },
                    { action: "Review submitted", points: "+10", date: "Feb 20" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border">
                      <div>
                        <p className="font-medium">{item.action}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                      <span className="text-primary font-semibold">{item.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "outfits" && (
              <div>
                <h2 className="font-display text-2xl font-semibold mb-6">Saved Outfits</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {["Weekend Brunch", "Office Ready", "Saturday Errands"].map((name) => (
                    <div key={name} className="border border-border rounded-sm p-5">
                      <h3 className="text-sm font-semibold mb-3">{name}</h3>
                      <div className="flex gap-2">
                        {[0,1,2].map((i) => (
                          <div key={i} className="w-16 h-20 rounded-sm bg-muted overflow-hidden">
                            <img src={products[i].image} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">3 pieces · Saved Feb 2026</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "referral" && (
              <div>
                <h2 className="font-display text-2xl font-semibold mb-6">Referral Program</h2>
                <div className="bg-muted/50 rounded-sm p-8 text-center">
                  <Users className="mx-auto mb-4 text-primary" size={32} />
                  <h3 className="font-display text-xl font-semibold mb-2">Share the Love</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Give your friends $15 off their first order and earn 50 loyalty points for each successful referral.
                  </p>
                  <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="flex-1 px-4 py-3 bg-background rounded-sm text-sm font-mono text-muted-foreground border border-border truncate">
                      threadhouse.co/ref/ALEX2026
                    </div>
                    <button onClick={copyLink} className="btn-primary flex items-center gap-2 py-3">
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="mt-8 grid grid-cols-3 gap-4 max-w-sm mx-auto">
                    <div className="text-center">
                      <p className="font-display text-2xl font-semibold">7</p>
                      <p className="text-xs text-muted-foreground">Referrals</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-2xl font-semibold">350</p>
                      <p className="text-xs text-muted-foreground">Points Earned</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-2xl font-semibold">$105</p>
                      <p className="text-xs text-muted-foreground">Friends Saved</p>
                    </div>
                  </div>
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
