import { Link } from "react-router-dom";
import { Clock, Users } from "lucide-react";
import { StarRating } from "./StarRating";

export interface CourseData {
  id: string;
  title: string;
  instructor: string;
  rating: number;
  reviewCount: number;
  enrolled: number;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  price: number | "Free";
  thumbnail: string;
  category: string;
}

interface CourseCardProps {
  course: CourseData;
}

const levelBadgeClass: Record<string, string> = {
  Beginner: "edu-badge edu-badge-beginner",
  Intermediate: "edu-badge edu-badge-intermediate",
  Advanced: "edu-badge edu-badge-advanced",
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <article className="edu-card group overflow-hidden flex flex-col">
      <Link
        to={`/courses/${course.id}`}
        className="edu-focus-ring rounded-t-lg"
        aria-label={`${course.title} by ${course.instructor}, rated ${course.rating} stars, ${course.duration}, ${typeof course.price === "number" ? `$${course.price}` : "Free"}`}
      >
        <div className="aspect-video bg-muted overflow-hidden">
          <img
            src={course.thumbnail}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4 gap-2">
        <div className="flex items-center gap-2">
          <span className={levelBadgeClass[course.level]}>{course.level}</span>
          <span className="text-xs text-muted-foreground">{course.category}</span>
        </div>
        <Link to={`/courses/${course.id}`} className="edu-focus-ring rounded">
          <h3 className="font-semibold text-sm leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2">
            {course.title}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground">{course.instructor}</p>
        <StarRating rating={course.rating} count={course.reviewCount} />
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden="true" />{course.duration}</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" aria-hidden="true" />{course.enrolled.toLocaleString()}</span>
          </div>
          <span className="font-bold text-sm text-foreground">
            {typeof course.price === "number" ? `$${course.price}` : "Free"}
          </span>
        </div>
      </div>
    </article>
  );
}
