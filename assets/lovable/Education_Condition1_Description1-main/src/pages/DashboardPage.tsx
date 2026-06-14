import { Layout } from "@/components/edu/Layout";
import { CourseCard } from "@/components/edu/CourseCard";
import { courses } from "@/data/courses";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Flame, Trophy, Target, BookOpen, ChevronRight, Clock } from "lucide-react";

const enrolledCourses = [
  { ...courses[0], progress: 72 },
  { ...courses[2], progress: 45 },
  { ...courses[1], progress: 18 },
];

const badges = [
  { label: "First Course", icon: "🎓", earned: true },
  { label: "5 Day Streak", icon: "🔥", earned: true },
  { label: "10 Courses", icon: "📚", earned: false },
  { label: "Top Reviewer", icon: "⭐", earned: false },
];

export default function DashboardPage() {
  return (
    <Layout>
      <section className="edu-hero-gradient py-10">
        <div className="edu-container">
          <h1 className="font-display text-2xl font-bold text-primary-foreground md:text-3xl">
            Welcome back, Jordan 👋
          </h1>
          <p className="mt-1 text-primary-foreground/70">Keep up the great work — you're on a 5-day learning streak!</p>
        </div>
      </section>

      <section className="edu-section bg-background">
        <div className="edu-container">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4 mb-10">
            {[
              { icon: BookOpen, label: "Courses Enrolled", value: "3" },
              { icon: Clock, label: "Hours Learned", value: "42" },
              { icon: Flame, label: "Day Streak", value: "5" },
              { icon: Trophy, label: "Certificates", value: "1" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 edu-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                  <stat.icon className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Continue Learning */}
          <div className="mb-10">
            <h2 className="mb-4 font-display text-xl font-bold text-foreground">Continue Learning</h2>
            <div className="space-y-3">
              {enrolledCourses.map((course) => (
                <div key={course.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 edu-card">
                  <div className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg sm:block">
                    <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-sm font-semibold text-foreground truncate">{course.title}</h3>
                    <p className="text-xs text-muted-foreground">{course.instructor}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-secondary transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{course.progress}%</span>
                    </div>
                  </div>
                  <Button asChild size="sm" className="shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    <Link to="/study">Resume <ChevronRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="mb-10">
            <h2 className="mb-4 font-display text-xl font-bold text-foreground">Achievements</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {badges.map((badge) => (
                <div
                  key={badge.label}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center ${
                    badge.earned
                      ? "border-secondary/30 bg-secondary/5"
                      : "border-border bg-card opacity-50"
                  }`}
                >
                  <span className="text-3xl">{badge.icon}</span>
                  <span className="text-xs font-medium text-foreground">{badge.label}</span>
                  {badge.earned && <span className="text-[10px] text-secondary font-medium">Earned</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended */}
          <div>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">Recommended for You</h2>
              <Link to="/courses" className="text-sm font-medium text-secondary hover:underline">
                View All
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {courses.slice(3, 7).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
