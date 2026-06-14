import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Calendar, Users, Award, DollarSign, CheckCircle2, PlayCircle, BookOpen } from "lucide-react";

const weeklySchedule = [
  { week: 1, title: "Introduction to Healthcare Administration", topics: "Industry overview, HIPAA basics, professional communication" },
  { week: 2, title: "Medical Terminology", topics: "Anatomical terms, abbreviations, documentation standards" },
  { week: 3, title: "Medical Billing Fundamentals", topics: "Insurance types, CPT codes, claim submission" },
  { week: 4, title: "Medical Coding (ICD-10)", topics: "Diagnosis coding, code lookup, accuracy checks" },
  { week: 5, title: "Electronic Health Records", topics: "EHR navigation, data entry, patient privacy" },
  { week: 6, title: "Office Management", topics: "Scheduling, inventory, vendor relations" },
  { week: 7, title: "Patient Communication", topics: "Front desk protocols, phone etiquette, conflict resolution" },
  { week: 8, title: "Capstone & Certification Prep", topics: "Mock exams, portfolio review, career coaching" },
];

const outcomes = [
  "Manage patient records using EHR systems",
  "Process medical billing claims and insurance verification",
  "Apply ICD-10 and CPT coding standards",
  "Coordinate clinical office scheduling and workflow",
  "Communicate effectively with patients and providers",
  "Prepare for national certification exams (CMAA)",
];

const EduCourseDetail = () => (
  <div className="bg-background">
    {/* Hero */}
    <section className="bg-primary py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link to="/edu-portal/courses" className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/60 hover:text-primary-foreground mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Programs
        </Link>
        <div className="flex flex-wrap items-start gap-3 mb-4">
          <span className="rounded-full bg-edu-gold/15 px-3 py-1 text-xs font-medium text-edu-gold">Cohort</span>
          <span className="rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium text-primary-foreground/70">Certificate</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
          Medical Administrative Assistant Certificate
        </h1>
        <div className="mt-4 flex flex-wrap gap-5 text-sm text-primary-foreground/70">
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> 8 weeks · 120 hours</span>
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Starts March 3, 2026</span>
          <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> $349</span>
          <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> 4 seats remaining</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="hero" size="lg">Enroll Now — $349</Button>
          <Button variant="heroOutline" size="lg">Download Syllabus</Button>
        </div>
      </div>
    </section>

    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Outcomes */}
          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-5">What You'll Learn</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {outcomes.map((item) => (
                <div key={item} className="flex gap-3 items-start">
                  <CheckCircle2 className="h-5 w-5 text-edu-emerald shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Weekly Schedule */}
          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-5">Weekly Schedule</h2>
            <div className="space-y-3">
              {weeklySchedule.map((w) => (
                <div key={w.week} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground text-sm">Week {w.week}: {w.title}</h3>
                    <span className="text-xs text-muted-foreground">15 hrs</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{w.topics}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Alumni Stats */}
          <section className="rounded-xl bg-edu-warm border border-border p-6 sm:p-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">Alumni Outcomes</h2>
            <div className="grid gap-6 sm:grid-cols-3 text-center">
              <div>
                <p className="font-display text-4xl font-bold text-edu-emerald">92%</p>
                <p className="text-sm text-muted-foreground mt-1">Job placement within 3 months</p>
              </div>
              <div>
                <p className="font-display text-4xl font-bold text-edu-gold">$38k</p>
                <p className="text-sm text-muted-foreground mt-1">Average starting salary</p>
              </div>
              <div>
                <p className="font-display text-4xl font-bold text-edu-navy">4.8/5</p>
                <p className="text-sm text-muted-foreground mt-1">Student satisfaction</p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Instructor */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-3">Your Instructor</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-edu-navy flex items-center justify-center text-edu-gold font-display font-bold text-lg">DR</div>
              <div>
                <p className="font-semibold text-foreground text-sm">Dr. Rachel Kim</p>
                <p className="text-xs text-muted-foreground">CMAA, MHA · 12 years experience</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Former clinic administrator at Kaiser Permanente. Certified instructor with a passion for helping career changers enter healthcare.
            </p>
          </div>

          {/* Live Q&A */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-edu-coral" /> Live Q&A Sessions
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Wednesdays 7–8 PM ET</li>
              <li>Open to prospective students</li>
              <li>Next session: Feb 26, 2026</li>
            </ul>
            <Button variant="outline" size="sm" className="mt-4 w-full">Join Free Q&A</Button>
          </div>

          {/* Materials */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-edu-navy" /> Required Materials
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>• Computer with webcam</li>
              <li>• Stable internet connection</li>
              <li>• Textbook (provided digitally)</li>
            </ul>
          </div>

          {/* Financing */}
          <div className="rounded-xl border border-edu-gold/30 bg-edu-gold/5 p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-edu-gold" /> Financing Options
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ 3-month payment plan ($116/mo)</li>
              <li>✓ Employer reimbursement support</li>
              <li>✓ Scholarship applications open</li>
            </ul>
            <Button variant="hero" size="sm" className="mt-4 w-full" asChild>
              <Link to="/edu-portal/pricing">View All Plans</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default EduCourseDetail;
