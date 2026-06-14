import { EduLayout } from "@/components/edu-portal/EduLayout";
import {
  Play, CalendarDays, Clock, Users, Award, BookOpen,
  ChevronRight, Video, FileText
} from "lucide-react";
import { Link } from "react-router-dom";

const upcomingDates = [
  { day: "5", month: "Mar", title: "Live Session: Claims Processing", time: "7:00 PM ET" },
  { day: "7", month: "Mar", title: "Assignment Due: ICD-10 Practice Set B", time: "11:59 PM ET" },
  { day: "10", month: "Mar", title: "Assignment Due: Claims Simulation", time: "11:59 PM ET" },
  { day: "12", month: "Mar", title: "Live Session: Insurance Payer Types", time: "7:00 PM ET" },
];

const cohortMembers = [
  { name: "Maria G.", initials: "MG" },
  { name: "James C.", initials: "JC" },
  { name: "Aisha W.", initials: "AW" },
  { name: "David L.", initials: "DL" },
  { name: "Sofia R.", initials: "SR" },
  { name: "Tyler B.", initials: "TB" },
];

export default function EduDashboardPage() {
  return (
    <EduLayout title="Dashboard">
      {/* Greeting banner */}
      <section className="bg-edu-navy py-8" aria-labelledby="dash-heading">
        <div className="container mx-auto px-4 lg:px-8">
          <p className="text-sm text-edu-amber font-medium mb-1">Welcome back, Maria!</p>
          <h1 id="dash-heading" className="text-2xl font-bold text-primary-foreground lg:text-3xl">
            Your Program: Medical Admin Certificate
          </h1>
          <p className="mt-1 text-primary-foreground/60 text-sm">Week 3 of 8 — Medical Billing Fundamentals</p>
          {/* Progress */}
          <div className="mt-4 max-w-md">
            <div className="flex justify-between text-xs text-primary-foreground/50 mb-1">
              <span>Overall progress</span>
              <span>37.5%</span>
            </div>
            <div className="h-2.5 rounded-full bg-primary-foreground/10" role="progressbar" aria-valuenow={37.5} aria-valuemin={0} aria-valuemax={100} aria-label="Program progress: 37.5% complete">
              <div className="h-2.5 rounded-full bg-edu-amber" style={{ width: "37.5%" }} />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content — in-progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live session reminder */}
            <section className="rounded-xl border border-edu-amber/30 bg-edu-surface-alt p-5" aria-labelledby="live-heading" role="region">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-edu-teal text-primary-foreground">
                    <Video className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 id="live-heading" className="font-body font-semibold text-foreground text-sm">Upcoming Live Session</h2>
                    <p className="text-xs text-muted-foreground">Claims Processing Deep Dive · Tomorrow, Mar 5 · 7:00 PM ET</p>
                  </div>
                </div>
                <button className="rounded-lg bg-edu-teal px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                  Join Session
                </button>
              </div>
            </section>

            {/* Mini calendar */}
            <section aria-labelledby="calendar-heading" role="region">
              <h2 id="calendar-heading" className="font-body text-lg font-semibold text-foreground mb-3">Upcoming Dates</h2>
              <div className="space-y-2">
                {upcomingDates.map((d, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
                    <div className="text-center min-w-[40px]">
                      <p className="text-lg font-bold text-foreground leading-none">{d.day}</p>
                      <p className="text-xs text-muted-foreground">{d.month}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{d.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" /> {d.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recommended */}
            <section aria-labelledby="recommended-heading" role="region">
              <h2 id="recommended-heading" className="font-body text-lg font-semibold text-foreground mb-3">Recommended Next</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { title: "Medical Billing & Coding Specialist", duration: "12 weeks", icon: FileText },
                  { title: "Healthcare Office Management", duration: "10 weeks", icon: BookOpen },
                ].map((r) => (
                  <Link
                    key={r.title}
                    to="/edu-portal/courses"
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow group"
                    aria-label={`Explore ${r.title}, ${r.duration} program`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-edu-navy text-primary-foreground shrink-0">
                      <r.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.duration}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-edu-amber transition-colors shrink-0" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6" aria-label="Dashboard sidebar">
            {/* Certificate preview */}
            <section className="rounded-xl border border-border bg-card p-5 text-center" aria-labelledby="cert-heading" role="region">
              <Award className="h-10 w-10 text-edu-amber mx-auto mb-2" aria-hidden="true" />
              <h2 id="cert-heading" className="font-body font-semibold text-foreground text-sm">Certificate Preview</h2>
              <p className="text-xs text-muted-foreground mt-1">Medical Administrative Assistant</p>
              <div className="mt-3 rounded-lg border border-dashed border-edu-amber/40 bg-edu-surface-alt p-4">
                <p className="text-xs text-muted-foreground">Projected completion</p>
                <p className="text-lg font-bold text-foreground">April 18, 2026</p>
              </div>
            </section>

            {/* Cohort */}
            <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="cohort-heading" role="region">
              <h2 id="cohort-heading" className="font-body font-semibold text-foreground text-sm mb-3">
                <Users className="h-4 w-4 inline mr-1 text-edu-teal" aria-hidden="true" />
                Your Cohort
              </h2>
              <div className="flex flex-wrap gap-2">
                {cohortMembers.map((m) => (
                  <div
                    key={m.initials}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-edu-navy text-primary-foreground text-xs font-bold"
                    title={m.name}
                    aria-label={m.name}
                  >
                    {m.initials}
                  </div>
                ))}
              </div>
            </section>

            {/* Office hours */}
            <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="office-heading" role="region">
              <h2 id="office-heading" className="font-body font-semibold text-foreground text-sm mb-2">Instructor Office Hours</h2>
              <p className="text-xs text-muted-foreground mb-3">Dr. Sarah Mitchell · Tues & Thurs 4–5 PM ET</p>
              <button className="w-full rounded-lg bg-edu-navy py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                Book a Slot
              </button>
            </section>

            {/* Quick links */}
            <section className="rounded-xl border border-border bg-card p-5" role="region" aria-label="Quick links">
              <h2 className="font-body font-semibold text-foreground text-sm mb-3">Quick Links</h2>
              <div className="space-y-1.5">
                <Link to="/edu-portal/study" className="flex items-center gap-2 text-sm text-edu-teal hover:text-edu-navy transition-colors">
                  <Play className="h-4 w-4" aria-hidden="true" /> Go to Study Room
                </Link>
                <Link to="/edu-portal/courses" className="flex items-center gap-2 text-sm text-edu-teal hover:text-edu-navy transition-colors">
                  <BookOpen className="h-4 w-4" aria-hidden="true" /> Browse More Programs
                </Link>
                <Link to="/edu-portal/pricing" className="flex items-center gap-2 text-sm text-edu-teal hover:text-edu-navy transition-colors">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" /> Financial Aid Info
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </EduLayout>
  );
}
