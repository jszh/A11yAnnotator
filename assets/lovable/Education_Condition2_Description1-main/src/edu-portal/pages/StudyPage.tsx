import { useState, useEffect, useRef } from "react";
import { Layout } from "../components/Layout";
import { Button } from "@/components/ui/button";
import {
  Play, Pause, Volume2, Maximize, CheckCircle2, Circle,
  ChevronLeft, MessageSquare, FileText, BookOpen, Download
} from "lucide-react";
import { Link } from "react-router-dom";

const modules = [
  {
    title: "Module 1: Python Basics",
    lessons: [
      { title: "Welcome & Setup", duration: "8:30", completed: true },
      { title: "Variables & Types", duration: "12:45", completed: true },
      { title: "Operators", duration: "10:20", completed: true },
    ],
  },
  {
    title: "Module 2: Data Structures",
    lessons: [
      { title: "Lists & Tuples", duration: "14:30", completed: true },
      { title: "Dictionaries", duration: "16:00", completed: true },
      { title: "Sets", duration: "11:45", completed: true },
      { title: "Comprehensions", duration: "18:20", completed: false, active: true },
      { title: "String Methods", duration: "13:10", completed: false },
      { title: "Nested Structures", duration: "15:30", completed: false },
      { title: "Quiz: Data Structures", duration: "10:00", completed: false },
    ],
  },
  {
    title: "Module 3: Working with Data",
    lessons: [
      { title: "NumPy Introduction", duration: "20:00", completed: false },
      { title: "Arrays & Operations", duration: "18:30", completed: false },
    ],
  },
];

const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
const completedLessons = modules.reduce((s, m) => s + m.lessons.filter((l) => l.completed).length, 0);
const currentLesson = 4;
const activeTab = ["Overview", "Notes", "Q&A", "Resources"] as const;

export default function StudyPage() {
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState<(typeof activeTab)[number]>("Overview");
  const nextLessonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.title = "Comprehensions — Python for Data Science | LearnPath";
  }, []);

  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  return (
    <Layout hideFooter>
      {/* Progress bar */}
      <div className="bg-card border-b" role="status" aria-label={`Progress: Lesson ${currentLesson} of ${totalLessons}, Module 2: Data Structures, ${progressPercent}% complete`}>
        <div className="edu-container flex items-center gap-4 py-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/courses/python-data-science" aria-label="Back to course overview">
              <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
              Back
            </Link>
          </Button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Lesson {currentLesson} of {totalLessons} — Module 2: Data Structures</p>
            <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <span className="text-xs font-semibold text-accent">{progressPercent}%</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Main video area */}
        <div className="flex-1 min-w-0">
          {/* Video player */}
          <div className="relative bg-foreground aspect-video flex items-center justify-center" role="region" aria-label="Video player">
            <div className="text-center text-primary-foreground/60">
              <Play className="h-16 w-16 mx-auto mb-2 opacity-50" aria-hidden="true" />
              <p className="text-sm">Video: Comprehensions in Python</p>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/80 to-transparent p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPlaying(!playing)}
                  className="edu-focus-ring rounded p-1 text-primary-foreground"
                  aria-label={playing ? "Pause video" : "Play video"}
                >
                  {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                <div className="flex-1 h-1 rounded-full bg-primary-foreground/20">
                  <div className="h-full w-1/3 rounded-full bg-accent" />
                </div>
                <span className="text-xs text-primary-foreground/60">6:12 / 18:20</span>
                <button className="edu-focus-ring rounded p-1 text-primary-foreground" aria-label="Volume control">
                  <Volume2 className="h-4 w-4" />
                </button>
                <button className="edu-focus-ring rounded p-1 text-primary-foreground" aria-label="Toggle fullscreen">
                  <Maximize className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="edu-container py-6">
            <div className="border-b" role="tablist" aria-label="Lesson content tabs">
              {activeTab.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  aria-controls={`tabpanel-${t}`}
                  id={`tab-${t}`}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors edu-focus-ring ${
                    tab === t
                      ? "border-accent text-accent"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div
              id={`tabpanel-${tab}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab}`}
              className="py-6"
              tabIndex={0}
            >
              {tab === "Overview" && (
                <div className="space-y-4">
                  <h2 className="text-lg font-display text-foreground">Comprehensions in Python</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Learn how to write concise and readable code using list comprehensions, dictionary comprehensions, and set comprehensions. We'll cover syntax, filtering, nested comprehensions, and best practices for when to use them vs. traditional loops.
                  </p>
                  <h3 className="text-sm font-semibold text-foreground mt-4">Key Takeaways</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>List comprehension syntax and patterns</li>
                    <li>Dictionary and set comprehensions</li>
                    <li>Conditional filtering within comprehensions</li>
                    <li>Performance comparison with loops</li>
                  </ul>
                </div>
              )}
              {tab === "Notes" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Your notes for this lesson will appear here.</p>
                  <textarea
                    className="w-full border rounded-lg p-3 text-sm bg-card text-foreground edu-focus-ring min-h-[120px]"
                    placeholder="Type your notes here..."
                    aria-label="Lesson notes"
                  />
                </div>
              )}
              {tab === "Q&A" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 border rounded-lg p-4">
                    <MessageSquare className="h-5 w-5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Can comprehensions replace all for loops?</p>
                      <p className="text-xs text-muted-foreground mt-1">Asked by Alex R. · 3 days ago · 5 answers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 border rounded-lg p-4">
                    <MessageSquare className="h-5 w-5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Performance difference between comprehension and map()?</p>
                      <p className="text-xs text-muted-foreground mt-1">Asked by Sam K. · 1 week ago · 3 answers</p>
                    </div>
                  </div>
                </div>
              )}
              {tab === "Resources" && (
                <div className="space-y-3">
                  {[
                    { name: "Comprehensions Cheat Sheet.pdf", icon: <FileText className="h-4 w-4" aria-hidden="true" /> },
                    { name: "Practice Exercises.zip", icon: <Download className="h-4 w-4" aria-hidden="true" /> },
                    { name: "Further Reading Links", icon: <BookOpen className="h-4 w-4" aria-hidden="true" /> },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 border rounded-lg p-3 text-sm text-foreground hover:bg-muted/50 cursor-pointer edu-focus-ring" tabIndex={0} role="button" aria-label={`Download ${r.name}`}>
                      <span className="text-accent">{r.icon}</span>
                      {r.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lesson sidebar */}
        <aside className="lg:w-80 border-l bg-card overflow-y-auto lg:max-h-[calc(100vh-8rem)]" aria-label="Course lessons">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm text-foreground">Course Content</h2>
          </div>
          <nav>
            {modules.map((mod, mi) => (
              <div key={mi}>
                <h3 className="px-4 py-3 text-xs font-semibold text-muted-foreground bg-muted/50">{mod.title}</h3>
                <ul>
                  {mod.lessons.map((lesson, li) => (
                    <li key={li}>
                      <button
                        ref={lesson.active ? nextLessonRef : undefined}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm edu-focus-ring transition-colors ${
                          lesson.active
                            ? "bg-accent/10 text-accent font-medium"
                            : "text-foreground hover:bg-muted/50"
                        }`}
                        aria-label={`${lesson.title}, ${lesson.duration}${lesson.completed ? " — Completed" : ""}${lesson.active ? " — Currently playing" : ""}`}
                        aria-current={lesson.active ? "true" : undefined}
                      >
                        {lesson.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                        )}
                        <span className="flex-1 truncate">{lesson.title}</span>
                        <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>
      </div>
    </Layout>
  );
}
