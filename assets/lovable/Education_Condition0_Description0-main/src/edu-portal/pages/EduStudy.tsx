import { Button } from "@/components/ui/button";
import { Clock, Play, Upload, MessageSquare, FileText, CheckCircle2, BookOpen, Users } from "lucide-react";

const modules = [
  { week: 1, title: "Healthcare Administration Intro", status: "complete" },
  { week: 2, title: "Medical Terminology", status: "complete" },
  { week: 3, title: "Medical Billing Fundamentals", status: "current" },
  { week: 4, title: "Medical Coding (ICD-10)", status: "locked" },
  { week: 5, title: "Electronic Health Records", status: "locked" },
  { week: 6, title: "Office Management", status: "locked" },
  { week: 7, title: "Patient Communication", status: "locked" },
  { week: 8, title: "Capstone & Certification Prep", status: "locked" },
];

const assignments = [
  { title: "Insurance Claim Form Exercise", due: "Mar 7", status: "submitted" },
  { title: "CPT Code Lookup Worksheet", due: "Mar 10", status: "pending" },
  { title: "Week 3 Quiz", due: "Mar 12", status: "pending" },
];

const resources = [
  { name: "Week 3 Lecture Slides", type: "PDF", icon: FileText },
  { name: "Medical Billing Worksheet", type: "XLSX", icon: FileText },
  { name: "Insurance Types Reading", type: "Link", icon: BookOpen },
  { name: "CPT Code Reference Guide", type: "PDF", icon: FileText },
];

const discussions = [
  { author: "Sarah M.", time: "2h ago", text: "Has anyone found a good mnemonic for the CPT modifier codes?" },
  { author: "James W.", time: "5h ago", text: "The insurance claim form exercise was tricky — tip: double-check the provider NPI field." },
  { author: "Dr. Kim", time: "1d ago", text: "Great discussion! Remember, Wednesday's live session will cover the most commonly tested billing scenarios." },
];

const EduStudy = () => (
  <div className="bg-background min-h-screen">
    {/* Top bar */}
    <div className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Medical Admin Certificate</p>
          <h1 className="font-display text-xl font-bold text-foreground">
            Week 3 of 8 — Medical Billing Fundamentals
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Next Live Session</p>
            <p className="text-sm font-semibold text-edu-coral flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Wed, Mar 5 · 7:00 PM ET</p>
          </div>
          <Button variant="emerald" size="sm">
            <Play className="h-3.5 w-3.5 mr-1" /> Join Session
          </Button>
        </div>
      </div>
    </div>

    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar — Weekly Agenda */}
        <div className="lg:col-span-1">
          <h2 className="font-semibold text-foreground text-sm mb-3">Weekly Agenda</h2>
          <div className="space-y-1">
            {modules.map((m) => (
              <div
                key={m.week}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  m.status === "current"
                    ? "bg-edu-gold/10 text-foreground font-medium border border-edu-gold/30"
                    : m.status === "complete"
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                {m.status === "complete" ? (
                  <CheckCircle2 className="h-4 w-4 text-edu-emerald shrink-0" />
                ) : m.status === "current" ? (
                  <Play className="h-4 w-4 text-edu-gold shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-border shrink-0" />
                )}
                <span className="truncate">W{m.week}: {m.title}</span>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="mt-6 rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Overall Progress</p>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-edu-emerald" style={{ width: "31%" }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">31% complete · 5 weeks remaining</p>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Countdown + Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-edu-coral/30 bg-edu-coral/5 p-5">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-edu-coral" /> Live Session Countdown
              </h3>
              <div className="flex gap-4">
                {[{ label: "Days", value: "2" }, { label: "Hours", value: "14" }, { label: "Min", value: "32" }].map((t) => (
                  <div key={t.label} className="text-center">
                    <p className="font-display text-2xl font-bold text-foreground">{t.value}</p>
                    <p className="text-xs text-muted-foreground">{t.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-edu-navy" /> Your Cohort
              </h3>
              <div className="flex -space-x-2 mb-2">
                {["SM", "JW", "PK", "AL", "TR", "MN"].map((initials) => (
                  <div key={initials} className="h-8 w-8 rounded-full bg-edu-navy flex items-center justify-center text-xs font-medium text-edu-gold border-2 border-card">
                    {initials}
                  </div>
                ))}
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground border-2 border-card">
                  +12
                </div>
              </div>
              <p className="text-xs text-muted-foreground">18 learners in your cohort</p>
            </div>
          </div>

          {/* Assignments */}
          <section>
            <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-edu-navy" /> Assignments
            </h2>
            <div className="space-y-3">
              {assignments.map((a) => (
                <div key={a.title} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">Due: {a.due}</p>
                  </div>
                  {a.status === "submitted" ? (
                    <span className="rounded-full bg-edu-emerald/10 px-2.5 py-0.5 text-xs font-medium text-edu-emerald">Submitted</span>
                  ) : (
                    <Button variant="outline" size="sm">Submit</Button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Resources */}
          <section>
            <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-edu-navy" /> Resources
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {resources.map((r) => (
                <div key={r.name} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:border-edu-gold/30 transition-colors cursor-pointer">
                  <r.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Discussion */}
          <section>
            <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-edu-navy" /> Module Discussion
            </h2>
            <div className="space-y-4">
              {discussions.map((d, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-7 w-7 rounded-full bg-edu-navy flex items-center justify-center text-xs font-medium text-edu-gold">
                      {d.author.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="text-sm font-medium text-foreground">{d.author}</span>
                    <span className="text-xs text-muted-foreground">· {d.time}</span>
                  </div>
                  <p className="text-sm text-foreground/80">{d.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Join the discussion..."
                className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button variant="default" size="sm">Post</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
);

export default EduStudy;
