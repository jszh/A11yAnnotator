import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Users, Award, ChevronRight, Star, CheckCircle } from "lucide-react";
import Layout from "../components/Layout";

const partnerLogos = ["Google", "Mayo Clinic", "Deloitte", "Amazon", "Kaiser"];

const successStories = [
  { name: "Maria S.", before: "Retail Associate", after: "Medical Admin Assistant", quote: "SkillForge gave me a real career path. I completed my certificate while working full-time.", weeks: 8 },
  { name: "James T.", before: "Warehouse Worker", after: "IT Help Desk Analyst", quote: "The cohort model kept me accountable. I landed a job 2 weeks after finishing.", weeks: 10 },
  { name: "Priya K.", before: "Stay-at-Home Parent", after: "Bookkeeper", quote: "The financing options made it possible. Now I run my own bookkeeping practice.", weeks: 12 },
];

const pathways = [
  { field: "Healthcare Support", programs: 8, icon: "🏥", color: "bg-edu-teal-light text-edu-teal" },
  { field: "IT & Cybersecurity", programs: 6, icon: "💻", color: "bg-blue-50 text-blue-700" },
  { field: "Skilled Trades", programs: 5, icon: "🔧", color: "bg-orange-50 text-orange-700" },
  { field: "Business Administration", programs: 7, icon: "📊", color: "bg-edu-amber-light text-amber-700" },
];

export default function HomePage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, hsl(168 76% 36% / 0.3), transparent 50%), radial-gradient(circle at 80% 20%, hsl(38 92% 50% / 0.2), transparent 50%)" }} aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-1 bg-accent/20 text-accent text-sm font-bold px-3 py-1 rounded-full mb-6">
                <Clock className="w-4 h-4" aria-hidden="true" />
                Cohort starting March 3 — 4 seats left
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                Your Next Career Starts Here
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Earn industry-recognized certificates in as little as 8 weeks. Join instructor-led cohorts or learn at your own pace.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/edu-portal/courses" className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-lg font-bold text-lg hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
                  Find Your Path <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
                <Link to="/edu-portal/courses" className="inline-flex items-center gap-2 border-2 border-primary-foreground/30 px-6 py-3 rounded-lg font-medium hover:bg-primary-foreground/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  Browse Courses
                </Link>
              </div>
            </motion.div>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <span className="text-sm text-muted-foreground">Trusted by employers:</span>
            {partnerLogos.map((name) => (
              <span key={name} className="bg-primary-foreground/10 text-sm px-3 py-1 rounded font-medium">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-edu-warm-bg py-12" aria-label="Platform statistics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "15,000+", label: "Graduates" },
              { value: "92%", label: "Job Placement Rate" },
              { value: "4.8/5", label: "Student Rating" },
              { value: "200+", label: "Employer Partners" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-display font-bold text-edu-teal">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Pathways */}
      <section className="py-16 md:py-20" aria-labelledby="pathways-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="pathways-heading" className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Explore Career Pathways</h2>
          <p className="text-muted-foreground mb-10 max-w-xl">Choose your field and we'll match you with the right program, schedule, and financing.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pathways.map((p) => (
              <Link key={p.field} to="/edu-portal/courses" className={`group rounded-xl border border-border p-6 hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent bg-card`}>
                <div className={`w-12 h-12 rounded-lg ${p.color} flex items-center justify-center text-2xl mb-4`} aria-hidden="true">{p.icon}</div>
                <h3 className="font-bold text-lg text-card-foreground mb-1">{p.field}</h3>
                <p className="text-sm text-muted-foreground">{p.programs} programs available</p>
                <span className="inline-flex items-center text-sm text-edu-teal font-medium mt-3 group-hover:gap-2 transition-all">
                  Explore <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="bg-edu-warm-bg py-16 md:py-20" aria-labelledby="stories-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="stories-heading" className="font-display text-3xl md:text-4xl font-bold text-foreground mb-10">Success Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {successStories.map((story) => (
              <article key={story.name} className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <div className="flex items-center gap-1 mb-3" aria-label="5 star rating">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-accent text-accent" aria-hidden="true" />)}
                </div>
                <blockquote className="text-card-foreground mb-4 italic">"{story.quote}"</blockquote>
                <div className="border-t border-border pt-4">
                  <div className="font-bold text-card-foreground">{story.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <span>{story.before}</span>
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    <span className="text-edu-teal font-medium">{story.after}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{story.weeks}-week program</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 text-center" aria-label="Call to action">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">Ready to Start?</h2>
          <p className="text-muted-foreground mb-8">Take our 2-minute career quiz to find the program that fits your goals, schedule, and budget.</p>
          <Link to="/edu-portal/courses" className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-8 py-4 rounded-lg font-bold text-lg hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Find Your Path <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
