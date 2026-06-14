import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Award, Users, Star, ChevronRight } from "lucide-react";

const partners = ["Google", "Mayo Clinic", "Deloitte", "Amazon", "Kaiser Permanente"];

const successStories = [
  { name: "Maria Santos", before: "Retail Associate", after: "Medical Admin Specialist", program: "Medical Administrative Assistant", quote: "SkillForge gave me the confidence and credentials to change my career at 34." },
  { name: "James Wright", before: "Warehouse Worker", after: "IT Help Desk Analyst", program: "CompTIA IT Fundamentals", quote: "The cohort format kept me accountable. I landed a job 2 weeks after completing my certificate." },
  { name: "Priya Kapoor", before: "Stay-at-Home Parent", after: "Bookkeeper", program: "Business Administration", quote: "Flexible scheduling meant I could learn while my kids were at school." },
];

const featuredPaths = [
  { icon: "🏥", title: "Healthcare Support", courses: 12, label: "High Demand" },
  { icon: "💻", title: "IT & Tech Support", courses: 9, label: "Fast Growing" },
  { icon: "📊", title: "Business Administration", courses: 8, label: "Flexible" },
  { icon: "🔧", title: "Skilled Trades", courses: 6, label: "Hands-On" },
];

const EduHome = () => (
  <div>
    {/* Hero */}
    <section className="relative overflow-hidden bg-primary">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--edu-navy-light)/0.5),transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-edu-gold/15 px-4 py-1.5 text-sm font-medium text-edu-gold">
            <Clock className="h-3.5 w-3.5" />
            Cohort starting March 3 — 4 seats left
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight text-primary-foreground sm:text-5xl lg:text-6xl">
            Your Next Career{" "}
            <span className="text-edu-gold">Starts Here</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-primary-foreground/75 sm:text-xl">
            Earn industry-recognized certificates in as little as 8 weeks. 
            Instructor-led cohorts and self-paced tracks in healthcare, IT, trades, and business.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="hero" size="lg" asChild>
              <Link to="/edu-portal/courses">
                Find Your Path <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="lg" asChild>
              <Link to="/edu-portal/pricing">View Plans</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-primary-foreground/60">
            <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-edu-gold" /> Accredited Programs</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-edu-gold" /> 12,000+ Graduates</span>
          </div>
        </div>
      </div>
    </section>

    {/* Partners */}
    <section className="border-b border-border bg-card py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-5 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Our graduates work at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {partners.map((p) => (
            <span key={p} className="text-lg font-semibold text-muted-foreground/50">{p}</span>
          ))}
        </div>
      </div>
    </section>

    {/* Career Paths */}
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Explore Career Paths</h2>
          <p className="mt-3 text-muted-foreground">Choose a field. We'll build the roadmap.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredPaths.map((path) => (
            <Link
              key={path.title}
              to="/edu-portal/courses"
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-edu-gold/40 hover:shadow-lg"
            >
              <div className="text-3xl mb-3">{path.icon}</div>
              <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-edu-navy">{path.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{path.courses} programs available</p>
              <span className="mt-3 inline-block rounded-full bg-edu-gold/10 px-2.5 py-0.5 text-xs font-medium text-edu-gold">
                {path.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>

    {/* Success Stories */}
    <section className="bg-edu-warm py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Success Stories</h2>
          <p className="mt-3 text-muted-foreground">Real career transformations from SkillForge graduates.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {successStories.map((story) => (
            <div key={story.name} className="rounded-xl bg-card p-6 shadow-sm border border-border">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-edu-gold text-edu-gold" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed italic">"{story.quote}"</p>
              <div className="mt-4 border-t border-border pt-4">
                <p className="font-semibold text-foreground text-sm">{story.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="line-through">{story.before}</span>
                  <ChevronRight className="inline h-3 w-3 mx-1" />
                  <span className="font-medium text-edu-emerald">{story.after}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{story.program}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="bg-primary py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
          Ready to Build Your Future?
        </h2>
        <p className="mt-4 text-lg text-primary-foreground/70 max-w-xl mx-auto">
          Take the free career quiz to find the program that fits your goals, schedule, and budget.
        </p>
        <Button variant="hero" size="lg" className="mt-8" asChild>
          <Link to="/edu-portal/courses">
            Find Your Path <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  </div>
);

export default EduHome;
