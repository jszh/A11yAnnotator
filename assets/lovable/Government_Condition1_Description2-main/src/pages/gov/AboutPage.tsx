import { Building, BarChart3, Scale, Shield } from "lucide-react";
import Layout from "@/components/gov/Layout";

const agencies = [
  "Agency of Administration",
  "Agency of Agriculture, Food & Markets",
  "Agency of Commerce & Community Development",
  "Agency of Education",
  "Agency of Human Services",
  "Agency of Natural Resources",
  "Agency of Transportation",
  "Department of Health",
  "Department of Labor",
  "Department of Public Safety",
];

const AboutPage = () => (
  <Layout>
    <section className="bg-primary text-primary-foreground py-12">
      <div className="container">
        <h1 className="font-display text-3xl md:text-4xl font-bold">About Vermont</h1>
        <p className="mt-2 opacity-80 text-lg">Transparency, service, and accountability for all Vermonters.</p>
      </div>
    </section>

    {/* Governor message */}
    <section className="py-12 md:py-16" aria-labelledby="governor-heading">
      <div className="container max-w-4xl">
        <div className="rounded-xl border border-border bg-card p-8 md:flex gap-8 items-start">
          <div className="shrink-0 mb-6 md:mb-0">
            <div className="h-32 w-32 rounded-lg bg-muted flex items-center justify-center text-muted-foreground" aria-hidden="true">
              <Building className="h-12 w-12" />
            </div>
          </div>
          <div>
            <h2 id="governor-heading" className="font-display text-xl font-bold text-foreground mb-3">A Message from the Governor</h2>
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>Welcome to Vermont's official services portal. Our mission is to make government accessible, efficient, and responsive to the needs of every resident.</p>
              <p>Whether you're renewing a license, applying for assistance, or seeking information about our state programs, this portal is designed to help you accomplish your goals quickly and easily.</p>
              <p>We are committed to transparent governance and welcome your feedback on how we can better serve you.</p>
              <p className="font-medium text-foreground">— Office of the Governor, State of Vermont</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Agency Directory */}
    <section className="bg-muted py-12 md:py-16" aria-labelledby="agencies-heading">
      <div className="container max-w-4xl">
        <h2 id="agencies-heading" className="font-display text-2xl font-bold text-foreground mb-6">State Agency Directory</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {agencies.map((a) => (
            <div key={a} className="rounded-lg border border-border bg-card px-5 py-3.5 text-sm font-medium text-foreground">
              {a}
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Transparency */}
    <section className="py-12 md:py-16" aria-labelledby="transparency-heading">
      <div className="container max-w-4xl">
        <h2 id="transparency-heading" className="font-display text-2xl font-bold text-foreground mb-6">Open Data & Transparency</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: BarChart3, title: "Open Data Portal", desc: "Access public datasets, reports, and statistical dashboards." },
            { icon: Scale, title: "Legislative Updates", desc: "Follow bills, committee hearings, and legislative session news." },
            { icon: Shield, title: "Accessibility", desc: "This portal complies with WCAG 2.1 AA standards. We continuously audit and improve accessibility." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-card p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gov-green/10 text-gov-green">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </Layout>
);

export default AboutPage;
