import { EduLayout } from "@/components/edu-portal/EduLayout";
import {
  Play, Clock, FileText, MessageSquare, BookOpen, ChevronRight,
  CheckCircle2, Circle, Upload, ExternalLink, CalendarDays
} from "lucide-react";
import { useState } from "react";

const weeklyModules = [
  { week: 1, title: "Healthcare Systems Overview", completed: true },
  { week: 2, title: "Medical Terminology Essentials", completed: true },
  { week: 3, title: "Medical Billing Fundamentals", completed: false, current: true },
  { week: 4, title: "Insurance & Claims Processing", completed: false },
  { week: 5, title: "Patient Scheduling & Flow", completed: false },
  { week: 6, title: "HIPAA & Compliance", completed: false },
  { week: 7, title: "Office Technology & Software", completed: false },
  { week: 8, title: "Capstone & Career Prep", completed: false },
];

const resources = [
  { title: "Week 3 Slides: Billing Fundamentals", type: "PDF", icon: FileText },
  { title: "ICD-10 Code Reference Sheet", type: "PDF", icon: FileText },
  { title: "CPT Coding Practice Worksheet", type: "DOCX", icon: FileText },
  { title: "Recorded Session: Claims Overview", type: "Video", icon: Play },
];

const discussions = [
  { author: "Maria G.", time: "2h ago", message: "Does anyone know if the coding practice quiz counts toward our final grade?" },
  { author: "James C.", time: "5h ago", message: "Great tip from Dr. Mitchell today about organizing claim denials by category." },
  { author: "Aisha W.", time: "1d ago", message: "I found a helpful ICD-10 lookup tool - sharing the link in resources." },
];

const assignments = [
  { title: "ICD-10 Coding Practice Set A", due: "Mar 7, 2026", status: "submitted" as const },
  { title: "Claims Processing Simulation", due: "Mar 10, 2026", status: "pending" as const },
  { title: "Week 3 Reflection Journal", due: "Mar 12, 2026", status: "pending" as const },
];

