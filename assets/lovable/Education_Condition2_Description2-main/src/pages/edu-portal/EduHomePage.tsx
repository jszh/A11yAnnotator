import { Link } from "react-router-dom";
import { EduLayout } from "@/components/edu-portal/EduLayout";
import {
  ArrowRight, Star, Clock, Users, Award, ChevronRight, Sparkles,
  Shield, TrendingUp, BookOpen
} from "lucide-react";

const partnerLogos = ["Google", "Mayo Clinic", "Deloitte", "Amazon", "Kaiser Permanente"];

const successStories = [
  {
    name: "Maria Gonzalez",
    before: "Retail Associate",
    after: "Medical Administrative Assistant",
    quote: "SkillForge gave me the confidence and credentials to change my career in just 8 weeks.",
    rating: 5,
  },
  {
    name: "James Chen",
    before: "Warehouse Worker",
    after: "IT Help Desk Technician",
    quote: "The cohort format kept me accountable. I landed a job before I even finished the program.",
    rating: 5,
  },
  {
    name: "Aisha Williams",
    before: "Food Service Manager",
    after: "Business Operations Coordinator",
    quote: "The employer sponsorship made it possible. Zero out-of-pocket costs for me.",
    rating: 5,
  },
];

const pathways = [
  { icon: Shield, title: "Healthcare Support", desc: "Medical admin, billing, patient care coordination", color: "bg-edu-teal" },
  { icon: BookOpen, title: "IT & Cybersecurity", desc: "Help desk, network admin, security fundamentals", color: "bg-edu-info" },
  { icon: TrendingUp, title: "Skilled Trades", desc: "HVAC, electrical, plumbing apprenticeships", color: "bg-edu-amber" },
  { icon: Award, title: "Business Admin", desc: "Office management, bookkeeping, HR support", color: "bg-edu-navy-light" },
];

export default function EduHomePage() {
  return (
    <EduLayout title="Your Next Career Starts Here">
      {/* Hero */}
      <section
        className="relative overflow-hidden bg-edu-navy py-20 lg:py-28"
        aria-labelledby="hero-heading"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 50%, hsl(38 92% 55% / 0.3), transparent 60%)" }} />
        </div>
        <div className="container relative mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-edu-amber/10 px-4 py-1.5 text-sm font-medium text-edu-amber">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Cohort starting March 3 — 4 seats left
            </div>
            <h1 id="hero-heading" className="text-4xl font-bold text-primary-foreground sm:text-5xl lg:text-6xl leading-tight">
              Your Next Career{" "}
              <span className="text-edu-amber">Starts Here</span>
            </h1>
            <p className="mt-5 text-lg text-primary-foreground/70 sm:text-xl max-w-2xl mx-auto">
              Earn industry-recognized certificates in as little as 8 weeks. Instructor-led cohorts and self-paced tracks in healthcare, IT, trades, and business.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/edu-portal/courses"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-edu-amber px-6 py-3.5 font-semibold text-edu-navy transition-all hover:opacity-90 hover:scale-[1.02] shadow-lg"
              >
                Find Your Path
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                to="/edu-portal/courses"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary-foreground/20 px-6 py-3.5 font-semibold text-primary-foreground transition-colors hover:border-edu-amber hover:text-edu-amber"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Partner logos */}
      <section className="border-b border-border bg-card py-8" aria-label="Trusted by leading employers">
        <div className="container mx-auto px-4 lg:px-8">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">
            Our graduates work at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-14">
            {partnerLogos.map((name) => (
              <span key={name} className="text-lg font-bold text-muted-foreground/40 font-body">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Career Pathways */}
      <section className="py-16 lg:py-20" aria-labelledby="pathways-heading">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="pathways-heading" className="text-3xl font-bold text-foreground lg:text-4xl">
              Choose Your Career Path
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Industry-aligned programs designed with employer input to get you job-ready.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pathways.map((p) => (
              <Link
                key={p.title}
                to="/edu-portal/courses"
                className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
                aria-label={`Explore ${p.title} programs`}
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${p.color} text-primary-foreground`}>
                  <p.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-body text-lg font-semibold text-foreground">{p.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-edu-teal group-hover:text-edu-amber transition-colors">
                  Explore <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-edu-navy py-14" aria-label="Platform statistics">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3 text-center">
            {[
              { stat: "92%", label: "Job placement within 3 months", icon: TrendingUp },
              { stat: "15,000+", label: "Graduates and counting", icon: Users },
              { stat: "8 weeks", label: "Average program length", icon: Clock },
            ].map((s) => (
              <div key={s.label}>
                <s.icon className="h-8 w-8 text-edu-amber mx-auto mb-2" aria-hidden="true" />
                <div className="text-3xl font-bold text-primary-foreground">{s.stat}</div>
                <p className="mt-1 text-sm text-primary-foreground/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 lg:py-20" aria-labelledby="stories-heading">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 id="stories-heading" className="text-3xl font-bold text-foreground text-center mb-10 lg:text-4xl">
            Success Stories
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {successStories.map((story) => (
              <article
                key={story.name}
                className="rounded-xl border border-border bg-card p-6 shadow-sm"
                aria-label={`Success story from ${story.name}`}
              >
                <div className="flex gap-1 mb-3" aria-label={`${story.rating} out of 5 stars`}>
                  {Array.from({ length: story.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-edu-amber text-edu-amber" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-foreground text-sm leading-relaxed mb-4">
                  "{story.quote}"
                </blockquote>
                <div className="border-t border-border pt-3">
                  <p className="font-semibold text-foreground text-sm">{story.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {story.before} → <span className="text-edu-teal font-medium">{story.after}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-edu-teal py-14" aria-labelledby="cta-heading">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 id="cta-heading" className="text-3xl font-bold text-primary-foreground lg:text-4xl">
            Ready to Start Learning?
          </h2>
          <p className="mt-3 text-primary-foreground/80 max-w-lg mx-auto">
            Join 15,000+ graduates who transformed their careers. Financial aid and employer sponsorship available.
          </p>
          <Link
            to="/edu-portal/courses"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-edu-amber px-8 py-3.5 font-semibold text-edu-navy hover:opacity-90 transition-opacity shadow-lg"
          >
            Start Learning <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </EduLayout>
  );
}
