import { useState } from "react";
import { Link } from "react-router-dom";
import { EduLayout } from "@/components/edu-portal/EduLayout";
import { Clock, Users, DollarSign, Calendar, Award, Filter } from "lucide-react";

interface Course {
  id: string;
  title: string;
  field: string;
  format: "Self-Paced" | "Cohort" | "Live Online";
  duration: string;
  hours: number;
  cost: number;
  credential: string;
  nextStart: string;
  instructor: string;
}

const courses: Course[] = [
  { id: "medical-admin", title: "Medical Administrative Assistant Certificate", field: "Healthcare", format: "Cohort", duration: "8 weeks", hours: 120, cost: 349, credential: "Certificate", nextStart: "Mar 3, 2026", instructor: "Dr. Sarah Mitchell" },
  { id: "it-helpdesk", title: "IT Help Desk Technician", field: "IT", format: "Self-Paced", duration: "6 weeks", hours: 90, cost: 299, credential: "Certificate", nextStart: "Anytime", instructor: "Mike Torres" },
  { id: "cybersecurity-fundamentals", title: "Cybersecurity Fundamentals", field: "IT", format: "Live Online", duration: "10 weeks", hours: 150, cost: 599, credential: "Certificate", nextStart: "Mar 10, 2026", instructor: "Anika Patel" },
  { id: "medical-billing", title: "Medical Billing & Coding Specialist", field: "Healthcare", format: "Cohort", duration: "12 weeks", hours: 180, cost: 549, credential: "Certificate", nextStart: "Apr 7, 2026", instructor: "Linda Okafor" },
  { id: "hvac-basics", title: "HVAC Technician Basics", field: "Trades", format: "Cohort", duration: "10 weeks", hours: 160, cost: 499, credential: "Badge", nextStart: "Mar 17, 2026", instructor: "Robert Hayes" },
  { id: "business-ops", title: "Business Operations Coordinator", field: "Business", format: "Self-Paced", duration: "8 weeks", hours: 100, cost: 399, credential: "Certificate", nextStart: "Anytime", instructor: "Jessica Park" },
  { id: "phlebotomy", title: "Phlebotomy Technician Prep", field: "Healthcare", format: "Live Online", duration: "6 weeks", hours: 80, cost: 0, credential: "CEU", nextStart: "Mar 5, 2026", instructor: "Dr. Carlos Mendez" },
  { id: "project-mgmt", title: "Project Management Essentials", field: "Business", format: "Self-Paced", duration: "4 weeks", hours: 60, cost: 199, credential: "Badge", nextStart: "Anytime", instructor: "Tom Richardson" },
];

const fields = ["All", "Healthcare", "IT", "Trades", "Business"];
const formats = ["All", "Self-Paced", "Cohort", "Live Online"];
const costRanges = ["All", "Free", "Under $500", "$500+"];

function formatBadgeColor(format: string) {
  switch (format) {
    case "Cohort": return "bg-edu-teal/10 text-edu-teal";
    case "Self-Paced": return "bg-edu-amber/10 text-edu-amber";
    case "Live Online": return "bg-edu-info/10 text-edu-info";
    default: return "bg-muted text-muted-foreground";
  }
}

export default function EduCoursesPage() {
  const [fieldFilter, setFieldFilter] = useState("All");
  const [formatFilter, setFormatFilter] = useState("All");
  const [costFilter, setCostFilter] = useState("All");

  const filtered = courses.filter((c) => {
    if (fieldFilter !== "All" && c.field !== fieldFilter) return false;
    if (formatFilter !== "All" && c.format !== formatFilter) return false;
    if (costFilter === "Free" && c.cost !== 0) return false;
    if (costFilter === "Under $500" && (c.cost >= 500 || c.cost === 0)) return false;
    if (costFilter === "$500+" && c.cost < 500) return false;
    return true;
  });

  return (
    <EduLayout title="Browse Courses">
      {/* Header */}
      <section className="bg-edu-navy py-12" aria-labelledby="courses-heading">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 id="courses-heading" className="text-3xl font-bold text-primary-foreground lg:text-4xl">
            Browse Programs
          </h1>
          <p className="mt-2 text-primary-foreground/70 max-w-xl">
            Find industry-recognized credentials to advance your career. Filter by field, format, or budget.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 lg:px-8 py-10">
        {/* Filters */}
        <div className="mb-8 rounded-xl border border-border bg-card p-5 shadow-sm" role="search" aria-label="Course filters">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-foreground">
            <Filter className="h-4 w-4" aria-hidden="true" /> Filters
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <fieldset>
              <legend className="text-xs font-medium text-muted-foreground mb-1.5">Career Field</legend>
              <div className="flex flex-wrap gap-1.5">
                {fields.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFieldFilter(f)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      fieldFilter === f
                        ? "bg-edu-navy text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    aria-pressed={fieldFilter === f}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-xs font-medium text-muted-foreground mb-1.5">Format</legend>
              <div className="flex flex-wrap gap-1.5">
                {formats.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormatFilter(f)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      formatFilter === f
                        ? "bg-edu-navy text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    aria-pressed={formatFilter === f}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-xs font-medium text-muted-foreground mb-1.5">Cost</legend>
              <div className="flex flex-wrap gap-1.5">
                {costRanges.map((f) => (
                  <button
                    key={f}
                    onClick={() => setCostFilter(f)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      costFilter === f
                        ? "bg-edu-navy text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    aria-pressed={costFilter === f}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-16" role="status">
            <p className="text-muted-foreground">No courses match your current filters. Try adjusting your criteria above.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Course results">
            {filtered.map((course) => (
              <article
                key={course.id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col"
                role="listitem"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${formatBadgeColor(course.format)}`}>
                    {course.format}
                  </span>
                  <span className="text-xs text-muted-foreground">{course.credential}</span>
                </div>
                <h2 className="font-body text-base font-semibold text-foreground mb-2 leading-snug">
                  {course.title}
                </h2>
                <p className="text-xs text-muted-foreground mb-3">Instructor: {course.instructor}</p>
                <div className="mt-auto space-y-2 border-t border-border pt-3">
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" aria-hidden="true" /> {course.nextStart}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {course.hours}h</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" aria-hidden="true" /> {course.cost === 0 ? "Free" : `$${course.cost}`}</span>
                  </div>
                  <Link
                    to={`/edu-portal/courses/${course.id}`}
                    className="block w-full rounded-lg bg-edu-navy py-2 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    aria-label={`Enroll now in ${course.title} with ${course.instructor}`}
                  >
                    Enroll Now
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </EduLayout>
  );
}
