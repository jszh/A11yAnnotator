import GovBreadcrumb from "@/components/government/Breadcrumb";
import { Download, Users } from "lucide-react";

const leadership = [
  { name: "Patricia A. Hernandez", title: "Mayor", district: "" },
  { name: "Robert Chen", title: "Council Member", district: "District 1" },
  { name: "Maria Gonzalez", title: "Council Member", district: "District 2" },
  { name: "James K. Williams", title: "Council Member", district: "District 3" },
  { name: "Susan Park", title: "Council Member", district: "District 4" },
  { name: "David Thompson", title: "City Manager", district: "" },
];

const GovAbout = () => (
  <>
    <GovBreadcrumb items={[{ label: "About" }]} />

    <section aria-labelledby="about-heading" className="py-12 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 id="about-heading" className="font-serif text-3xl font-bold text-foreground mb-8">About the City of Lakewood</h1>

        {/* Mission */}
        <section aria-labelledby="mission-heading" className="mb-10">
          <h2 id="mission-heading" className="font-serif text-xl font-bold text-foreground mb-3">Our Mission</h2>
          <blockquote className="border-l-4 border-accent pl-5 py-2 bg-gov-info rounded-r-lg">
            <p className="font-sans text-foreground italic leading-relaxed">
              "To provide exceptional public services that promote a safe, vibrant, and sustainable community where every resident has the opportunity to thrive."
            </p>
          </blockquote>
        </section>

        {/* History */}
        <section aria-labelledby="history-heading" className="mb-10">
          <h2 id="history-heading" className="font-serif text-xl font-bold text-foreground mb-3">City History</h2>
          <div className="font-sans text-muted-foreground leading-relaxed space-y-3">
            <p>Founded in 1954, the City of Lakewood was one of the first large-scale planned communities in the United States. What began as agricultural land transformed into a thriving suburban city, incorporating on April 16, 1954, with a population of over 70,000 residents.</p>
            <p>Over seven decades, Lakewood has grown to serve approximately 160,000 residents while maintaining its commitment to community values, public safety, and quality of life. The city spans 9.5 square miles and features over 20 parks, a nationally recognized community center, and award-winning public services.</p>
            <p>Today, Lakewood is recognized for its diverse neighborhoods, strong local economy, and innovative approach to municipal governance—consistently ranked among the best-managed cities in the state.</p>
          </div>
        </section>

        {/* Leadership */}
        <section aria-labelledby="leadership-heading" className="mb-10">
          <h2 id="leadership-heading" className="font-serif text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" aria-hidden="true" />
            City Leadership
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leadership.map((person) => (
              <li key={person.name} className="rounded-lg border border-border bg-card p-5 shadow-sm text-center">
                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gov-info text-primary font-serif text-2xl font-bold" aria-hidden="true">
                  {person.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <h3 className="font-sans font-semibold text-foreground">{person.name}</h3>
                <p className="text-sm text-accent font-sans font-medium">{person.title}</p>
                {person.district && <p className="text-xs text-muted-foreground font-sans">{person.district}</p>}
              </li>
            ))}
          </ul>
        </section>

        {/* Annual Report */}
        <section aria-labelledby="report-heading" className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 id="report-heading" className="font-serif text-xl font-bold text-foreground mb-3">Annual Report</h2>
          <p className="font-sans text-muted-foreground mb-4">Review the city's achievements, financial performance, and strategic priorities in our latest annual report.</p>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded bg-primary px-5 py-2.5 font-sans font-semibold text-sm text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Download 2023-2024 Annual Report (PDF)"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download 2023-2024 Annual Report (PDF)
          </a>
        </section>
      </div>
    </section>
  </>
);

export default GovAbout;
