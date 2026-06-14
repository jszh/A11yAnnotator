import { useState, useEffect, useMemo } from "react";
import { Layout } from "../components/Layout";
import { CourseCard } from "../components/CourseCard";
import { courses, categories, levels } from "../data/courses";
import { Button } from "@/components/ui/button";

type SortOption = "popular" | "rated" | "newest";

export default function CoursesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("popular");

  useEffect(() => {
    document.title = "Browse Courses | LearnPath";
  }, []);

  const filtered = useMemo(() => {
    let result = [...courses];
    if (selectedCategory) result = result.filter((c) => c.category === selectedCategory);
    if (selectedLevel) result = result.filter((c) => c.level === selectedLevel);
    if (selectedPrice === "Free") result = result.filter((c) => c.price === "Free");
    if (selectedPrice === "Paid") result = result.filter((c) => typeof c.price === "number");

    if (sort === "popular") result.sort((a, b) => b.enrolled - a.enrolled);
    if (sort === "rated") result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [selectedCategory, selectedLevel, selectedPrice, sort]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedLevel(null);
    setSelectedPrice(null);
  };

  return (
    <Layout>
      <div className="edu-container py-8">
        <h1 className="text-3xl font-display text-foreground mb-2">Browse Courses</h1>
        <p className="text-muted-foreground mb-8">Discover {courses.length}+ courses to advance your skills</p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar */}
          <aside className="lg:w-60 shrink-0" aria-label="Course filters">
            <div className="space-y-6">
              <fieldset>
                <legend className="text-sm font-semibold text-foreground mb-3">Category</legend>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer edu-focus-ring rounded">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                        className="accent-accent"
                      />
                      <span className="text-foreground">{cat}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold text-foreground mb-3">Level</legend>
                <div className="space-y-2">
                  {levels.map((lvl) => (
                    <label key={lvl} className="flex items-center gap-2 text-sm cursor-pointer edu-focus-ring rounded">
                      <input
                        type="radio"
                        name="level"
                        checked={selectedLevel === lvl}
                        onChange={() => setSelectedLevel(selectedLevel === lvl ? null : lvl)}
                        className="accent-accent"
                      />
                      <span className="text-foreground">{lvl}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold text-foreground mb-3">Price</legend>
                <div className="space-y-2">
                  {["Free", "Paid"].map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm cursor-pointer edu-focus-ring rounded">
                      <input
                        type="radio"
                        name="price"
                        checked={selectedPrice === p}
                        onChange={() => setSelectedPrice(selectedPrice === p ? null : p)}
                        className="accent-accent"
                      />
                      <span className="text-foreground">{p}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </aside>

          {/* Course grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">{filtered.length} course{filtered.length !== 1 ? "s" : ""} found</p>
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-sm text-muted-foreground">Sort by:</label>
                <select
                  id="sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="text-sm border rounded-md px-3 py-1.5 bg-card text-foreground edu-focus-ring"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rated">Highest Rated</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16" role="status">
                <p className="text-muted-foreground text-lg">No courses found matching your filters.</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or browse all courses.</p>
                <Button variant="accent" className="mt-4" onClick={clearFilters}>Show All Courses</Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
