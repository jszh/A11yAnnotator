import { useState } from "react";
import Layout from "@/components/ecommerce/Layout";
import { Package, Heart, Award, Users, Copy, Check, Star } from "lucide-react";

const orderTabs = ["My Orders", "Style Profile", "Loyalty Rewards", "Saved Outfits", "Referral Program"];

const mockOrders = [
  { id: "TH-20260312", date: "March 12, 2026", status: "Delivered", total: 134, items: 2 },
  { id: "TH-20260228", date: "Feb 28, 2026", status: "In Transit", total: 89, items: 1 },
  { id: "TH-20260115", date: "Jan 15, 2026", status: "Delivered", total: 210, items: 3 },
];

const stylePrefs = [
  { label: "Preferred Fit", value: "Relaxed / Oversized" },
  { label: "Favorite Colors", value: "Earth tones, Sage, Off-white" },
  { label: "Size", value: "M (Tops) / 30 (Bottoms)" },
  { label: "Style", value: "Minimalist, Workwear" },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("My Orders");
  const [copied, setCopied] = useState(false);

  const referralLink = "threadhouse.co/ref/SARAH2026";

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${referralLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="container py-10 max-w-4xl">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xl font-display font-semibold" aria-hidden="true">
            SM
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Sarah Mitchell</h1>
            <p className="text-sm text-muted-foreground">Member since January 2025 · 380 loyalty points</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8" role="tablist" aria-label="Account sections">
          {orderTabs.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-border"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div role="tabpanel">
          {activeTab === "My Orders" && (
            <div className="space-y-4" role="list" aria-label="Order history">
              {mockOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-5 bg-secondary rounded-lg" role="listitem">
                  <div className="flex items-center gap-4">
                    <Package className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-sm">{order.id}</p>
                      <p className="text-xs text-muted-foreground">{order.date} · {order.items} item{order.items > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">${order.total.toFixed(2)}</p>
                    <p className={`text-xs font-medium ${order.status === "Delivered" ? "text-accent" : "text-terracotta"}`}>
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Style Profile" && (
            <div className="grid sm:grid-cols-2 gap-4">
              {stylePrefs.map((pref) => (
                <div key={pref.label} className="p-5 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{pref.label}</p>
                  <p className="font-medium text-sm">{pref.value}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Loyalty Rewards" && (
            <div className="space-y-6">
              <div className="bg-sage-light rounded-lg p-8 text-center">
                <Award className="h-10 w-10 mx-auto mb-4 text-accent" aria-hidden="true" />
                <p className="font-display text-3xl font-semibold">380 Points</p>
                <p className="text-sm text-muted-foreground mt-2">You're 120 points away from a free tote bag!</p>
                <div className="w-full max-w-xs mx-auto bg-border rounded-full h-3 mt-4">
                  <div className="bg-accent h-3 rounded-full" style={{ width: "76%" }} />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { points: 200, reward: "Free Shipping" },
                  { points: 500, reward: "Free Tote Bag" },
                  { points: 1000, reward: "$25 Store Credit" },
                ].map((tier) => (
                  <div key={tier.points} className={`p-5 rounded-lg border text-center ${380 >= tier.points ? "bg-accent/10 border-accent" : "bg-secondary border-transparent"}`}>
                    <p className="font-semibold text-lg">{tier.points}</p>
                    <p className="text-sm text-muted-foreground">{tier.reward}</p>
                    {380 >= tier.points && <p className="text-xs text-accent font-medium mt-2">✓ Unlocked</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Saved Outfits" && (
            <div className="grid sm:grid-cols-2 gap-4">
              {["Spring Capsule", "Office Essentials", "Weekend Vibes"].map((outfit) => (
                <div key={outfit} className="p-5 bg-secondary rounded-lg flex items-center gap-4">
                  <Heart className="h-5 w-5 text-terracotta shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-sm">{outfit}</p>
                    <p className="text-xs text-muted-foreground">4 items · Created March 2026</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Referral Program" && (
            <div className="bg-sage-light rounded-lg p-8 text-center max-w-md mx-auto">
              <Users className="h-10 w-10 mx-auto mb-4 text-accent" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold mb-2">Share the Love</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Give your friends $15 off their first order and earn 100 loyalty points for each referral.
              </p>
              <div className="flex items-center gap-2 bg-background rounded-md p-3 border border-border">
                <span className="text-sm flex-1 text-left truncate">{referralLink}</span>
                <button
                  onClick={copyLink}
                  className="shrink-0 p-2 hover:bg-secondary rounded-md transition-colors"
                  aria-label="Copy referral link"
                >
                  {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              {copied && <p className="text-xs text-accent mt-2" role="status">Link copied!</p>}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
