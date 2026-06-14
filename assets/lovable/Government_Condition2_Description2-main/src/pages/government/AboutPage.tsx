import { Building2, BarChart3, Scale, ShieldCheck, ExternalLink } from "lucide-react";
import GovLayout from "@/components/government/GovLayout";
import Breadcrumbs from "@/components/government/Breadcrumbs";

const agencies = [
  "Agency of Administration",
  "Agency of Commerce & Community Development",
  "Agency of Education",
  "Agency of Human Services",
  "Agency of Natural Resources",
  "Agency of Transportation",
  "Department of Health",
  "Department of Public Safety",
];

const news = [
  { title: "Governor signs bipartisan infrastructure bill", date: "Mar 20, 2026" },
  { title: "Legislature approves expanded childcare funding", date: "Mar 15, 2026" },
  { title: "Clean energy initiative reaches 50% milestone", date: "Mar 10, 2026" },
];

export default function AboutPage() {
  return (
    <GovLayout title="About Vermont">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "About" }]} />

      <section className="gov-container gov-section" aria-labelledby="about-heading">
        {/* Governor's Message */}
        <section className="mb-16" aria-labelledby="governor-heading">
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="grid md:grid-cols-3 gap-0">
              <div className="bg-primary p-8 flex flex-col justify-center items-center text-center">
                <div className="w-32 h-32 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-4" aria-hidden="true">
                  <span className="font-serif text-4xl font-bold text-primary-foreground">VT</span>
                </div>
                <h2 className="font-serif font-bold text-lg text-primary-foreground">Governor</h2>
                <p className="text-primary-foreground/70 text-sm">State of Vermont</p>
              </div>
              <div className="md:col-span-2 p-8">
                <h1 id="about-heading" className="text-3xl font-serif font-bold mb-4">Welcome to Vermont</h1>
                <blockquote className="text-muted-foreground leading-relaxed space-y-4">
                  <p>
                    "Vermont has always been a state that puts its people first. Our mission is to provide transparent,
                    accessible, and efficient government services to every resident — whether you're filing for benefits,
                    renewing a license, or starting a business.
                  </p>
                  <p>
                    This portal is designed to make interacting with your state government as simple and straightforward
                    as possible. We are committed to continuous improvement and welcome your feedback."
                  </p>
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* Agency Directory */}
        <section className="mb-16" aria-labelledby="agencies-heading">
          <h2 id="agencies-heading" className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" aria-hidden="true" />
            State Agency Directory
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list" aria-label="Vermont state agencies">
            {agencies.map((agency) => (
              <li key={agency}>
                <div className="flex items-center gap-3 rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary text-primary shrink-0" aria-hidden="true">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-card-foreground">{agency}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Transparency & Open Data */}
        <section className="mb-16" aria-labelledby="transparency-heading">
          <h2 id="transparency-heading" className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" aria-hidden="true" />
            Open Data & Transparency
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Budget Reports", desc: "Annual state budget documents and expenditure data.", icon: BarChart3 },
              { title: "Legislative Records", desc: "Bills, votes, and session records.", icon: Scale },
              { title: "Performance Metrics", desc: "Agency performance dashboards and outcomes.", icon: BarChart3 },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border bg-card p-6 hover:shadow-sm transition-shadow">
                <item.icon className="h-8 w-8 text-primary mb-3" aria-hidden="true" />
                <h3 className="font-semibold text-card-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                <span className="text-sm font-medium text-primary flex items-center gap-1">
                  View reports <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Legislative News */}
        <section className="mb-16" aria-labelledby="news-heading">
          <h2 id="news-heading" className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
            <Scale className="h-6 w-6 text-primary" aria-hidden="true" />
            Legislative News
          </h2>
          <ul className="space-y-3" role="list">
            {news.map((item) => (
              <li key={item.title}>
                <article className="flex items-center justify-between rounded-lg border bg-card p-4">
                  <p className="text-sm font-medium text-card-foreground">{item.title}</p>
                  <time className="text-xs text-muted-foreground shrink-0 ml-4">{item.date}</time>
                </article>
              </li>
            ))}
          </ul>
        </section>

        {/* Accessibility Statement */}
        <section aria-labelledby="accessibility-heading">
          <h2 id="accessibility-heading" className="text-2xl font-serif font-bold mb-4 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
            Accessibility Compliance
          </h2>
          <div className="rounded-lg border bg-card p-6">
            <p className="text-card-foreground leading-relaxed">
              The State of Vermont is committed to ensuring digital accessibility for people with disabilities.
              We continually improve the user experience for everyone and apply the relevant accessibility standards.
              This website conforms to WCAG 2.1 Level AA guidelines. If you encounter any accessibility barriers,
              please contact us at <strong>accessibility@vermont.gov</strong> or call <strong>1-800-VT-HELP1</strong>.
            </p>
          </div>
        </section>
      </section>
    </GovLayout>
  );
}
