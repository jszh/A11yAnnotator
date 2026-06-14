import { Link } from "react-router-dom";
import { EduLayout } from "@/components/edu-portal/EduLayout";
import {
  ArrowLeft, Clock, Users, DollarSign, Calendar, Award,
  CheckCircle2, BookOpen, CreditCard, MessageSquare, TrendingUp
} from "lucide-react";

const outcomes = [
  "Manage patient scheduling and electronic health records (EHR)",
  "Process medical billing, coding (ICD-10, CPT), and insurance claims",
  "Coordinate referrals, authorizations, and patient communications",
  "Maintain HIPAA compliance in administrative workflows",
  "Use Microsoft Office Suite and healthcare management software",
];

const weeklySchedule = [
  { week: 1, title: "Healthcare Systems Overview", topics: "Industry landscape, role of medical admin, intro to EHR systems" },
  { week: 2, title: "Medical Terminology Essentials", topics: "Anatomical terms, abbreviations, documentation standards" },
  { week: 3, title: "Medical Billing Fundamentals", topics: "ICD-10 coding basics, CPT codes, charge capture" },
  { week: 4, title: "Insurance & Claims Processing", topics: "Payer types, claim submission, denial management" },
  { week: 5, title: "Patient Scheduling & Flow", topics: "Appointment management, check-in/out, referral coordination" },
  { week: 6, title: "HIPAA & Compliance", topics: "Privacy regulations, security best practices, documentation" },
  { week: 7, title: "Office Technology & Software", topics: "EHR workflows, Microsoft Office, communication tools" },
  { week: 8, title: "Capstone & Career Prep", topics: "Mock scenarios, resume workshop, interview prep, certification exam review" },
];

const qaSchedule = [
  { date: "Mar 5, 2026", topic: "Program overview and career paths", time: "7:00 PM ET" },
  { date: "Mar 12, 2026", topic: "Financial aid and employer sponsorship", time: "7:00 PM ET" },
  { date: "Mar 19, 2026", topic: "Day in the life of a medical admin", time: "12:00 PM ET" },
];

