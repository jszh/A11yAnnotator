import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, FileText, MessageSquare, Upload, Play, BookOpen, ChevronRight, CheckCircle, Users } from "lucide-react";
import Layout from "../components/Layout";

const weeks = [
  { num: 1, title: "Intro to Healthcare Admin", done: true },
  { num: 2, title: "Medical Terminology", done: true },
  { num: 3, title: "Medical Billing Fundamentals", done: false, current: true },
  { num: 4, title: "Insurance & Claims", done: false },
  { num: 5, title: "EHR Systems", done: false },
  { num: 6, title: "Patient Communication", done: false },
  { num: 7, title: "Compliance & HIPAA", done: false },
  { num: 8, title: "Capstone & Exam Prep", done: false },
];

const assignments = [
  { title: "CMS-1500 Claim Form Exercise", due: "Mar 7", status: "pending" },
  { title: "Medical Billing Terminology Quiz", due: "Mar 5", status: "submitted" },
  { title: "ICD-10 Code Lookup Worksheet", due: "Mar 10", status: "pending" },
];

const resources = [
  { title: "Week 3 Lecture Slides", type: "PDF", icon: "📄" },
  { title: "Medical Billing Basics — Video", type: "Video", icon: "🎥" },
  { title: "CMS-1500 Form Template", type: "Worksheet", icon: "📋" },
  { title: "Supplemental Reading: Billing Ethics", type: "Article", icon: "📖" },
];

const discussions = [
  { author: "Maria S.", time: "2 hours ago", text: "Has anyone started the CMS-1500 exercise? I'm confused about Box 21." },
  { author: "James T.", time: "1 hour ago", text: "Yes — Dr. Chen posted a walkthrough video in the resources section. Check it out!" },
  { author: "Priya K.", time: "30 min ago", text: "Thanks James! That helped a lot. Also the ICD-10 lookup tool is really useful." },
];

export default function StudyToolPage() {
  const [activeTab, setActiveTab] = useState<"agenda" | "assignments" | "discussion" | "resources">("agenda");

  return (
    <Layout>
      {/* Top Bar */}
      <section className="bg-primary text-primary-foreground py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Medical Administrative Assistant Certificate</p>
              <h1 className="font-display text-2xl font-bold">Week 3 of 8 — Medical Billing Fundamentals</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-accent/20 text-accent px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <Play className="w-4 h-4" aria-hidden="true" />
                <div>
                  <div>Next Live Session</div>
                  <div className="text-xs opacity-80">Wed, Mar 5 · 6:00 PM ET</div>
                </div>
              </div>
              <button className="bg-accent text-accent-foreground px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                Join Session
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>3 of 8 weeks (37.5%)</span>
            </div>
            <div className="w-full bg-edu-navy-light rounded-full h-2" role="progressbar" aria-valuenow={37.5} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
              <div className="bg-accent h-2 rounded-full" style={{ width: "37.5%" }} />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Week Nav */}
          <aside className="lg:col-span-1">
            <h2 className="font-bold text-foreground mb-3 text-sm">Weekly Agenda</h2>
            <nav aria-label="Weekly navigation">
              <ul className="space-y-1">
                {weeks.map((w) => (
                  <li key={w.num}>
                    <button className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      w.current ? "bg-accent text-accent-foreground font-bold" : w.done ? "text-edu-teal" : "text-muted-foreground hover:bg-muted"
                    }`}>
                      {w.done ? <CheckCircle className="w-4 h-4" aria-hidden="true" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">{w.num}</span>}
                      {w.title}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <hr className="border-border my-4" />
            <div>
              <h3 className="font-bold text-foreground mb-2 text-sm flex items-center gap-1"><Users className="w-4 h-4" aria-hidden="true" /> Cohort Members</h3>
              <div className="flex -space-x-2">
                {["MS", "JT", "PK", "AL", "RN"].map((initials) => (
                  <div key={initials} className="w-8 h-8 rounded-full bg-edu-teal text-primary-foreground text-xs font-bold flex items-center justify-center border-2 border-card" title={initials}>{initials}</div>
                ))}
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center border-2 border-card">+7</div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="flex border-b border-border mb-6" role="tablist" aria-label="Classroom sections">
              {([
                { key: "agenda", label: "Agenda", icon: BookOpen },
                { key: "assignments", label: "Assignments", icon: FileText },
                { key: "discussion", label: "Discussion", icon: MessageSquare },
                { key: "resources", label: "Resources", icon: FileText },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={activeTab === key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    activeTab === key ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "agenda" && (
              <div role="tabpanel" aria-label="Agenda">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-display text-xl font-bold text-card-foreground mb-4">Week 3: Medical Billing Fundamentals</h3>
                  <div className="space-y-4 text-sm text-card-foreground">
                    <div className="border-l-4 border-accent pl-4">
                      <h4 className="font-bold">Monday — Lecture: Intro to Medical Billing</h4>
                      <p className="text-muted-foreground">Understand the revenue cycle, key terminology, and the role of medical billers in healthcare.</p>
                    </div>
                    <div className="border-l-4 border-edu-teal pl-4">
                      <h4 className="font-bold">Wednesday — Workshop: CMS-1500 Claim Form</h4>
                      <p className="text-muted-foreground">Hands-on practice completing CMS-1500 forms with real-world scenarios.</p>
                    </div>
                    <div className="border-l-4 border-muted pl-4">
                      <h4 className="font-bold">Friday — Lab: ICD-10 & CPT Coding Basics</h4>
                      <p className="text-muted-foreground">Learn to look up and apply diagnostic and procedure codes accurately.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "assignments" && (
              <div role="tabpanel" aria-label="Assignments" className="space-y-4">
                {assignments.map((a) => (
                  <div key={a.title} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-card-foreground">{a.title}</h3>
                      <p className="text-sm text-muted-foreground">Due: {a.due}</p>
                    </div>
                    {a.status === "submitted" ? (
                      <span className="text-xs font-bold text-edu-teal bg-edu-teal-light px-3 py-1 rounded-full">Submitted</span>
                    ) : (
                      <button className="bg-accent text-accent-foreground px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                        <Upload className="w-4 h-4" aria-hidden="true" /> Submit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "discussion" && (
              <div role="tabpanel" aria-label="Discussion" className="space-y-4">
                {discussions.map((d, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-edu-teal text-primary-foreground text-xs font-bold flex items-center justify-center">{d.author.split(" ").map(n => n[0]).join("")}</div>
                      <span className="font-bold text-sm text-card-foreground">{d.author}</span>
                      <span className="text-xs text-muted-foreground">{d.time}</span>
                    </div>
                    <p className="text-sm text-card-foreground">{d.text}</p>
                  </div>
                ))}
                <div className="flex gap-2">
                  <label htmlFor="reply-input" className="sr-only">Write a reply</label>
                  <input id="reply-input" type="text" placeholder="Write a reply..." className="flex-1 border border-border rounded-lg px-4 py-2 text-sm bg-card text-card-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
                  <button className="bg-accent text-accent-foreground px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Post</button>
                </div>
              </div>
            )}

            {activeTab === "resources" && (
              <div role="tabpanel" aria-label="Resources" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resources.map((r) => (
                  <button key={r.title} className="bg-card border border-border rounded-xl p-5 text-left hover:shadow-md transition flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <span className="text-2xl" aria-hidden="true">{r.icon}</span>
                    <div>
                      <h3 className="font-bold text-sm text-card-foreground">{r.title}</h3>
                      <p className="text-xs text-muted-foreground">{r.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
