import { useState, useMemo } from "react";
import { Layout } from "@/components/edu/Layout";
import { CourseCard } from "@/components/edu/CourseCard";
import { courses } from "@/data/courses";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const allCategories = ["All", ...Array.from(new Set(courses.map((c) => c.category)))];
const allLevels = ["All", "Beginner", "Intermediate", "Advanced"];
const sortOptions = ["Most Popular", "Highest Rated", "Newest"];

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All");
  const [sort, setSort] = useState("Most Popular");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = courses.filter((c) => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || c.category === category;
      const matchLevel = level === "All" || c.level === level;
      return matchSearch && matchCat && matchLevel;
    });
    if (sort === "Highest Rated") result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sort === "Newest") result = [...result].reverse();
    else result = [...result].sort((a, b) => b.enrolled - a.enrolled);
    return result;
  }, [search, category, level, sort]);

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</h4>
        <div className="flex flex-col gap-1">
          {allCategories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                category === c ? "bg-secondary/10 font-medium text-secondary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-3 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Level</h4>
        <div className="flex flex-col gap-1">
          {allLevels.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                level === l ? "bg-secondary/10 font-medium text-secondary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-3 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</h4>
        <div className="flex flex-col gap-1">
          {["All", "Free", "Paid"].map((p) => (
            <button
              key={p}
              className="rounded-md px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <section className="edu-hero-gradient py-12">
        <div className="edu-container text-center">
          <h1 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            Explore Courses
          </h1>
          <p className="mt-2 text-primary-foreground/70">Discover your next skill from our library of 1,200+ courses</p>
          <div className="mx-auto mt-6 flex max-w-lg items-center rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-4">
            <Search className="h-5 w-5 text-primary-foreground/50" />
            <input
              type="text"
              placeholder="Search courses or instructors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent px-3 py-3 text-sm text-primary-foreground placeholder-primary-foreground/40 outline-none"
            />
          </div>
        </div>
      </section>

      <section className="edu-section bg-background">
        <div className="edu-container">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{filtered.length} courses found</p>
            <div className="flex items-center gap-3">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
              >
                {sortOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                className="md:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="mr-1 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mb-6 rounded-xl border border-border bg-card p-4 md:hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-sm font-semibold">Filters</span>
                <button onClick={() => setShowFilters(false)}><X className="h-4 w-4" /></button>
              </div>
              <FilterPanel />
            </div>
          )}

          <div className="flex gap-8">
            <aside className="hidden w-56 shrink-0 md:block">
              <FilterPanel />
            </aside>
            <div className="flex-1">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="py-20 text-center text-muted-foreground">
                  No courses match your filters. Try broadening your search.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
