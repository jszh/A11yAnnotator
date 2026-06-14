import { Link } from "react-router-dom";

interface ArticleCardProps {
  title: string;
  excerpt: string;
  tag: string;
  author: string;
  date: string;
  readTime: string;
  imageUrl?: string;
  href?: string;
  featured?: boolean;
}

export default function ArticleCard({
  title,
  excerpt,
  tag,
  author,
  date,
  readTime,
  imageUrl,
  href = "/mass-media/article",
  featured = false,
}: ArticleCardProps) {
  return (
    <article className={`group ${featured ? "" : "border-b border-border pb-6"}`}>
      <Link to={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm">
        {imageUrl && (
          <div className={`overflow-hidden rounded-sm mb-3 ${featured ? "aspect-[16/9]" : "aspect-[3/2]"}`}>
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <div>
          <span className="inline-block px-2 py-0.5 text-[10px] font-sans font-bold uppercase tracking-wider bg-muted text-muted-foreground rounded-sm mb-2">
            {tag}
          </span>
          <h3 className={`font-serif font-bold leading-tight group-hover:text-primary transition-colors ${featured ? "text-2xl md:text-3xl mb-3" : "text-lg mb-2"}`}>
            {title}
          </h3>
          <p className="text-sm font-sans text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {excerpt}
          </p>
          <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
            <span className="font-medium text-foreground/70">{author}</span>
            <span aria-hidden="true">&middot;</span>
            <time>{date}</time>
            <span aria-hidden="true">&middot;</span>
            <span>{readTime}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}