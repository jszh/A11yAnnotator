import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Button } from "@/components/ui/button";
import { CourseCard } from "../components/CourseCard";
import { courses, categories } from "../data/courses";
import { Code, BarChart3, Palette, Briefcase, Camera, Users, Award, BookOpen } from "lucide-react";
import heroImage from "@/assets/hero-learning.jpg";
import { useEffect } from "react";

const categoryIcons: Record<string, React.ReactNode> = {
  "Web Development": <Code className="h-6 w-6" aria-hidden="true" />,
  "Data Science": <BarChart3 className="h-6 w-6" aria-hidden="true" />,
  "UX Design": <Palette className="h-6 w-6" aria-hidden="true" />,
  "Business": <Briefcase className="h-6 w-6" aria-hidden="true" />,
  "Photography": <Camera className="h-6 w-6" aria-hidden="true" />,
};

const steps = [
  { icon: <BookOpen className="h-8 w-8 text-accent" aria-hidden="true" />, title: "Browse Courses", description: "Explore our library of expert-led courses across 50+ categories." },
  { icon: <Users className="h-8 w-8 text-accent" aria-hidden="true" />, title: "Learn at Your Pace", description: "Watch video lectures, complete exercises, and get certified on your schedule." },
  { icon: <Award className="h-8 w-8 text-accent" aria-hidden="true" />, title: "Get Certified", description: "Earn recognized certificates to advance your career and showcase skills." },
];

export default function HomePage() {
  useEffect(() => {
    document.title = "LearnPath — Unlock Your Potential";
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="edu-hero-gradient relative overflow-hidden" aria-labelledby="hero-heading">
        <div className="edu-container relative z-10 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 id="hero-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display text-primary-foreground leading-tight">
              Unlock Your Potential.<br />Learn at Your Own Pace.
            </h1>
            <p className="mt-4 text-primary-foreground/80 text-lg leading-relaxed max-w-lg">
              Join millions of learners mastering new skills with world-class instructors. From code to creativity — your journey starts here.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild>
                <Link to="/courses">Browse Courses</Link>
              </Button>
              <Button variant="hero-outline" size="lg" asChild>
                <Link to="/pricing">Start Free Trial</Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <img src={heroImage} alt="Diverse group of learners studying together with laptops" className="rounded-xl shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-accent/5 border-b" aria-label="Social proof">
        <div className="edu-container py-6 flex flex-wrap items-center justify-center gap-8 text-center">
          <div>
            <p className="text-2xl font-bold font-display text-foreground">2M+</p>
            <p className="text-xs text-muted-foreground">Learners worldwide</p>
          </div>
          <div className="h-8 w-px bg-border" aria-hidden="true" />
          <div>
            <p className="text-2xl font-bold font-display text-foreground">500+</p>
            <p className="text-xs text-muted-foreground">Expert courses</p>
          </div>
          <div className="h-8 w-px bg-border" aria-hidden="true" />
          <div>
            <p className="text-2xl font-bold font-display text-foreground">50+</p>
            <p className="text-xs text-muted-foreground">Categories</p>
          </div>
          <div className="h-8 w-px bg-border" aria-hidden="true" />
          <div>
            <p className="text-2xl font-bold font-display text-foreground">4.8</p>
            <p className="text-xs text-muted-foreground">Avg. rating</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16" aria-labelledby="categories-heading">
        <div className="edu-container">
          <h2 id="categories-heading" className="text-2xl font-display text-foreground text-center">Explore Categories</h2>
          <p className="text-center text-muted-foreground mt-2 mb-10">Find the perfect course for your learning goals</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat}
                to="/courses"
                className="edu-card flex flex-col items-center gap-3 p-6 text-center hover:border-accent/40 transition-colors edu-focus-ring"
                aria-label={`Browse ${cat} courses`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                  {categoryIcons[cat]}
                </div>
                <span className="text-sm font-medium text-foreground">{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured courses */}
      <section className="py-16 bg-muted/50" aria-labelledby="featured-heading">
        <div className="edu-container">
          <div className="flex items-center justify-between mb-8">
            <h2 id="featured-heading" className="text-2xl font-display text-foreground">Featured Courses</h2>
            <Button variant="link" asChild>
              <Link to="/courses">View all →</Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.slice(0, 4).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16" aria-labelledby="how-heading">
        <div className="edu-container text-center">
          <h2 id="how-heading" className="text-2xl font-display text-foreground mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                  {step.icon}
                </div>
                <h3 className="text-lg font-display text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="edu-hero-gradient py-16" aria-labelledby="cta-heading">
        <div className="edu-container text-center">
          <h2 id="cta-heading" className="text-2xl md:text-3xl font-display text-primary-foreground">Ready to Start Learning?</h2>
          <p className="mt-3 text-primary-foreground/80 max-w-md mx-auto">Join over 2 million learners and start building the skills you need today.</p>
          <Button variant="hero" size="lg" className="mt-8" asChild>
            <Link to="/pricing">Start Free Trial</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
