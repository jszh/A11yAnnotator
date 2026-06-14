import { Link } from "react-router-dom";
import { CheckCircle, Clock, Users, Award, Calendar, DollarSign, ArrowLeft, Play } from "lucide-react";
import Layout from "../components/Layout";

const weeklySchedule = [
  { week: 1, topic: "Introduction to Healthcare Administration", hours: 15 },
  { week: 2, topic: "Medical Terminology & Documentation", hours: 15 },
  { week: 3, topic: "Medical Billing Fundamentals", hours: 15 },
  { week: 4, topic: "Insurance & Claims Processing", hours: 15 },
  { week: 5, topic: "Electronic Health Records (EHR)", hours: 15 },
  { week: 6, topic: "Patient Scheduling & Communication", hours: 15 },
  { week: 7, topic: "Compliance & HIPAA Regulations", hours: 15 },
  { week: 8, topic: "Capstone Project & Certification Exam Prep", hours: 15 },
];

const outcomes = [
  "Process medical billing claims and insurance forms accurately",
  "Navigate electronic health record (EHR) systems confidently",
  "Manage patient scheduling and front-office operations",
  "Ensure HIPAA compliance in all administrative tasks",
  "Communicate effectively with patients, providers, and insurers",
  "Prepare for the CMAA certification exam",
];

export default function CourseDetailPage() {
  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/edu-portal/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent mb-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Programs
          </Link>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-edu-teal-light text-edu-teal text-xs font-bold px-2 py-0.5 rounded">Cohort</span>
            <span className="bg-muted/20 text-xs px-2 py-0.5 rounded">Certificate</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Medical Administrative Assistant Certificate</h1>
          <p className="text-lg text-muted-foreground">8 weeks · Cohort · $349</p>
          <div className="flex flex-wrap gap-4 mt-6">
            <Link to="/edu-portal/dashboard" className="bg-accent text-accent-foreground px-6 py-3 rounded-lg font-bold hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
              Enroll Now — $349
            </Link>
            <button className="border-2 border-primary-foreground/30 px-6 py-3 rounded-lg font-medium hover:bg-primary-foreground/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              Download Syllabus
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            {/* What You'll Learn */}
            <section aria-labelledby="outcomes-heading">
              <h2 id="outcomes-heading" className="font-display text-2xl font-bold text-foreground mb-4">What You'll Learn</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-edu-teal shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-sm text-foreground">{o}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Weekly Schedule */}
            <section aria-labelledby="schedule-heading">
              <h2 id="schedule-heading" className="font-display text-2xl font-bold text-foreground mb-4">Weekly Schedule</h2>
              <div className="space-y-3">
                {weeklySchedule.map((w) => (
                  <div key={w.week} className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-edu-teal-light text-edu-teal w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">{w.week}</span>
                      <span className="text-sm font-medium text-card-foreground">{w.topic}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{w.hours} hrs</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Instructor */}
            <section aria-labelledby="instructor-heading">
              <h2 id="instructor-heading" className="font-display text-2xl font-bold text-foreground mb-4">Your Instructor</h2>
              <div className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row gap-4">
                <div className="w-16 h-16 bg-edu-teal-light rounded-full flex items-center justify-center text-2xl shrink-0" aria-hidden="true">👩‍⚕️</div>
                <div>
                  <h3 className="font-bold text-card-foreground">Dr. Linda Chen, CMAA, CPC</h3>
                  <p className="text-sm text-muted-foreground">15+ years in healthcare administration. Former department lead at Cleveland Clinic. AHIMA-certified instructor with 98% student satisfaction rating.</p>
                </div>
              </div>
            </section>

            {/* Alumni Stats */}
            <section aria-labelledby="alumni-heading">
              <h2 id="alumni-heading" className="font-display text-2xl font-bold text-foreground mb-4">Alumni Outcomes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { stat: "92%", label: "Job placement within 3 months" },
                  { stat: "$38K", label: "Average starting salary" },
                  { stat: "4.9/5", label: "Alumni satisfaction" },
                ].map((s) => (
                  <div key={s.label} className="bg-edu-warm-bg rounded-xl p-5 text-center">
                    <div className="text-2xl font-display font-bold text-edu-teal">{s.stat}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-20">
              <h3 className="font-bold text-lg text-card-foreground mb-4">Program Details</h3>
              <dl className="space-y-3 text-sm">
                {[
                  { dt: "Duration", dd: "8 weeks" },
                  { dt: "Total Hours", dd: "120 hours" },
                  { dt: "Format", dd: "Instructor-led Cohort" },
                  { dt: "Next Start", dd: "March 3, 2026" },
                  { dt: "Schedule", dd: "Mon/Wed/Fri, 6–8 PM ET" },
                  { dt: "Cost", dd: "$349 (payment plans available)" },
                  { dt: "Credential", dd: "SkillForge Certificate + CMAA Exam Prep" },
                ].map((item) => (
                  <div key={item.dt} className="flex justify-between">
                    <dt className="text-muted-foreground">{item.dt}</dt>
                    <dd className="font-medium text-card-foreground text-right">{item.dd}</dd>
                  </div>
                ))}
              </dl>
              <hr className="border-border my-4" />
              <h4 className="font-bold text-sm text-card-foreground mb-2">Financing Options</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 3-month payment plan ($116.33/mo)</li>
                <li>• Employer reimbursement eligible</li>
                <li>• Scholarship applications accepted</li>
              </ul>
              <Link to="/edu-portal/dashboard" className="mt-4 block text-center bg-accent text-accent-foreground py-3 rounded-lg font-bold hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                Enroll Now
              </Link>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold text-card-foreground mb-3">Upcoming Live Q&A</h3>
              <div className="space-y-3">
                {[
                  { date: "Feb 28", time: "7 PM ET", topic: "Program Overview" },
                  { date: "Mar 1", time: "12 PM ET", topic: "Financial Aid Info" },
                ].map((session) => (
                  <div key={session.date} className="flex items-center gap-3 text-sm">
                    <div className="bg-edu-teal-light text-edu-teal px-2 py-1 rounded text-xs font-bold">{session.date}</div>
                    <div>
                      <div className="font-medium text-card-foreground">{session.topic}</div>
                      <div className="text-xs text-muted-foreground">{session.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
