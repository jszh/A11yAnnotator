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
  level: string;
  price: string;
  image: string;
  category: string;
}

export function CourseCard({ course }: { course: CourseData }) {
  return (
    <Link to={`/courses/${course.id}`} className="group">
      <div className="edu-card overflow-hidden rounded-lg border border-border bg-card">
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={course.image}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <span className="edu-badge bg-secondary/10 text-secondary mb-2">
            {course.level}
          </span>
          <h3 className="mt-1 font-display text-sm font-semibold leading-tight text-foreground line-clamp-2">
            {course.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{course.instructor}</p>
          <div className="mt-2">
            <StarRating rating={course.rating} count={course.reviewCount} />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.enrolled.toLocaleString()}</span>
            </div>
            <span className="font-display text-sm font-bold text-primary">{course.price}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
