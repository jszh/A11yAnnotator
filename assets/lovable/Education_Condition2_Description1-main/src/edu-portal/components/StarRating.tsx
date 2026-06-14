import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}

export function StarRating({ rating, count, size = "sm" }: StarRatingProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`Rating: ${rating} out of 5 stars${count ? `, ${count.toLocaleString()} reviews` : ""}`}>
      <Star className={`${iconSize} edu-star fill-current`} aria-hidden="true" />
      <span className={`font-semibold ${size === "sm" ? "text-xs" : "text-sm"} text-foreground`}>{rating}</span>
      {count !== undefined && (
        <span className={`${size === "sm" ? "text-xs" : "text-sm"} text-muted-foreground`}>({count.toLocaleString()})</span>
      )}
    </div>
  );
}
