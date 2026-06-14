import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/edu/Layout";
import { courses } from "@/data/courses";
import { StarRating } from "@/components/edu/StarRating";
import { Button } from "@/components/ui/button";
import { PlayCircle, FileText, Award, Download, Clock, Users, BarChart3, ChevronDown, ChevronUp, CheckCircle, Star } from "lucide-react";
import { useState } from "react";

const curriculum = [
  { title: "Getting Started with Python", lessons: 6, duration: "3h 20m" },
  { title: "Data Structures & Types", lessons: 8, duration: "5h 10m" },
  { title: "Working with Pandas", lessons: 7, duration: "6h 00m" },
  { title: "Data Visualization", lessons: 6, duration: "4h 45m" },
  { title: "Machine Learning Basics", lessons: 5, duration: "4h 45m" },
];

const reviews = [
  { name: "Alex Thompson", rating: 5, text: "Absolutely fantastic course. Dr. Chen explains complex concepts with clarity and the exercises are very practical.", date: "2 weeks ago" },
  { name: "Maria Garcia", rating: 4, text: "Great content and well-structured. Would love more advanced projects in future updates.", date: "1 month ago" },
  { name: "Chris Lee", rating: 5, text: "This course changed my career trajectory. I landed a data analyst role within 3 months of completing it.", date: "3 months ago" },
];

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const course = courses.find((c) => c.id === courseId) || courses[0];
  const [openSection, setOpenSection] = useState<number | null>(0);

  return (
    <Layout>
      {/* Header */}
      <section className="edu-hero-gradient py-12">
        <div className="edu-container">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="edu-badge bg-secondary/20 text-secondary">{course.level}</span>
              <span className="text-sm text-primary-foreground/60">{course.category}</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
              {course.title}
            </h1>
            <p className="mt-3 text-primary-foreground/70">
              Master the fundamentals and advanced techniques with hands-on projects and real-world applications. Build portfolio-ready skills.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-primary-foreground/70">
              <StarRating rating={course.rating} count={course.reviewCount} />
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {course.enrolled.toLocaleString()} enrolled</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {course.duration}</span>
            </div>
            <p className="mt-3 text-sm text-primary-foreground/60">Created by <span className="text-secondary">{course.instructor}</span></p>
          </div>
        </div>
      </section>

      <section className="edu-section bg-background">
        <div className="edu-container flex flex-col gap-8 lg:flex-row">
          {/* Main Content */}
          <div className="flex-1">
            {/* What You'll Learn */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-bold text-foreground">What You'll Learn</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "Python fundamentals and best practices",
                  "Data manipulation with Pandas & NumPy",
                  "Data visualization with Matplotlib & Seaborn",
                  "Statistical analysis and hypothesis testing",
                  "Machine learning model building",
                  "Real-world data science projects",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Includes */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { icon: PlayCircle, label: "24 hours video" },
                { icon: FileText, label: "15 articles" },
                { icon: Download, label: "12 resources" },
                { icon: Award, label: "Certificate" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
                  <item.icon className="h-5 w-5 text-secondary" />
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Curriculum */}
            <div className="mt-8">
              <h2 className="font-display text-xl font-bold text-foreground">Course Curriculum</h2>
              <p className="mt-1 text-sm text-muted-foreground">5 sections · 32 lessons · {course.duration} total</p>
              <div className="mt-4 space-y-2">
                {curriculum.map((section, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card">
                    <button
                      onClick={() => setOpenSection(openSection === i ? null : i)}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-display text-xs font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                        <div>
                          <span className="text-sm font-semibold text-foreground">{section.title}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{section.lessons} lessons · {section.duration}</span>
                        </div>
                      </div>
                      {openSection === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {openSection === i && (
                      <div className="border-t border-border px-4 py-3 space-y-2">
                        {Array.from({ length: section.lessons }, (_, j) => (
                          <div key={j} className="flex items-center gap-3 py-1 text-sm text-muted-foreground">
                            <PlayCircle className="h-4 w-4 text-secondary/60" />
                            <span>Lesson {j + 1}: {section.title} — Part {j + 1}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor */}
            <div className="mt-8 rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-bold text-foreground">Your Instructor</h2>
              <div className="mt-4 flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary/10 font-display text-xl font-bold text-secondary">
                  {course.instructor.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">{course.instructor}</h3>
                  <p className="text-sm text-muted-foreground">Senior Data Scientist & Educator</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    With over 10 years of industry experience at leading tech companies, {course.instructor.split(" ")[0]} has taught
                    over 200,000 students worldwide. Their teaching style focuses on practical, project-based learning.
                  </p>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="mt-8">
              <h2 className="font-display text-xl font-bold text-foreground">Student Reviews</h2>
              <div className="mt-2 flex items-center gap-3">
                <span className="font-display text-4xl font-bold text-foreground">{course.rating}</span>
                <div>
                  <StarRating rating={course.rating} />
                  <p className="text-xs text-muted-foreground">{course.reviewCount.toLocaleString()} reviews</p>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                {reviews.map((review) => (
                  <div key={review.name} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-display text-xs font-bold text-muted-foreground">
                          {review.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-sm font-medium text-foreground">{review.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <div className="mt-2"><StarRating rating={review.rating} /></div>
                    <p className="mt-2 text-sm text-muted-foreground">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Sidebar */}
          <aside className="lg:w-80">
            <div className="sticky top-20 rounded-xl border border-border bg-card p-6 edu-card">
              <div className="aspect-video overflow-hidden rounded-lg bg-muted mb-4">
                <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
              </div>
              <div className="mb-4 font-display text-3xl font-bold text-foreground">{course.price}</div>
              <Button asChild className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold" size="lg">
                <Link to="/study">Enroll Now</Link>
              </Button>
              <Button variant="outline" className="mt-2 w-full" size="lg">
                Add to Wishlist
              </Button>
              <div className="mt-6 space-y-3 text-sm">
                {[
                  `${course.duration} of video content`,
                  "Downloadable resources",
                  "Certificate of completion",
                  "Full lifetime access",
                  "30-day money-back guarantee",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-secondary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