export default function EduStudyPage() {
  const [activeTab, setActiveTab] = useState<"agenda" | "resources" | "discussions">("agenda");

  return (
    <EduLayout title="Study Room — Medical Billing Fundamentals">
      {/* Progress header */}
      <section className="bg-edu-navy py-6" aria-labelledby="study-heading">
        <div className="container mx-auto px-4 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-edu-amber mb-1">Medical Administrative Assistant Certificate</p>
          <h1 id="study-heading" className="text-2xl font-bold text-primary-foreground lg:text-3xl">
            Week 3 of 8 — Medical Billing Fundamentals
          </h1>
          {/* Progress bar */}
          <div className="mt-4 max-w-md">
            <div className="flex justify-between text-xs text-primary-foreground/60 mb-1">
              <span>Progress</span>
              <span>37.5% complete</span>
            </div>
            <div className="h-2 rounded-full bg-primary-foreground/10" role="progressbar" aria-valuenow={37.5} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress: 37.5% complete">
              <div className="h-2 rounded-full bg-edu-amber transition-all" style={{ width: "37.5%" }} />
            </div>
          </div>
        </div>
      </section>

      {/* Live session countdown */}
      <section className="border-b border-border bg-edu-surface-alt py-4" aria-label="Upcoming live session">
        <div className="container mx-auto px-4 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-edu-teal text-primary-foreground">
              <Play className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Next Live Session: Claims Processing Deep Dive</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" /> Tomorrow, Mar 5 · 7:00 PM ET · Starts in 23h 42m
              </p>
            </div>
          </div>
          <button className="rounded-lg bg-edu-teal px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
            Join Session
          </button>
        </div>
      </section>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar: Weekly agenda */}
          <nav className="lg:col-span-1 order-2 lg:order-1" aria-label="Weekly modules">
            <h2 className="font-body text-sm font-semibold text-foreground mb-3">Weekly Modules</h2>
            <ul className="space-y-1" role="list">
              {weeklyModules.map((m) => (
                <li key={m.week}>
                  <button
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      m.current
                        ? "bg-edu-navy text-primary-foreground font-medium"
                        : "hover:bg-muted text-foreground"
                    }`}
                    aria-label={`Week ${m.week}: ${m.title}${m.completed ? " — Completed" : ""}${m.current ? " — Current week" : ""}`}
                    aria-current={m.current ? "step" : undefined}
                  >
                    {m.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-edu-success shrink-0" aria-hidden="true" />
                    ) : (
                      <Circle className={`h-4 w-4 shrink-0 ${m.current ? "text-edu-amber" : "text-muted-foreground/40"}`} aria-hidden="true" />
                    )}
                    <span className="truncate">W{m.week}: {m.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Main content area */}
          <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Study room tabs">
              {(["agenda", "resources", "discussions"] as const).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 ${
                    activeTab === tab
                      ? "border-edu-navy text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div role="tabpanel" aria-label={`${activeTab} panel`}>
              {activeTab === "agenda" && (
                <div className="space-y-6">
                  {/* Assignments */}
                  <section aria-labelledby="assignments-heading">
                    <h2 id="assignments-heading" className="font-body text-lg font-semibold text-foreground mb-3">Assignments</h2>
                    <div className="space-y-2">
                      {assignments.map((a) => (
                        <div key={a.title} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                          <div className="flex items-center gap-3">
                            {a.status === "submitted" ? (
                              <CheckCircle2 className="h-5 w-5 text-edu-success" aria-label="Submitted" />
                            ) : (
                              <Upload className="h-5 w-5 text-muted-foreground" aria-label="Pending submission" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-foreground">{a.title}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" aria-hidden="true" /> Due {a.due}
                              </p>
                            </div>
                          </div>
                          {a.status === "pending" && (
                            <button className="rounded-lg bg-edu-navy px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                              Submit
                            </button>
                          )}
                          {a.status === "submitted" && (
                            <span className="text-xs font-medium text-edu-success">Submitted</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* This week's goals */}
                  <section aria-labelledby="goals-heading">
                    <h2 id="goals-heading" className="font-body text-lg font-semibold text-foreground mb-3">This Week's Goals</h2>
                    <ul className="space-y-2 text-sm text-foreground" role="list">
                      {["Understand ICD-10 coding structure", "Practice CPT code assignment", "Complete claims processing simulation", "Attend live Q&A session"].map((g) => (
                        <li key={g} className="flex items-center gap-2.5">
                          <ChevronRight className="h-4 w-4 text-edu-teal shrink-0" aria-hidden="true" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              )}

              {activeTab === "resources" && (
                <section aria-labelledby="resources-heading">
                  <h2 id="resources-heading" className="sr-only">Resources</h2>
                  <div className="space-y-2">
                    {resources.map((r) => (
                      <div key={r.title} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                        <div className="flex items-center gap-3">
                          <r.icon className="h-5 w-5 text-edu-amber" aria-hidden="true" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{r.title}</p>
                            <p className="text-xs text-muted-foreground">{r.type}</p>
                          </div>
                        </div>
                        <button className="flex items-center gap-1 text-xs font-medium text-edu-teal hover:text-edu-navy transition-colors" aria-label={`Open ${r.title}`}>
                          Open <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === "discussions" && (
                <section aria-labelledby="discussion-heading">
                  <h2 id="discussion-heading" className="sr-only">Peer Discussions</h2>
                  <div className="space-y-3">
                    {discussions.map((d, i) => (
                      <article key={i} className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-7 w-7 rounded-full bg-edu-navy-light flex items-center justify-center text-primary-foreground text-xs font-bold" aria-hidden="true">
                            {d.author[0]}
                          </div>
                          <span className="text-sm font-medium text-foreground">{d.author}</span>
                          <span className="text-xs text-muted-foreground">· {d.time}</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{d.message}</p>
                        <button className="mt-2 text-xs font-medium text-edu-teal hover:text-edu-navy transition-colors flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> Reply
                        </button>
                      </article>
                    ))}
                    <div className="mt-4">
                      <label htmlFor="new-post" className="text-sm font-medium text-foreground block mb-1.5">Post a message</label>
                      <textarea
                        id="new-post"
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-edu-navy resize-none"
                        rows={3}
                        placeholder="Share a question or insight with your cohort..."
                      />
                      <button className="mt-2 rounded-lg bg-edu-navy px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                        Post
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </EduLayout>
  );
}