export default function EduCourseDetailPage() {
  return (
    <EduLayout title="Medical Administrative Assistant Certificate">
      {/* Breadcrumb */}
      <div className="bg-edu-navy py-3">
        <div className="container mx-auto px-4 lg:px-8">
          <Link to="/edu-portal/courses" className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/60 hover:text-edu-amber transition-colors">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Courses
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-edu-navy pb-12 pt-6" aria-labelledby="course-title">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="rounded-full bg-edu-teal/20 text-edu-teal-light px-3 py-0.5 text-xs font-medium">Cohort</span>
            <span className="rounded-full bg-edu-amber/20 text-edu-amber-light px-3 py-0.5 text-xs font-medium">Certificate</span>
          </div>
          <h1 id="course-title" className="text-3xl font-bold text-primary-foreground lg:text-4xl">
            Medical Administrative Assistant Certificate
          </h1>
          <p className="mt-2 text-primary-foreground/70 text-lg">8 weeks · Cohort · $349</p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-primary-foreground/60">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-edu-amber" aria-hidden="true" /> 120 total hours</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-edu-amber" aria-hidden="true" /> Starts Mar 3, 2026</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-edu-amber" aria-hidden="true" /> 4 seats remaining</span>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button className="rounded-lg bg-edu-amber px-6 py-3 font-semibold text-edu-navy hover:opacity-90 transition-opacity shadow-lg">
              Enroll Now — $349
            </button>
            <button className="rounded-lg border-2 border-primary-foreground/20 px-6 py-3 font-semibold text-primary-foreground hover:border-edu-amber hover:text-edu-amber transition-colors">
              Download Syllabus
            </button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 lg:px-8 py-10">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            {/* What you'll learn */}
            <section aria-labelledby="learn-heading">
              <h2 id="learn-heading" className="text-2xl font-bold text-foreground mb-4">What You'll Learn</h2>
              <ul className="space-y-2.5" role="list">
                {outcomes.map((o, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="h-5 w-5 text-edu-teal shrink-0 mt-0.5" aria-hidden="true" />
                    {o}
                  </li>
                ))}
              </ul>
            </section>

            {/* Weekly Schedule */}
            <section aria-labelledby="schedule-heading">
              <h2 id="schedule-heading" className="text-2xl font-bold text-foreground mb-4">Weekly Schedule</h2>
              <div className="space-y-2" role="list">
                {weeklySchedule.map((w) => (
                  <details key={w.week} className="group rounded-lg border border-border bg-card overflow-hidden">
                    <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-edu-navy text-primary-foreground text-xs font-bold shrink-0" aria-hidden="true">
                        {w.week}
                      </span>
                      <h3 className="font-body font-semibold text-sm text-foreground">{w.title}</h3>
                    </summary>
                    <div className="px-4 pb-3 pl-14 text-sm text-muted-foreground">
                      {w.topics}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* Alumni outcomes */}
            <section aria-labelledby="outcomes-heading">
              <h2 id="outcomes-heading" className="text-2xl font-bold text-foreground mb-4">Alumni Outcomes</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { stat: "92%", label: "Job placement within 3 months", icon: TrendingUp },
                  { stat: "$38K", label: "Average starting salary", icon: DollarSign },
                  { stat: "4.8/5", label: "Graduate satisfaction rating", icon: Award },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
                    <s.icon className="h-6 w-6 text-edu-teal mx-auto mb-2" aria-hidden="true" />
                    <div className="text-2xl font-bold text-foreground">{s.stat}</div>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Live Q&A */}
            <section aria-labelledby="qa-heading">
              <h2 id="qa-heading" className="text-2xl font-bold text-foreground mb-4">Upcoming Live Q&A Sessions</h2>
              <div className="space-y-2">
                {qaSchedule.map((qa) => (
                  <div key={qa.date} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{qa.topic}</p>
                      <p className="text-xs text-muted-foreground">{qa.date} · {qa.time}</p>
                    </div>
                    <button className="rounded-lg bg-edu-teal px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                      Register
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6" aria-label="Course details sidebar">
            {/* Instructor */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-body font-semibold text-foreground mb-3 text-sm">Your Instructor</h2>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-edu-navy flex items-center justify-center text-primary-foreground font-bold" aria-hidden="true">SM</div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Dr. Sarah Mitchell</p>
                  <p className="text-xs text-muted-foreground">CPC, CMA | 12 years experience</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Former clinic operations director. Certified medical coder and administrator. Passionate about preparing the next generation of healthcare professionals.
              </p>
            </div>

            {/* Materials */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-body font-semibold text-foreground mb-3 text-sm">Required Materials</h2>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2"><BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0 text-edu-amber" aria-hidden="true" /> Computer with internet access</li>
                <li className="flex items-start gap-2"><BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0 text-edu-amber" aria-hidden="true" /> Webcam and microphone for live sessions</li>
                <li className="flex items-start gap-2"><BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0 text-edu-amber" aria-hidden="true" /> All course materials included in tuition</li>
              </ul>
            </div>

            {/* Financing */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-body font-semibold text-foreground mb-3 text-sm">Financing Options</h2>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2"><CreditCard className="h-3.5 w-3.5 mt-0.5 shrink-0 text-edu-teal" aria-hidden="true" /> 3-month payment plan: $116.33/mo</li>
                <li className="flex items-start gap-2"><CreditCard className="h-3.5 w-3.5 mt-0.5 shrink-0 text-edu-teal" aria-hidden="true" /> Employer reimbursement eligible</li>
                <li className="flex items-start gap-2"><CreditCard className="h-3.5 w-3.5 mt-0.5 shrink-0 text-edu-teal" aria-hidden="true" /> Scholarship applications open</li>
              </ul>
              <button className="mt-3 w-full rounded-lg bg-muted py-2 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors">
                Calculate Monthly Payment
              </button>
            </div>

            {/* Help */}
            <div className="rounded-xl border border-edu-amber/30 bg-edu-surface-alt p-5 text-center">
              <MessageSquare className="h-6 w-6 text-edu-amber mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">Have questions?</p>
              <p className="text-xs text-muted-foreground mt-1">Talk to an enrollment advisor</p>
              <button className="mt-3 w-full rounded-lg bg-edu-amber py-2 text-xs font-semibold text-edu-navy hover:opacity-90 transition-opacity">
                Chat Now
              </button>
            </div>
          </aside>
        </div>
      </div>
    </EduLayout>
  );
}
