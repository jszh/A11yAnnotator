import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Clock, Play, Users, Award, BookOpen, Video } from "lucide-react";

const calendarDays = [
  { day: 3, label: "Live Session", type: "session" },
  { day: 5, label: "Quiz Due", type: "assignment" },
  { day: 7, label: "Assignment Due", type: "assignment" },
  { day: 10, label: "Live Session", type: "session" },
  { day: 12, label: "Peer Review", type: "assignment" },
];

const cohortMembers = [
  { initials: "SM", name: "Sarah M." },
  { initials: "JW", name: "James W." },
  { initials: "PK", name: "Priya K." },
  { initials: "AL", name: "Andre L." },
  { initials: "TR", name: "Tina R." },
];

const EduDashboard = () => (
  <div className="bg-background min-h-screen">
    {/* Welcome bar */}
    <div className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Welcome back, Sarah 👋</p>
        <h1 className="font-display text-2xl font-bold text-foreground mt-1">
          Medical Admin Certificate — Week 3 of 8
        </h1>
        <div className="mt-3 h-2.5 rounded-full bg-secondary overflow-hidden max-w-md">
          <div className="h-full rounded-full bg-edu-emerald transition-all" style={{ width: "37.5%" }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">37.5% complete · Projected completion: April 18, 2026</p>
      </div>
    </div>

    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Session */}
          <div className="rounded-xl border border-edu-coral/30 bg-edu-coral/5 p-5">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
              <Video className="h-4 w-4 text-edu-coral" /> Upcoming Live Session
            </h2>
            <p className="font-display text-lg font-bold text-foreground">Medical Billing: Insurance Claims Deep Dive</p>
            <p className="text-sm text-muted-foreground mt-1">Wednesday, March 5 · 7:00–8:30 PM ET · Dr. Rachel Kim</p>
            <div className="mt-4 flex gap-3">
              <Button variant="emerald" size="sm" asChild>
                <Link to="/edu-portal/study"><Play className="h-3.5 w-3.5 mr-1" /> Join Session</Link>
              </Button>
              <Button variant="outline" size="sm">Add to Calendar</Button>
            </div>
          </div>

          {/* Mini Calendar */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-edu-navy" /> March 2026
            </h2>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="py-1 font-medium text-muted-foreground">{d}</div>
              ))}
              {/* March 2026 starts on Sunday */}
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                const event = calendarDays.find((e) => e.day === day);
                return (
                  <div
                    key={day}
                    className={`relative rounded-md py-2 text-sm ${
                      day === 3 ? "bg-edu-coral/10 text-edu-coral font-semibold" :
                      event?.type === "assignment" ? "bg-edu-gold/10 text-edu-gold font-semibold" :
                      event?.type === "session" ? "bg-edu-emerald/10 text-edu-emerald font-semibold" :
                      "text-foreground"
                    }`}
                    title={event?.label}
                  >
                    {day}
                    {event && <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full ${
                      event.type === "session" ? "bg-edu-coral" : "bg-edu-gold"
                    }`} />}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-edu-coral" /> Live Session</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-edu-gold" /> Assignment Due</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/edu-portal/study"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 hover:border-edu-gold/40 transition-colors"
            >
              <BookOpen className="h-8 w-8 text-edu-navy" />
              <div>
                <p className="font-semibold text-foreground text-sm">Continue Learning</p>
                <p className="text-xs text-muted-foreground">Week 3: Medical Billing Fundamentals</p>
              </div>
            </Link>
            <Link
              to="/edu-portal/courses/medical-admin"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 hover:border-edu-gold/40 transition-colors"
            >
              <Award className="h-8 w-8 text-edu-gold" />
              <div>
                <p className="font-semibold text-foreground text-sm">View Program Details</p>
                <p className="text-xs text-muted-foreground">Syllabus, instructor, outcomes</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Certificate Preview */}
          <div className="rounded-xl border border-edu-gold/30 bg-edu-gold/5 p-5 text-center">
            <Award className="h-12 w-12 text-edu-gold mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold text-foreground">Certificate Preview</h3>
            <p className="text-sm text-muted-foreground mt-1">Medical Administrative Assistant</p>
            <p className="text-xs text-muted-foreground mt-2">Projected completion: <span className="font-semibold text-foreground">April 18, 2026</span></p>
            <div className="mt-4 rounded-lg border border-edu-gold/20 bg-card p-3">
              <p className="font-display text-xs font-semibold text-foreground">CERTIFICATE OF COMPLETION</p>
              <p className="text-[10px] text-muted-foreground mt-1">Awarded to Sarah Martinez</p>
              <p className="text-[10px] text-muted-foreground">Medical Administrative Assistant</p>
              <p className="text-[10px] text-edu-gold mt-1">SkillForge · 2026</p>
            </div>
          </div>

          {/* Cohort */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-edu-navy" /> Your Cohort
            </h3>
            <div className="space-y-3">
              {cohortMembers.map((m) => (
                <div key={m.initials} className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-edu-navy flex items-center justify-center text-xs font-medium text-edu-gold">{m.initials}</div>
                  <span className="text-sm text-foreground">{m.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">+ 13 more learners</p>
          </div>

          {/* Office Hours */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-edu-navy" /> Instructor Office Hours
            </h3>
            <p className="text-sm text-muted-foreground">Dr. Rachel Kim</p>
            <p className="text-sm text-muted-foreground">Thursdays 4–5 PM ET</p>
            <Button variant="outline" size="sm" className="mt-3 w-full">Book a Slot</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default EduDashboard;
