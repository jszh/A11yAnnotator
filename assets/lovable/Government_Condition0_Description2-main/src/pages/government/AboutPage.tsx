import { Building2, BarChart3, Landmark, Shield } from "lucide-react";
import Layout from "@/components/government/Layout";
import governorImg from "@/assets/governor.jpg";

const agencies = [
  "Agency of Administration",
  "Agency of Agriculture, Food & Markets",
  "Agency of Commerce & Community Development",
  "Agency of Digital Services",
  "Agency of Education",
  "Agency of Human Services",
  "Agency of Natural Resources",
  "Agency of Transportation",
  "Department of Health",
  "Department of Public Safety",
];

const newsItems = [
  { title: "House passes clean energy investment bill", date: "Mar 19, 2026" },
  { title: "Senate approves rural broadband expansion funding", date: "Mar 16, 2026" },
  { title: "New housing affordability measures signed into law", date: "Mar 10, 2026" },
];

const AboutPage = () => (
  <Layout>
    <section className="bg-primary">
      <div className="container py-12 text-center">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-3">About the State of Vermont</h1>
        <p className="text-primary-foreground/80 font-body text-lg">Committed to transparent, accountable, and accessible government.</p>
      </div>
    </section>

    {/* Governor's Welcome */}
    <section className="container py-12">
      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-1">
          <img src={governorImg} alt="Governor of Vermont" className="rounded-xl w-full max-w-xs mx-auto shadow-lg" width={512} height={640} loading="lazy" />
        </div>
        <div className="md:col-span-2">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-4">A Message from the Governor</h2>
          <div className="font-body text-muted-foreground space-y-4 leading-relaxed">
            <p>
              Welcome to Vermont's official services portal. Our mission is to make government work for you — with clarity,
              efficiency, and compassion. Whether you're renewing a license, applying for assistance, or engaging with
              your local community, this platform is designed to put the services you need right at your fingertips.
            </p>
            <p>
              Vermont has long been a leader in open government and citizen engagement. We are committed to providing
              every resident — regardless of where they live or what language they speak — with equal access to the
              resources and support they deserve.
            </p>
            <p className="font-semibold text-foreground">
              — Governor Sarah Mitchell
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Agency Directory */}
    <section className="bg-gov-cream">
      <div className="container py-12">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="text-secondary" size={24} />
          <h2 className="font-heading text-2xl font-bold text-foreground">State Agency Directory</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {agencies.map((a) => (
            <div key={a} className="bg-card border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground hover:border-primary transition-colors cursor-pointer">
              {a}
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Transparency + Legislative News */}
    <section className="container py-12 grid md:grid-cols-2 gap-8">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="text-secondary" size={22} />
          <h2 className="font-heading text-xl font-bold text-foreground">Open Data & Transparency</h2>
        </div>
        <div className="space-y-3">
          {["State Budget Explorer", "Spending & Revenue Reports", "Performance Metrics Dashboard", "Public Records Request"].map((item) => (
            <a key={item} href="#" className="block bg-card border border-border rounded-lg px-4 py-3 font-body text-sm text-primary font-semibold hover:bg-muted transition-colors">
              {item} →
            </a>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Landmark className="text-secondary" size={22} />
          <h2 className="font-heading text-xl font-bold text-foreground">Legislative News</h2>
        </div>
        <div className="space-y-3">
          {newsItems.map((n) => (
            <div key={n.title} className="bg-card border border-border rounded-lg px-4 py-3">
              <p className="font-body text-sm font-semibold text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{n.date}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Compliance */}
    <section className="bg-muted">
      <div className="container py-8">
        <div className="flex items-start gap-3">
          <Shield className="text-secondary shrink-0 mt-1" size={20} />
          <div className="font-body text-sm text-muted-foreground">
            <strong className="text-foreground">Accessibility Compliance:</strong> The State of Vermont is committed to ensuring
            digital accessibility for all users. This website conforms to WCAG 2.1 AA standards. If you experience
            difficulties, please contact us at (802) 828-1110 or email accessibility@vermont.gov.
          </div>
        </div>
      </div>
    </section>
  </Layout>
);

export default AboutPage;
