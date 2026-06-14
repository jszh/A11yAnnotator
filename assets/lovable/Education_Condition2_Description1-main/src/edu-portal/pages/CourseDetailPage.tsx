import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { StarRating } from "../components/StarRating";
import { Button } from "@/components/ui/button";
import { courses } from "../data/courses";
import {
  Play, FileText, Award, Download, ChevronDown, ChevronUp,
  Clock, BarChart3, Globe, CheckCircle2, Users, Star
} from "lucide-react";

const course = courses[0]; // Python for Data Science

const curriculum = [
  { title: "Getting Started with Python", lessons: 6, duration: "3h 20m", items: ["Welcome & Setup", "Python Basics", "Variables & Types", "Operators", "Control Flow", "Quiz: Basics"] },
  { title: "Data Structures", lessons: 7, duration: "4h 45m", items: ["Lists & Tuples", "Dictionaries", "Sets", "Comprehensions", "String Methods", "Nested Structures", "Quiz: Data Structures"] },
  { title: "Working with Data", lessons: 8, duration: "5h 30m", items: ["NumPy Introduction", "Arrays & Operations", "Pandas Basics", "DataFrames", "Data Cleaning", "Missing Values", "Data Transformation", "Quiz: Data Wrangling"] },
  { title: "Data Visualization", lessons: 6, duration: "4h 15m", items: ["Matplotlib Basics", "Seaborn", "Interactive Plots", "Dashboards", "Best Practices", "Project: Visualization"] },
  { title: "Machine Learning Intro", lessons: 5, duration: "6h 10m", items: ["ML Concepts", "Scikit-learn", "Classification", "Regression", "Final Project"] },
];

const reviews = [
  { name: "Jordan M.", rating: 5, text: "Incredibly well-structured course. Dr. Chen explains complex concepts in a way that's easy to follow. Highly recommend!", date: "2 weeks ago" },
  { name: "Priya S.", rating: 4, text: "Great content and exercises. Some advanced topics could use more depth, but overall excellent for intermediate learners.", date: "1 month ago" },
  { name: "Carlos D.", rating: 5, text: "This course transformed my career. The projects are practical and the certificate helped me land my first data science role.", date: "2 months ago" },
];

