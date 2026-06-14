import { Link } from "react-router-dom";
import { Package, Heart, Award, Users, UserCircle, ChevronRight, Copy } from "lucide-react";
import { useState } from "react";

const mockOrders = [
  { id: "TH-20260318", date: "Mar 18, 2026", status: "Delivered", total: 189, items: 2 },
  { id: "TH-20260301", date: "Mar 1, 2026", status: "Delivered", total: 95, items: 1 },
  { id: "TH-20260215", date: "Feb 15, 2026", status: "Delivered", total: 267, items: 3 },
];

const savedOutfits = [
  { name: "Sunday Brunch Look", items: ["Oversized Linen Shirt", "Wide-Leg Linen Pants", "Cork Leather Belt"] },
  { name: "City Walk Essentials", items: ["Recycled Denim Jacket", "Organic Cotton Tee", "Organic Twill Chinos"] },
];

export default function AccountPage() {
  const [activeSection, setActiveSection] = useState<"orders" | "style" | "rewards" | "outfits" | "referral">("orders");
  const [copied, setCopied] = useState(false);
  const referralLink = "https://threadhouse.co/ref/ALEX2026";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const sections = [
    { key: "orders" as const, label: "My Orders", icon: Package },
    { key: "style" as const, label: "Style Profile", icon: UserCircle },
    { key: "rewards" as const, label: "Loyalty Rewards", icon: Award },
    { key: "outfits" as const, label: "Saved Outfits", icon: Heart },
    { key: "referral" as const, label: "Referral Program", icon: Users },
  ];

  return (
    <main id="main-content" className="container py-8">
      <h1 className="font-display text-3xl font-bold mb-8">My Account</h1>

      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <nav aria-label="Account sections" className="space-y-1">
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeSection === key ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
              aria-current={activeSection === key ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <section className="md:col-span-3" aria-label={sections.find(s => s.key === activeSection)?.label}>
          {activeSection === "orders" && (
            <div>
              <h2 className="font-display text-xl font-bold mb-6">My Orders</h2>
              <div className="space-y-4">
                {mockOrders.map(order => (
                  <article key={order.id} className="border border-border rounded-lg p-5 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-body text-sm font-semibold">{order.id}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{order.date} · {order.items} item{order.items > 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-badge-new text-primary-foreground font-medium">{order.status}</span>
                      <span className="text-sm font-semibold">${order.total.toFixed(2)}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeSection === "style" && (
            <div>
              <h2 className="font-display text-xl font-bold mb-6">Style Profile</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { label: "Preferred Style", value: "Minimalist & Workwear" },
                  { label: "Top Sizes", value: "M / L" },
                  { label: "Bottom Sizes", value: "M (32)" },
                  { label: "Preferred Colors", value: "Earth tones, Neutrals" },
                  { label: "Favorite Materials", value: "Organic Linen, Organic Cotton" },
                  { label: "Fit Preference", value: "Relaxed / Oversized" },
                ].map(pref => (
                  <div key={pref.label} className="border border-border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{pref.label}</p>
                    <p className="text-sm font-medium mt-1">{pref.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "rewards" && (
            <div>
              <h2 className="font-display text-xl font-bold mb-6">Loyalty Rewards</h2>
              <div className="bg-secondary rounded-lg p-8 text-center mb-6">
                <Award className="h-10 w-10 text-loyalty mx-auto mb-3" aria-hidden="true" />
                <p className="text-3xl font-display font-bold">380</p>
                <p className="text-sm text-muted-foreground mt-1">Total Points</p>
                <div className="mt-4 h-3 bg-muted rounded-full overflow-hidden max-w-xs mx-auto" role="progressbar" aria-valuenow={380} aria-valuemin={0} aria-valuemax={500} aria-label="Points to next reward">
                  <div className="h-full bg-loyalty rounded-full" style={{ width: "76%" }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">120 points until your free ThreadHouse tote!</p>
              </div>
              <h3 className="font-body text-sm font-semibold mb-3">How to Earn Points</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Purchase: 2 points per $1 spent</li>
                <li>• Review: 25 points per product review</li>
                <li>• Referral: 100 points per friend who joins</li>
                <li>• Birthday: 50 bonus points on your birthday</li>
              </ul>
            </div>
          )}

          {activeSection === "outfits" && (
            <div>
              <h2 className="font-display text-xl font-bold mb-6">Saved Outfits</h2>
              <div className="space-y-4">
                {savedOutfits.map(outfit => (
                  <article key={outfit.name} className="border border-border rounded-lg p-5">
                    <h3 className="font-body text-sm font-semibold">{outfit.name}</h3>
                    <ul className="mt-2 space-y-1">
                      {outfit.items.map(item => (
                        <li key={item} className="text-xs text-muted-foreground flex items-center gap-1">
                          <ChevronRight className="h-3 w-3" aria-hidden="true" /> {item}
                        </li>
                      ))}
                    </ul>
                    <Link to="/shop" className="inline-block mt-3 text-xs text-primary font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                      Shop this look
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeSection === "referral" && (
            <div>
              <h2 className="font-display text-xl font-bold mb-6">Referral Program</h2>
              <div className="bg-secondary rounded-lg p-8 text-center">
                <Users className="h-10 w-10 text-primary mx-auto mb-3" aria-hidden="true" />
                <p className="font-display text-lg font-bold">Give $15, Get $15</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  Share your unique link with friends. They get $15 off their first order, and you earn $15 credit + 100 loyalty points.
                </p>
                <div className="mt-6 flex items-center gap-2 max-w-sm mx-auto">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="flex-1 px-3 py-2 text-sm bg-background border border-input rounded-md"
                    aria-label="Your referral link"
                  />
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Copy referral link"
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div aria-live="polite" className="sr-only">{copied ? "Referral link copied to clipboard" : ""}</div>
              </div>
              <div className="mt-6 grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Friends Referred", value: "3" },
                  { label: "Credits Earned", value: "$45.00" },
                  { label: "Points Earned", value: "300" },
                ].map(stat => (
                  <div key={stat.label} className="border border-border rounded-lg p-4 text-center">
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
