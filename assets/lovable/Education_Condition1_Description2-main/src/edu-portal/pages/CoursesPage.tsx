import { Link } from "react-router-dom";
import { Clock, Users, Calendar, DollarSign, Filter } from "lucide-react";
import { useState } from "react";
import Layout from "../components/Layout";

type Course = {
  id: string; title: string; field: string; format: string; duration: string; hours: number; cost: string; costValue: number; nextStart: string; credential: string;
};

const courses: Course[] = [
  { id: "medical-admin", title: "Medical Administrative Assistant Certificate", field: "Healthcare Support", format: "Cohort", duration: "8 weeks", hours: 120, cost: "$349", costValue: 349, nextStart: "March 3, 2026", credential: "Certificate" },
  { id: "it-helpdesk", title: "IT Help Desk Technician", field: "IT & Cybersecurity", format: "Self-Paced", duration: "10 weeks", hours: 150, cost: "$449", costValue: 449, nextStart: "Anytime", credential: "Certificate" },
  { id: "phlebotomy", title: "Phlebotomy Technician", field: "Healthcare Support", format: "Cohort", duration: "6 weeks", hours: 80, cost: "$299", costValue: 299, nextStart: "March 10, 2026", credential: "Certificate" },
  { id: "bookkeeping", title: "Bookkeeping & Payroll Specialist", field: "Business Administration", format: "Self-Paced", duration: "12 weeks", hours: 160, cost: "$499", costValue: 499, nextStart: "Anytime", credential: "Certificate" },
  { id: "cybersecurity", title: "Cybersecurity Fundamentals", field: "IT & Cybersecurity", format: "Live Online", duration: "8 weeks", hours: 100, cost: "$549", costValue: 549, nextStart: "April 7, 2026", credential: "Badge" },
  { id: "hvac", title: "HVAC Basics & EPA Certification Prep", field: "Skilled Trades", format: "Cohort", duration: "10 weeks", hours: 140, cost: "$599", costValue: 599, nextStart: "March 17, 2026", credential: "Certificate" },
  { id: "medical-billing", title: "Medical Billing & Coding", field: "Healthcare Support", format: "Self-Paced", duration: "14 weeks", hours: 200, cost: "$649", costValue: 649, nextStart: "Anytime", credential: "Certificate" },
  { id: "project-mgmt", title: "Project Management Essentials", field: "Business Administration", format: "Live Online", duration: "6 weeks", hours: 72, cost: "$399", costValue: 399, nextStart: "March 24, 2026", credential: "Badge" },
  { id: "electrical", title: "Electrical Apprentice Prep", field: "Skilled Trades", format: "Cohort", duration: "12 weeks", hours: 180, cost: "$699", costValue: 699, nextStart: "April 14, 2026", credential: "Certificate" },
];

const fields = ["All", "Healthcare Support", "IT & Cybersecurity", "Skilled Trades", "Business Administration"];
const formats = ["All", "Self-Paced", "Cohort", "Live Online"];

const formatColors: Record<string, string> = {
  "Cohort": "bg-edu-teal-light text-edu-teal",
  "Self-Paced": "bg-edu-amber-light text-amber-700",
  "Live Online": "bg-blue-50 text-blue-700",
};

export default function CoursesPage() {
  const [field, setField] = useState("All");
  const [format, setFormat] = useState("All");

  const filtered = courses.filter((c) => (field === "All" || c.field === field) && (format === "All" || c.format === format));

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Browse Programs</h1>
          <p className="text-muted-foreground">Find the right certification for your career goals.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 items-end" role="search" aria-label="Course filters">
          <div>
            <label htmlFor="field-filter" className="block text-sm font-medium text-foreground mb-1">Career Field</label>
            <select id="field-filter" value={field} onChange={(e) => setField(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-card text-card-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {fields.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="format-filter" className="block text-sm font-medium text-foreground mb-1">Format</label>
            <select id="format-filter" value={format} onChange={(e) => setFormat(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-card text-card-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {formats.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <span className="text-sm text-muted-foreground py-2">{filtered.length} program{filtered.length !== 1 ? "s" : ""} found</span>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <article key={course.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${formatColors[course.format] || "bg-muted text-muted-foreground"}`}>{course.format}</span>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">{course.credential}</span>
                </div>
                <h2 className="font-bold text-lg text-card-foreground mb-3 group-hover:text-edu-teal transition-colors">{course.title}</h2>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" aria-hidden="true" /> Next: {course.nextStart}</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" aria-hidden="true" /> {course.duration} · {course.hours} hours</div>
                  <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" aria-hidden="true" /> {course.cost}</div>
                </div>
                <Link
                  to={`/edu-portal/courses/${course.id}`}
                  className="mt-4 block text-center bg-accent text-accent-foreground py-2.5 rounded-lg font-bold text-sm hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Enroll Now
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}
