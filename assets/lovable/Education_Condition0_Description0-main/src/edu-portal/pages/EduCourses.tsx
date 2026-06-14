import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, DollarSign, Award, Filter } from "lucide-react";
import { useState } from "react";

const courses = [
  { id: "medical-admin", title: "Medical Administrative Assistant Certificate", field: "Healthcare", format: "Cohort", duration: "8 weeks", hours: 120, cost: 349, nextStart: "Mar 3, 2026", credential: "Certificate" },
  { id: "comptia-it", title: "CompTIA IT Fundamentals+", field: "IT", format: "Self-Paced", duration: "6 weeks", hours: 80, cost: 299, nextStart: "Anytime", credential: "Certificate" },
  { id: "bookkeeping", title: "Professional Bookkeeping", field: "Business", format: "Cohort", duration: "10 weeks", hours: 150, cost: 449, nextStart: "Mar 10, 2026", credential: "Certificate" },
  { id: "phlebotomy", title: "Phlebotomy Technician Prep", field: "Healthcare", format: "Live Online", duration: "4 weeks", hours: 60, cost: 199, nextStart: "Mar 17, 2026", credential: "Badge" },
  { id: "hvac-basics", title: "HVAC Fundamentals", field: "Trades", format: "Cohort", duration: "12 weeks", hours: 180, cost: 599, nextStart: "Apr 7, 2026", credential: "Certificate" },
  { id: "medical-billing", title: "Medical Billing & Coding", field: "Healthcare", format: "Self-Paced", duration: "10 weeks", hours: 140, cost: 499, nextStart: "Anytime", credential: "Certificate" },
  { id: "project-mgmt", title: "Project Management Essentials", field: "Business", format: "Live Online", duration: "6 weeks", hours: 90, cost: 349, nextStart: "Mar 24, 2026", credential: "Badge" },
  { id: "cybersecurity", title: "Cybersecurity Foundations", field: "IT", format: "Cohort", duration: "8 weeks", hours: 120, cost: 449, nextStart: "Apr 1, 2026", credential: "Certificate" },
];

const fields = ["All", "Healthcare", "IT", "Business", "Trades"];
const formats = ["All", "Self-Paced", "Cohort", "Live Online"];

const formatColor: Record<string, string> = {
  "Self-Paced": "bg-edu-emerald/10 text-edu-emerald",
  Cohort: "bg-edu-gold/10 text-edu-gold",
  "Live Online": "bg-edu-coral/10 text-edu-coral",
};

const EduCourses = () => {
  const [field, setField] = useState("All");
  const [format, setFormat] = useState("All");

  const filtered = courses.filter(
    (c) => (field === "All" || c.field === field) && (format === "All" || c.format === format)
  );

  return (
    <div className="bg-background">
      {/* Header */}
      <section className="bg-primary py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl">Browse Programs</h1>
          <p className="mt-3 text-primary-foreground/70 max-w-2xl">
            Industry-recognized certificates and credentials. Filter by career field, format, or start date.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-2">
            {fields.map((f) => (
              <button
                key={f}
                onClick={() => setField(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  field === f ? "bg-edu-navy text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="text-border">|</span>
          <div className="flex flex-wrap gap-2">
            {formats.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  format === f ? "bg-edu-navy text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Course grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((course) => (
            <Link
              key={course.id}
              to={`/edu-portal/courses/${course.id}`}
              className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-edu-gold/40 hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${formatColor[course.format]}`}>
                  {course.format}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Award className="h-3 w-3" /> {course.credential}
                </span>
              </div>
              <h3 className="font-display text-base font-semibold text-foreground leading-snug group-hover:text-edu-navy-light flex-1">
                {course.title}
              </h3>
              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Next: {course.nextStart}</div>
                <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {course.duration} · {course.hours} hours</div>
                <div className="flex items-center gap-1.5"><DollarSign className="h-3 w-3" /> ${course.cost}</div>
              </div>
              <Button variant="hero" size="sm" className="mt-4 w-full">
                Enroll Now
              </Button>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No programs match your filters.</p>
            <button onClick={() => { setField("All"); setFormat("All"); }} className="mt-3 text-edu-gold hover:underline text-sm">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EduCourses;
