import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/edu/Layout";
import { CourseCard } from "@/components/edu/CourseCard";
import { Button } from "@/components/ui/button";
import { courses } from "@/data/courses";
import { ArrowRight, BookOpen, CheckCircle, Code, BarChart3, Palette, Briefcase, Camera, Users, Award, PlayCircle } from "lucide-react";
import heroImg from "@/assets/hero-illustration.png";

const categories = [
  { label: "Web Development", icon: Code, count: 240 },
  { label: "Data Science", icon: BarChart3, count: 180 },
  { label: "UX Design", icon: Palette, count: 120 },
  { label: "Business", icon: Briefcase, count: 160 },
  { label: "Photography", icon: Camera, count: 90 },
];

const steps = [
  { icon: BookOpen, title: "Explore Courses", desc: "Browse our extensive library of expert-led courses across dozens of subjects." },
  { icon: PlayCircle, title: "Learn at Your Pace", desc: "Watch video lessons, complete exercises, and track your progress anywhere." },
  { icon: Award, title: "Earn Certificates", desc: "Complete courses and earn certificates to showcase your new skills." },
];

export default function HomePage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="edu-hero-gradient relative overflow-hidden">
        <div className="edu-container relative z-10 flex flex-col items-center gap-8 py-20 md:flex-row md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex-1 text-center md:text-left"
          >
            <h1 className="font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
              Unlock Your Potential.{" "}
              <span className="text-secondary">Learn at Your Own Pace.</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-primary-foreground/70">
              Join millions of learners mastering new skills with world-class instructors.
              Start your journey today — no experience required.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold px-8">
                <Link to="/courses">Browse Courses</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/pricing">Start Free Trial</Link>
              </Button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex-1"
          >
            <img src={heroImg} alt="Learning illustration" className="mx-auto w-full max-w-md animate-float rounded-2xl" />
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-b border-border bg-card py-6">
        <div className="edu-container flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { value: "2M+", label: "Learners Worldwide" },
            { value: "500+", label: "Expert Instructors" },
            { value: "1,200+", label: "Courses Available" },
            { value: "95%", label: "Satisfaction Rate" },
          ].map((stat) => (
            <div key={stat.label} className="px-4">
              <div className="font-display text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="edu-section bg-background">
        <div className="edu-container">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">Explore by Category</h2>
            <p className="mt-2 text-muted-foreground">Find the perfect course for your goals</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((cat) => (
              <Link
                key={cat.label}
                to="/courses"
                className="edu-card flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-secondary"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                  <cat.icon className="h-6 w-6 text-secondary" />
                </div>
                <span className="font-display text-sm font-semibold text-foreground">{cat.label}</span>
                <span className="text-xs text-muted-foreground">{cat.count} courses</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="edu-section bg-muted/50">
        <div className="edu-container">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground">Featured Courses</h2>
              <p className="mt-2 text-muted-foreground">Hand-picked by our editorial team</p>
            </div>
            <Link to="/courses" className="hidden items-center gap-1 text-sm font-medium text-secondary hover:underline md:flex">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courses.slice(0, 4).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="edu-section bg-background">
        <div className="edu-container">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">How It Works</h2>
            <p className="mt-2 text-muted-foreground">Three simple steps to start learning</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10">
                  <step.icon className="h-8 w-8 text-secondary" />
                </div>
                <div className="mb-1 font-display text-xs font-semibold uppercase tracking-wider text-secondary">
                  Step {i + 1}
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="edu-hero-gradient">
        <div className="edu-container py-16 text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground">
            Ready to Start Learning?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-primary-foreground/70">
            Join 2 million+ learners and gain access to world-class courses today.
          </p>
          <Button asChild size="lg" className="mt-8 bg-secondary text-secondary-foreground hover:bg-secondary/90 px-10 font-semibold">
            <Link to="/pricing">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
