import { Layout } from "@/components/edu/Layout";
import { useState } from "react";
import { CheckCircle, Circle, Play, ChevronRight, FileText, MessageSquare, Download, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const modules = [
  {
    title: "Module 1: Python Basics",
    lessons: [
      { title: "Introduction to Python", duration: "12:30", completed: true },
      { title: "Variables & Data Types", duration: "18:45", completed: true },
      { title: "Control Flow", duration: "22:10", completed: true },
    ],
  },
  {
    title: "Module 2: Data Structures",
    lessons: [
      { title: "Lists & Tuples", duration: "15:20", completed: true },
      { title: "Dictionaries & Sets", duration: "19:00", completed: true },
      { title: "Working with Strings", duration: "14:30", completed: false },
      { title: "Comprehensions", duration: "16:45", completed: false },
    ],
  },
  {
    title: "Module 3: Working with Pandas",
    lessons: [
      { title: "Introduction to Pandas", duration: "20:00", completed: false },
      { title: "DataFrames Deep Dive", duration: "25:30", completed: false },
      { title: "Data Cleaning", duration: "22:15", completed: false },
      { title: "Merging & Joining", duration: "18:40", completed: false },
      { title: "Groupby Operations", duration: "16:50", completed: false },
    ],
  },
];

const allLessons = modules.flatMap((m) => m.lessons);
const completedCount = allLessons.filter((l) => l.completed).length;
const currentLessonIndex = completedCount;
const activeTab = "Overview";

export default function StudyPage() {
  const [tab, setTab] = useState(activeTab);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Layout>
      {/* Progress Bar */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="edu-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-secondary" />
            <span className="text-sm font-medium text-foreground">
              Lesson {currentLessonIndex + 1} of {allLessons.length} — Module 2: Data Structures
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-secondary transition-all"
                style={{ width: `${(completedCount / allLessons.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{Math.round((completedCount / allLessons.length) * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Main Video Area */}
        <div className="flex-1">
          {/* Video Player Placeholder */}
          <div className="relative aspect-video w-full bg-primary">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <button className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/90 transition-transform hover:scale-110">
                <Play className="ml-1 h-8 w-8 text-secondary-foreground" />
              </button>
              <p className="mt-4 text-sm text-primary-foreground/70">Working with Strings</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border bg-card">
            <div className="edu-container flex gap-1 pt-2">
              {["Overview", "Notes", "Q&A", "Resources"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    tab === t
                      ? "border-b-2 border-secondary text-secondary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="edu-container py-6">
            {tab === "Overview" && (
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">Working with Strings</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  In this lesson, you'll learn about Python's powerful string manipulation capabilities.
                  We'll cover string methods, formatting, regular expressions, and best practices for
                  working with text data in your data science projects.
                </p>
                <div className="mt-6 flex gap-3">
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    Mark as Complete
                  </Button>
                  <Button variant="outline">Next Lesson <ChevronRight className="ml-1 h-4 w-4" /></Button>
                </div>
              </div>
            )}
            {tab === "Notes" && (
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">Your Notes</h2>
                <textarea
                  placeholder="Take notes for this lesson..."
                  className="mt-3 w-full rounded-lg border border-border bg-card p-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-secondary"
                  rows={8}
                />
              </div>
            )}
            {tab === "Q&A" && (
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">Questions & Answers</h2>
                <p className="mt-2 text-sm text-muted-foreground">No questions yet for this lesson. Be the first to ask!</p>
                <Button className="mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  <MessageSquare className="mr-2 h-4 w-4" /> Ask a Question
                </Button>
              </div>
            )}
            {tab === "Resources" && (
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">Lesson Resources</h2>
                <div className="mt-4 space-y-2">
                  {["string_methods_cheatsheet.pdf", "practice_exercises.py", "sample_data.csv"].map((file) => (
                    <div key={file} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-secondary" />
                        <span className="text-sm text-foreground">{file}</span>
                      </div>
                      <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lesson Sidebar */}
        <aside className={`hidden border-l border-border bg-card lg:block ${sidebarOpen ? "w-80" : "w-0"}`}>
          <div className="p-4">
            <h3 className="font-display text-sm font-bold text-foreground">Course Content</h3>
          </div>
          <div className="overflow-y-auto">
            {modules.map((mod, mi) => (
              <div key={mi}>
                <div className="bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {mod.title}
                </div>
                {mod.lessons.map((lesson, li) => {
                  const globalIndex = modules.slice(0, mi).reduce((acc, m) => acc + m.lessons.length, 0) + li;
                  const isCurrent = globalIndex === currentLessonIndex;
                  return (
                    <button
                      key={li}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                        isCurrent
                          ? "bg-secondary/10 text-secondary"
                          : lesson.completed
                          ? "text-muted-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {lesson.completed ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-secondary" />
                      ) : isCurrent ? (
                        <Play className="h-4 w-4 shrink-0 text-secondary" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-border" />
                      )}
                      <span className="flex-1 truncate">{lesson.title}</span>
                      <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </Layout>
  );
}
