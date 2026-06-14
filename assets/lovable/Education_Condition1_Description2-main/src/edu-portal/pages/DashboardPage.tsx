import { Link } from "react-router-dom";
import { Calendar, Clock, Users, Award, Video, BookOpen, ChevronRight } from "lucide-react";
import Layout from "../components/Layout";

const upcomingDates = [
  { date: "Mar 5", label: "Live Session: Medical Billing", type: "session" },
  { date: "Mar 7", label: "CMS-1500 Exercise Due", type: "assignment" },
  { date: "Mar 10", label: "ICD-10 Worksheet Due", type: "assignment" },
  { date: "Mar 12", label: "Live Session: Claims Processing", type: "session" },
];

const cohortMembers = [
  { initials: "MS", name: "Maria S." },
  { initials: "JT", name: "James T." },
  { initials: "PK", name: "Priya K." },
  { initials: "AL", name: "Amir L." },
  { initials: "RN", name: "Rosa N." },
];

export default function DashboardPage() {
  return (
    <Layout>
      {/* Dashboard Header */}
      <section className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground mb-1">Welcome back, Maria</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Your Program: Medical Admin Certificate — Week 3 of 8</h1>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Overall Progress</span>
                <span>37.5% complete</span>
              </div>
              <div className="w-full bg-edu-navy-light rounded-full h-3" role="progressbar" aria-valuenow={37.5} aria-valuemin={0} aria-valuemax={100} aria-label="Program progress">
                <div className="bg-accent h-3 rounded-full transition-all" style={{ width: "37.5%" }} />
              </div>
            </div>
            <Link to="/edu-portal/study" className="bg-accent text-accent-foreground px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              Go to Classroom
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Next Live Session */}
            <section className="bg-card border border-border rounded-xl p-6" aria-labelledby="next-session">
              <h2 id="next-session" className="font-bold text-card-foreground mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-accent" aria-hidden="true" /> Upcoming Live Session
              </h2>
              <div className="bg-edu-warm-bg rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-foreground">Medical Billing Workshop</h3>
                  <p className="text-sm text-muted-foreground">Wednesday, March 5 · 6:00 – 8:00 PM ET</p>
                  <p className="text-sm text-muted-foreground">with Dr. Linda Chen</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="bg-accent/20 text-accent px-3 py-1 rounded text-sm font-bold">
                    <Clock className="w-3 h-3 inline mr-1" aria-hidden="true" />Starts in 2 days
                  </div>
                  <button className="bg-accent text-accent-foreground px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    Join Session
                  </button>
                </div>
              </div>
            </section>

            {/* Calendar */}
            <section className="bg-card border border-border rounded-xl p-6" aria-labelledby="calendar-heading">
              <h2 id="calendar-heading" className="font-bold text-card-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-edu-teal" aria-hidden="true" /> Upcoming Dates
              </h2>
              <div className="space-y-3">
                {upcomingDates.map((d) => (
                  <div key={d.label} className="flex items-center gap-3">
                    <div className={`text-xs font-bold px-2 py-1 rounded w-14 text-center ${
                      d.type === "session" ? "bg-accent/20 text-accent" : "bg-edu-teal-light text-edu-teal"
                    }`}>{d.date}</div>
                    <span className="text-sm text-card-foreground">{d.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ml-auto ${
                      d.type === "session" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                    }`}>{d.type === "session" ? "Live" : "Due"}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Certificate Preview */}
            <section className="bg-card border border-border rounded-xl p-6" aria-labelledby="cert-heading">
              <h2 id="cert-heading" className="font-bold text-card-foreground mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" aria-hidden="true" /> Certificate Preview
              </h2>
              <div className="border-2 border-dashed border-accent/30 rounded-xl p-8 text-center bg-edu-warm-bg">
                <Award className="w-12 h-12 text-accent mx-auto mb-3" aria-hidden="true" />
                <h3 className="font-display text-lg font-bold text-foreground">Medical Administrative Assistant</h3>
                <p className="text-sm text-muted-foreground">SkillForge Certificate of Completion</p>
                <p className="text-sm text-muted-foreground mt-1">Awarded to: Maria S.</p>
                <div className="mt-4 inline-block bg-accent/20 text-accent px-4 py-2 rounded-lg text-sm font-bold">
                  Projected Completion: April 18, 2026
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Cohort */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold text-card-foreground mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-edu-teal" aria-hidden="true" /> Your Cohort
              </h3>
              <ul className="space-y-2">
                {cohortMembers.map((m) => (
                  <li key={m.initials} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-edu-teal text-primary-foreground text-xs font-bold flex items-center justify-center">{m.initials}</div>
                    <span className="text-sm text-card-foreground">{m.name}</span>
                  </li>
                ))}
                <li className="text-xs text-muted-foreground mt-1">+ 7 more members</li>
              </ul>
            </div>

            {/* Office Hours */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold text-card-foreground mb-3">Instructor Office Hours</h3>
              <p className="text-sm text-muted-foreground mb-3">Dr. Linda Chen is available for 1-on-1 sessions.</p>
              <button className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-bold text-sm hover:bg-edu-navy-light transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                Book Office Hours
              </button>
            </div>

            {/* Quick Links */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold text-card-foreground mb-3">Quick Links</h3>
              <nav aria-label="Quick links">
                <ul className="space-y-2">
                  {[
                    { to: "/edu-portal/study", label: "Go to Classroom" },
                    { to: "/edu-portal/courses/medical-admin", label: "Program Details" },
                    { to: "/edu-portal/pricing", label: "Financing & Payments" },
                  ].map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="flex items-center justify-between text-sm text-edu-teal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded py-1">
                        {link.label}
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
