import { useEffect } from "react";
import { Layout } from "../components/Layout";
import { CourseCard } from "../components/CourseCard";
import { courses } from "../data/courses";
import { Button } from "@/components/ui/button";
import { Play, Flame, Trophy, Target, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const enrolledCourses = [
  { course: courses[0], progress: 65 },
  { course: courses[1], progress: 30 },
  { course: courses[2], progress: 88 },
];

const achievements = [
  { icon: <Flame className="h-5 w-5" aria-hidden="true" />, label: "7-Day Streak", earned: true },
  { icon: <Trophy className="h-5 w-5" aria-hidden="true" />, label: "First Course", earned: true },
  { icon: <Target className="h-5 w-5" aria-hidden="true" />, label: "10 Lessons", earned: true },
  { icon: <BookOpen className="h-5 w-5" aria-hidden="true" />, label: "Bookworm", earned: false },
];

function ProgressRing({ progress, size = 64 }: { progress: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  return (
    <svg width={size} height={size} role="img" aria-label={`${progress}% complete`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className="edu-progress-ring"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dy=".35em" className="text-xs font-bold fill-foreground">
        {progress}%
      </text>
    </svg>
  );
}

export default function DashboardPage() {
  useEffect(() => {
    document.title = "Dashboard | LearnPath";
  }, []);

  return (
    <Layout>
      <div className="edu-container py-8">
        {/* Greeting */}
        <section aria-labelledby="greeting-heading">
          <h1 id="greeting-heading" className="text-2xl md:text-3xl font-display text-foreground">Welcome back, Jordan</h1>
          <p className="text-muted-foreground mt-1">Keep up the great work! You're on a 7-day learning streak 🔥</p>
        </section>

        {/* Stats */}
        <section className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Learning statistics">
          {[
            { label: "Courses Enrolled", value: "3" },
            { label: "Lessons Completed", value: "47" },
            { label: "Hours Learned", value: "28" },
            { label: "Current Streak", value: "7 days" },
          ].map((stat, i) => (
            <div key={i} className="edu-card p-4 text-center">
              <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Continue Learning */}
        <section className="mt-10" aria-labelledby="continue-heading" role="region">
          <h2 id="continue-heading" className="text-xl font-display text-foreground mb-6">Continue Learning</h2>
          <div className="space-y-4">
            {enrolledCourses.map(({ course, progress }) => (
              <div key={course.id} className="edu-card p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap">
                <ProgressRing progress={progress} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">{course.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{course.instructor} · {course.level}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <Button variant="accent" size="sm" asChild>
                  <Link to="/study" aria-label={`Resume ${course.title}`}>
                    <Play className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                    Resume
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Achievements */}
        <section className="mt-10" aria-labelledby="achievements-heading" role="region">
          <h2 id="achievements-heading" className="text-xl font-display text-foreground mb-6">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((badge, i) => (
              <div
                key={i}
                className={`edu-card p-4 flex flex-col items-center gap-2 text-center ${!badge.earned ? "opacity-40" : ""}`}
                role="img"
                aria-label={`${badge.label}${badge.earned ? " — Earned" : " — Not yet earned"}`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${badge.earned ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                  {badge.icon}
                </div>
                <span className="text-xs font-medium text-foreground">{badge.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recommended */}
        <section className="mt-10 pb-8" aria-labelledby="recommended-heading" role="region">
          <h2 id="recommended-heading" className="text-xl font-display text-foreground mb-6">Recommended for You</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.slice(3, 7).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