export default function CourseDetailPage() {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.title = `${course.title} | LearnPath`;
  }, []);

  // Focus trap for modal
  useEffect(() => {
    if (!showEnrollModal) return;
    const modal = modalRef.current;
    if (!modal) return;
    const focusable = modal.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEnrollModal(false);
        triggerRef.current?.focus();
      }
      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showEnrollModal]);

  const toggleSection = (i: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const totalLessons = curriculum.reduce((s, c) => s + c.lessons, 0);

  return (
    <Layout>
      {/* Hero */}
      <section className="edu-hero-gradient" aria-labelledby="course-title">
        <div className="edu-container py-12 md:py-16">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-sm text-primary-foreground/60">
              <li><Link to="/courses" className="hover:text-primary-foreground edu-focus-ring rounded">Courses</Link></li>
              <li aria-hidden="true">/</li>
              <li><span className="text-primary-foreground/80">{course.category}</span></li>
            </ol>
          </nav>
          <div className="max-w-2xl">
            <span className="edu-badge bg-accent/20 text-accent-foreground mb-3">{course.level}</span>
            <h1 id="course-title" className="text-3xl md:text-4xl font-display text-primary-foreground mt-2">{course.title}</h1>
            <p className="mt-4 text-primary-foreground/80 leading-relaxed">
              Master Python for data science with hands-on projects. Learn NumPy, Pandas, Matplotlib, and intro to machine learning. Build a portfolio-ready project.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-primary-foreground/70">
              <StarRating rating={course.rating} count={course.reviewCount} />
              <span className="flex items-center gap-1"><Users className="h-4 w-4" aria-hidden="true" />{course.enrolled.toLocaleString()} enrolled</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" aria-hidden="true" />{course.duration}</span>
              <span className="flex items-center gap-1"><BarChart3 className="h-4 w-4" aria-hidden="true" />{course.level}</span>
              <span className="flex items-center gap-1"><Globe className="h-4 w-4" aria-hidden="true" />English</span>
            </div>
          </div>
        </div>
      </section>

      <div className="edu-container py-10 grid lg:grid-cols-3 gap-10">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Instructor */}
          <section aria-labelledby="instructor-heading">
            <h2 id="instructor-heading" className="text-xl font-display text-foreground mb-4">Instructor</h2>
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xl" role="img" aria-label="Dr. Sarah Chen avatar">SC</div>
              <div>
                <p className="font-semibold text-foreground">{course.instructor}</p>
                <p className="text-sm text-muted-foreground mt-1">Ph.D. in Computer Science, Stanford University. 10+ years teaching data science. Former ML Engineer at Google.</p>
              </div>
            </div>
          </section>

          {/* Course includes */}
          <section aria-labelledby="includes-heading">
            <h2 id="includes-heading" className="text-xl font-display text-foreground mb-4">This Course Includes</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: <Play className="h-4 w-4" aria-hidden="true" />, text: "24 hours of video lectures" },
                { icon: <FileText className="h-4 w-4" aria-hidden="true" />, text: "15 coding exercises" },
                { icon: <Download className="h-4 w-4" aria-hidden="true" />, text: "Downloadable resources" },
                { icon: <Award className="h-4 w-4" aria-hidden="true" />, text: "Certificate of completion" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-foreground">
                  <span className="text-accent">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </section>

          {/* Curriculum */}
          <section aria-labelledby="curriculum-heading">
            <h2 id="curriculum-heading" className="text-xl font-display text-foreground mb-1">Curriculum</h2>
            <p className="text-sm text-muted-foreground mb-4">{curriculum.length} sections · {totalLessons} lessons · {course.duration}</p>
            <div className="border rounded-lg divide-y" role="list">
              {curriculum.map((section, i) => (
                <div key={i} role="listitem">
                  <h3>
                    <button
                      className="w-full flex items-center justify-between p-4 text-left edu-focus-ring rounded"
                      onClick={() => toggleSection(i)}
                      aria-expanded={openSections.has(i)}
                      aria-controls={`section-${i}`}
                    >
                      <span className="font-semibold text-sm text-foreground">{section.title}</span>
                      <span className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{section.lessons} lessons · {section.duration}</span>
                        {openSections.has(i) ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                      </span>
                    </button>
                  </h3>
                  {openSections.has(i) && (
                    <ul id={`section-${i}`} className="px-4 pb-4 space-y-2">
                      {section.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Play className="h-3 w-3 text-accent shrink-0" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Reviews */}
          <section aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="text-xl font-display text-foreground mb-4">Student Reviews</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="text-center">
                <p className="text-4xl font-bold font-display text-foreground">{course.rating}</p>
                <StarRating rating={course.rating} size="md" />
                <p className="text-xs text-muted-foreground mt-1">{course.reviewCount.toLocaleString()} reviews</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-3">{stars}</span>
                    <Star className="h-3 w-3 edu-star fill-current" aria-hidden="true" />
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-star"
                        style={{ width: `${stars === 5 ? 72 : stars === 4 ? 20 : stars === 3 ? 5 : stars === 2 ? 2 : 1}%` }}
                        role="img"
                        aria-label={`${stars} stars: ${stars === 5 ? 72 : stars === 4 ? 20 : stars === 3 ? 5 : stars === 2 ? 2 : 1}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {reviews.map((review, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{review.name}</span>
                      <StarRating rating={review.rating} />
                    </div>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky sidebar */}
        <aside className="lg:col-span-1" aria-label="Course enrollment">
          <div className="lg:sticky lg:top-24 edu-card p-6 space-y-4">
            <p className="text-3xl font-bold font-display text-foreground">${course.price}</p>
            <Button
              ref={triggerRef}
              variant="accent"
              size="lg"
              className="w-full"
              onClick={() => setShowEnrollModal(true)}
            >
              {enrolled ? "Go to Course" : "Enroll Now"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">30-day money-back guarantee</p>
            <div className="border-t pt-4 space-y-3">
              {[
                `${course.duration} of content`,
                `${totalLessons} lessons`,
                "Certificate of completion",
                "Lifetime access",
                "Mobile & desktop access",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Enrollment modal */}
      {showEnrollModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="enroll-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEnrollModal(false);
              triggerRef.current?.focus();
            }
          }}
        >
          <div ref={modalRef} className="bg-card rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4">
            <h2 id="enroll-modal-title" className="text-xl font-display text-foreground">Confirm Enrollment</h2>
            <p className="text-sm text-muted-foreground mt-2">You're about to enroll in <strong>{course.title}</strong> for ${course.price}.</p>
            <div className="mt-6 flex gap-3" aria-live="polite">
              <Button
                variant="accent"
                className="flex-1"
                onClick={() => {
                  setEnrolled(true);
                  setShowEnrollModal(false);
                  triggerRef.current?.focus();
                }}
              >
                Confirm
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowEnrollModal(false);
                  triggerRef.current?.focus();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
